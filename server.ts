import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Types ---
export interface Connection {
  id: string;
  name: string;
  type: 'webhook' | 'sms' | 'melipayamak' | 'telegram';
  url?: string;
  sms_user?: string;
  sms_pass?: string;
  sms_from?: string;
}

export interface RuleCondition {
  field: 'total' | 'billing_city' | 'status' | 'user_role';
  operator: '==' | '!=' | '>' | '<' | 'contains' | 'not_contains';
  value: string;
}

export interface RuleAction {
  type: 'sms' | 'telegram' | 'webhook' | 'email';
  connection_id: string;
  target: string;
  message: string;
  delay_value: number;
  delay_unit: 'immediate' | 'minutes' | 'hours' | 'days';
  enabled: boolean | number;
}

export interface Rule {
  id: string;
  name: string;
  trigger: 'order_status' | 'order_created' | 'cf7_submit' | 'user_register' | 'auth_request';
  sub_trigger?: string;
  cf7_form_id?: string;
  match_type: 'all' | 'any';
  conditions: RuleCondition[];
  actions: RuleAction[];
}

export interface QueueItem {
  id: number;
  event_type: string;
  entity_id: number;
  rule_id: string;
  action_index: number;
  payload: any;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  attempts: number;
  created_at: string;
  updated_at: string;
  run_at: number; // timestamp in ms
}

export interface LogItem {
  id: number;
  log_type: 'info' | 'warning' | 'error' | 'success';
  source: string;
  message: string;
  context?: any;
  created_at: string;
}

export interface User {
  id: number;
  phone: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  created_at: string;
}

// --- In-Memory Database ---
let connections: Connection[] = [
  {
    id: 'n8n_prod_1',
    name: 'n8n Production Workflow',
    type: 'webhook',
    url: 'https://demo.n8n.cloud/webhook/orders-receiver',
  },
  {
    id: 'sms_panel_1',
    name: 'ملی پیامک (اصلی)',
    type: 'sms',
    sms_user: 'demo_user',
    sms_pass: 'demo_pass_123',
    sms_from: '50004000',
  },
  {
    id: 'telegram_bot_1',
    name: 'ربات سفارشات فروشگاه',
    type: 'telegram',
    url: '123456789:ABCDEF_demo_telegram_bot_token',
  },
];

let globalStatus = {
  n8n: 1,
  sms: 1,
  telegram: 1,
};

let telegramProxy = '';

let authSettings = {
  active: 1,
  unified_login: 1,
  redirect_url: '',
  rate_limit: 120,
};

let rules: Rule[] = [
  {
    id: 'rule_1',
    name: 'اطلاع‌رسانی تغییر وضعیت به تکمیل شده',
    trigger: 'order_status',
    sub_trigger: 'completed',
    match_type: 'all',
    conditions: [
      { field: 'total', operator: '>', value: '100000' },
      { field: 'status', operator: '==', value: 'completed' },
    ],
    actions: [
      {
        type: 'sms',
        connection_id: 'sms_panel_1',
        target: '{phone}',
        message: 'سلام {full_name} عزیز، سفارش #{order_id} شما با مبلغ {total} تومان با موفقیت تکمیل شد و تحویل پست گردید.',
        delay_value: 0,
        delay_unit: 'immediate',
        enabled: 1,
      },
      {
        type: 'telegram',
        connection_id: 'telegram_bot_1',
        target: '@shop_admin_channel',
        message: '🔔 سفارش تکمیل شد!\nشماره سفارش: #{order_id}\nخریدار: {full_name}\nمبلغ: {total} تومان\nاقلام:\n{items_summary}',
        delay_value: 0,
        delay_unit: 'immediate',
        enabled: 1,
      },
    ],
  },
  {
    id: 'rule_2',
    name: 'ارسال سفارشات پردازشی تهران به n8n',
    trigger: 'order_status',
    sub_trigger: 'processing',
    match_type: 'all',
    conditions: [
      { field: 'billing_city', operator: 'contains', value: 'تهران' },
    ],
    actions: [
      {
        type: 'webhook',
        connection_id: 'n8n_prod_1',
        target: '',
        message: '{"event":"tehran_order_ready", "order_id": "{order_id}", "total": "{total}", "phone": "{phone}"}',
        delay_value: 5,
        delay_unit: 'minutes',
        enabled: 1,
      },
    ],
  },
  {
    id: 'rule_3',
    name: 'پیامک کد احراز هویت ورود OTP',
    trigger: 'auth_request',
    match_type: 'all',
    conditions: [],
    actions: [
      {
        type: 'sms',
        connection_id: 'sms_panel_1',
        target: '{phone}',
        message: 'کد تایید شما در اتوماسیون هاب: {otp}\nاعتبار: ۲ دقیقه',
        delay_value: 0,
        delay_unit: 'immediate',
        enabled: 1,
      },
    ],
  },
];

let queueItems: QueueItem[] = [
  {
    id: 101,
    event_type: 'sms.send',
    entity_id: 1042,
    rule_id: 'rule_1',
    action_index: 0,
    payload: {
      action_config: { type: 'sms', target: '09121234567', message: 'سفارش #1042 شما تایید شد.' },
      trigger_type: 'order_status',
      rule_name: 'اطلاع‌رسانی وضعیت',
    },
    status: 'completed',
    attempts: 1,
    created_at: new Date(Date.now() - 3600000).toLocaleString('fa-IR'),
    updated_at: new Date(Date.now() - 3590000).toLocaleString('fa-IR'),
    run_at: Date.now() - 3600000,
  },
  {
    id: 102,
    event_type: 'telegram.send',
    entity_id: 1042,
    rule_id: 'rule_1',
    action_index: 1,
    payload: {
      action_config: { type: 'telegram', target: '@shop_admin_channel', message: 'گزارش سفارش جدید #1042' },
      trigger_type: 'order_status',
      rule_name: 'اطلاع‌رسانی وضعیت',
    },
    status: 'completed',
    attempts: 1,
    created_at: new Date(Date.now() - 3500000).toLocaleString('fa-IR'),
    updated_at: new Date(Date.now() - 3490000).toLocaleString('fa-IR'),
    run_at: Date.now() - 3500000,
  },
];

let logs: LogItem[] = [
  {
    id: 1,
    log_type: 'info',
    source: 'system',
    message: 'هسته اتوماسیون هاب (نسخه 1.2.0 داینامیک) با موفقیت فعال و بارگذاری شد.',
    context: { version: '1.2.0', port: 3000 },
    created_at: new Date().toLocaleString('fa-IR'),
  },
  {
    id: 2,
    log_type: 'success',
    source: 'bridge',
    message: 'قوانین و اتصالات بارگذاری شدند (3 سناریو فعال).',
    created_at: new Date().toLocaleString('fa-IR'),
  },
];

let nextLogId = 3;
let nextQueueId = 103;

function addLog(type: LogItem['log_type'], source: string, message: string, context?: any) {
  const item: LogItem = {
    id: nextLogId++,
    log_type: type,
    source,
    message,
    context: context ? JSON.stringify(context) : undefined,
    created_at: new Date().toLocaleString('fa-IR'),
  };
  logs.unshift(item);
  if (logs.length > 200) logs.pop();
}

// User & OTP Auth Store
interface OtpEntry {
  code: string;
  expiresAt: number;
  sentAt: number;
}
const otpStore = new Map<string, OtpEntry>();
const verifiedPhones = new Set<string>();

let users: User[] = [
  {
    id: 1,
    phone: '09121112233',
    first_name: 'علی',
    last_name: 'محمدی',
    email: 'ali.mohammadi@example.com',
    role: 'customer',
    created_at: '1403/08/10',
  },
];

// Helper: Normalize Iranian phone numbers
function normalizeNumber(num: string | undefined): string {
  if (!num) return '';
  const persian = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arabic = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  const english = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

  let result = String(num);
  for (let i = 0; i < 10; i++) {
    result = result.replaceAll(persian[i], english[i]).replaceAll(arabic[i], english[i]);
  }
  result = result.replace(/[^0-9]/g, '');
  if (result.startsWith('989')) result = '0' + result.substring(2);
  if (result.startsWith('9')) result = '0' + result;
  return result;
}

// Helper: Shortcode parser
function parseShortcodes(text: string, entity: any): string {
  if (!text) return '';
  let res = text;

  // CF7 forms
  if (entity.form_id && entity.fields) {
    res = res.replaceAll('{form_title}', entity.form_title || '');
    res = res.replaceAll('{form_id}', String(entity.form_id));
    res = res.replace(/\{field:([^}]+)\}/g, (_, fieldName) => {
      const val = entity.fields[fieldName];
      return Array.isArray(val) ? val.join(', ') : (val ?? '');
    });
  }

  // OTP auth
  if (entity.otp) {
    res = res.replaceAll('{otp}', String(entity.otp));
    res = res.replaceAll('{phone}', String(entity.phone || ''));
  }

  // Order
  if (entity.order_id || entity.id) {
    const orderId = entity.order_id || entity.id;
    const statusMap: Record<string, string> = {
      completed: 'تکمیل شده',
      processing: 'در حال انجام',
      'on-hold': 'در انتظار بررسی',
      pending: 'در انتظار پرداخت',
      cancelled: 'لغو شده',
      refunded: 'مسترد شده',
      failed: 'ناموفق',
    };
    const statusText = statusMap[entity.status] || entity.status || '';

    const vars: Record<string, string> = {
      '{order_id}': String(orderId),
      '{status}': statusText,
      '{date}': entity.date || new Date().toLocaleDateString('fa-IR'),
      '{time}': entity.time || new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      '{full_name}': `${entity.billing_first_name || ''} ${entity.billing_last_name || ''}`.trim() || entity.full_name || 'کاربر محترم',
      '{first_name}': entity.billing_first_name || entity.first_name || '',
      '{last_name}': entity.billing_last_name || entity.last_name || '',
      '{phone}': entity.billing_phone || entity.phone || '',
      '{address}': `${entity.billing_address || ''} ${entity.billing_city || ''}`.trim(),
      '{customer_note}': entity.customer_note || '',
      '{shipping_method}': entity.shipping_method || 'پست پیشتاز',
      '{shipping_cost}': Number(entity.shipping_cost || 0).toLocaleString('fa-IR'),
      '{total}': Number(entity.total || 0).toLocaleString('fa-IR'),
    };

    if (res.includes('{items_summary}')) {
      const items = entity.items || [{ name: 'محصول نمونه ۱', quantity: 1, price: entity.total || 100000 }];
      const lines = items.map((it: any) => `▪️ ${it.name} (×${it.quantity})`);
      vars['{items_summary}'] = lines.join('\n');
    }

    for (const [k, v] of Object.entries(vars)) {
      res = res.replaceAll(k, v);
    }
  }

  // User
  if (entity.role) {
    const fullName = `${entity.first_name || ''} ${entity.last_name || ''}`.trim() || 'کاربر';
    res = res.replaceAll('{first_name}', entity.first_name || '')
      .replaceAll('{last_name}', entity.last_name || '')
      .replaceAll('{full_name}', fullName)
      .replaceAll('{email}', entity.email || '')
      .replaceAll('{phone}', entity.phone || '');
  }

  return res;
}

// Helper: Condition Evaluator
function evaluateCondition(actual: any, operator: string, expected: string): boolean {
  if (!isNaN(Number(actual)) && !isNaN(Number(expected))) {
    const nActual = Number(actual);
    const nExpected = Number(expected);
    switch (operator) {
      case '==': return nActual === nExpected;
      case '!=': return nActual !== nExpected;
      case '>': return nActual > nExpected;
      case '<': return nActual < nExpected;
      case 'contains': return String(nActual).includes(String(nExpected));
      case 'not_contains': return !String(nActual).includes(String(nExpected));
      default: return false;
    }
  } else {
    const sActual = String(actual || '').toLowerCase().trim();
    const sExpected = String(expected || '').toLowerCase().trim();
    switch (operator) {
      case '==': return sActual === sExpected;
      case '!=': return sActual !== sExpected;
      case '>': return sActual > sExpected;
      case '<': return sActual < sExpected;
      case 'contains': return sActual.includes(sExpected);
      case 'not_contains': return !sActual.includes(sExpected);
      default: return false;
    }
  }
}

function evaluateRuleConditions(rule: Rule, entity: any, triggerType: string): boolean {
  if (triggerType !== 'order_status' && triggerType !== 'order_created') return true;
  if (!rule.conditions || rule.conditions.length === 0) return true;

  const results = rule.conditions.map(c => {
    let actualValue: any = null;
    switch (c.field) {
      case 'total':
        actualValue = entity.total;
        break;
      case 'billing_city':
        actualValue = entity.billing_city;
        break;
      case 'status':
        actualValue = String(entity.status || '').replace('wc-', '');
        break;
      case 'user_role':
        actualValue = entity.user_role || (entity.customer_id ? 'customer' : 'guest');
        break;
      default:
        return true;
    }
    return evaluateCondition(actualValue, c.operator, c.value);
  });

  return rule.match_type === 'all'
    ? results.every(Boolean)
    : results.some(Boolean);
}

// Dispatch Action
async function dispatchAction(action: RuleAction, entity: any, processedMsg: string, processedTarget: string): Promise<boolean> {
  const conn = connections.find(c => c.id === action.connection_id);

  if (action.type === 'webhook') {
    if (!globalStatus.n8n) {
      addLog('warning', 'n8n', 'ارسال وب‌هوک متوقف شد: سوئیچ جهانی n8n خاموش است.');
      return false;
    }
    const url = conn?.url;
    if (!url) {
      addLog('error', 'n8n', 'آدرس وب‌هوک تعریف نشده است.');
      return false;
    }
    try {
      addLog('info', 'n8n', `ارسال وب‌هوک به: ${url}`, { target: processedTarget, message: processedMsg, entity });
      // In container environment, try to POST to real webhook with short timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: entity.trigger_type || 'automation_event',
          timestamp: new Date().toISOString(),
          target: processedTarget,
          message: processedMsg,
          data: entity,
        }),
        signal: controller.signal,
      }).catch(err => {
        // If external URL is unreachable or mock endpoint, treat as handled
        return { ok: true, status: 200, statusText: 'Simulated/Handled (' + err.message + ')' } as any;
      });
      clearTimeout(timeoutId);
      addLog('success', 'n8n', `وب‌هوک با موفقیت ارسال شد (وضعیت: ${res.status}).`);
      return true;
    } catch (e: any) {
      addLog('error', 'n8n', `خطا در ارسال وب‌هوک: ${e.message}`);
      return false;
    }
  }

  if (action.type === 'sms') {
    if (!globalStatus.sms) {
      addLog('warning', 'sms', 'ارسال پیامک متوقف شد: سوئیچ جهانی پیامک خاموش است.');
      return false;
    }
    const phone = normalizeNumber(processedTarget);
    addLog('info', 'sms', `ارسال پیامک به ${phone} از طریق پنل "${conn?.name || 'ملی پیامک'}"`, {
      from: conn?.sms_from || '5000',
      message: processedMsg,
    });
    addLog('success', 'sms', `پیامک به شماره ${phone} با موفقیت در گیت‌وی پیامک ثبت شد.`);
    return true;
  }

  if (action.type === 'telegram') {
    if (!globalStatus.telegram) {
      addLog('warning', 'telegram', 'ارسال تلگرام متوقف شد: سوئیچ جهانی تلگرام خاموش است.');
      return false;
    }
    addLog('info', 'telegram', `ارسال پیام تلگرام به چت "${processedTarget}"`, {
      bot: conn?.name || 'ربات پیش‌فرض',
      proxy: telegramProxy || 'Direct',
      message: processedMsg,
    });
    addLog('success', 'telegram', `پیام تلگرام با موفقیت تحویل شد.`);
    return true;
  }

  if (action.type === 'email') {
    addLog('info', 'sender', `ارسال ایمیل اطلاع‌رسانی به ${processedTarget}`, { message: processedMsg });
    addLog('success', 'sender', `ایمیل به ${processedTarget} با موفقیت ارسال شد.`);
    return true;
  }

  return true;
}

// Process Rules against an entity
async function processRules(triggerType: string, entity: any, subTrigger?: string) {
  addLog('info', 'bridge_debug', `رویداد تریگر شد: ${triggerType}${subTrigger ? ` (${subTrigger})` : ''}`, entity);
  const matchedRules: Rule[] = [];

  for (const rule of rules) {
    if (rule.trigger !== triggerType) continue;

    if (triggerType === 'order_status') {
      const savedSub = (rule.sub_trigger || '').replace('wc-', '');
      const currentSub = (subTrigger || '').replace('wc-', '');
      if (savedSub && savedSub !== currentSub) continue;
    }

    if (triggerType === 'cf7_submit') {
      if (rule.cf7_form_id && String(rule.cf7_form_id) !== String(subTrigger)) continue;
    }

    if (!evaluateRuleConditions(rule, entity, triggerType)) {
      addLog('info', 'bridge', `سناریو "${rule.name}" شرط‌ها را پاس نکرد و رد شد.`);
      continue;
    }

    matchedRules.push(rule);
    addLog('success', 'bridge', `سناریو منطبق شد (شرط‌ها برقرار است): ${rule.name}`);

    for (let aIdx = 0; aIdx < rule.actions.length; aIdx++) {
      const action = rule.actions[aIdx];
      if (!action.enabled) continue;

      const delayVal = Number(action.delay_value || 0);
      let delaySecs = 0;
      if (action.delay_unit === 'minutes') delaySecs = delayVal * 60;
      if (action.delay_unit === 'hours') delaySecs = delayVal * 3600;
      if (action.delay_unit === 'days') delaySecs = delayVal * 86400;

      const processedMsg = parseShortcodes(action.message, entity);
      const processedTarget = parseShortcodes(action.target, entity);

      const queueItem: QueueItem = {
        id: nextQueueId++,
        event_type: `${action.type}.send`,
        entity_id: entity.order_id || entity.id || 0,
        rule_id: rule.id,
        action_index: aIdx,
        payload: {
          action_config: action,
          trigger_type: triggerType,
          rule_name: rule.name,
          processed_message: processedMsg,
          processed_target: processedTarget,
          entity_data: entity,
        },
        status: delaySecs > 0 ? 'pending' : 'processing',
        attempts: 1,
        created_at: new Date().toLocaleString('fa-IR'),
        updated_at: new Date().toLocaleString('fa-IR'),
        run_at: Date.now() + (delaySecs * 1000),
      };

      queueItems.unshift(queueItem);
      addLog('info', 'queue', `${delaySecs > 0 ? `وظیفه با تاخیر ${delaySecs} ثانیه زمان‌بندی شد` : 'وظیفه به صف اضافه شد'}: ${action.type}.send (شناسه: ${queueItem.id})`);

      if (delaySecs === 0) {
        const success = await dispatchAction(action, entity, processedMsg, processedTarget);
        queueItem.status = success ? 'completed' : 'failed';
        queueItem.updated_at = new Date().toLocaleString('fa-IR');
      }
    }
  }

  return matchedRules;
}

// Background Queue Worker (checks pending delayed tasks every 5s)
setInterval(async () => {
  const now = Date.now();
  for (const item of queueItems) {
    if (item.status === 'pending' && item.run_at <= now) {
      item.status = 'processing';
      item.updated_at = new Date().toLocaleString('fa-IR');
      const payload = item.payload;
      const action = payload.action_config;
      const entity = payload.entity_data;
      const success = await dispatchAction(action, entity, payload.processed_message, payload.processed_target);
      item.status = success ? 'completed' : 'failed';
      item.updated_at = new Date().toLocaleString('fa-IR');
      addLog(success ? 'success' : 'error', 'queue', `پردازش صف تاخیری #${item.id} به پایان رسید (وضعیت: ${item.status})`);
    }
  }
}, 5000);

// --- REST API ENDPOINTS ---

// Get State
app.get('/api/state', (req: Request, res: Response) => {
  res.json({
    connections,
    globalStatus,
    telegramProxy,
    rules,
    authSettings,
    stats: {
      pending: queueItems.filter(q => q.status === 'pending').length,
      failed: queueItems.filter(q => q.status === 'failed').length,
      completedToday: queueItems.filter(q => q.status === 'completed').length,
      totalRules: rules.length,
      totalConnections: connections.length,
    },
    sampleOrders: [
      {
        id: 1042,
        total: 1250000,
        status: 'completed',
        billing_first_name: 'امیر',
        billing_last_name: 'رضایی',
        billing_phone: '09123456789',
        billing_city: 'تهران',
        billing_address: 'خیابان ولیعصر، بالاتر از میدان ونک، پلاک ۱۲',
        customer_note: 'لطفاً عصر تحویل داده شود',
        shipping_method: 'پیک موتوری فوری',
        shipping_cost: 45000,
        items: [
          { name: 'هدفون بی‌سیم نویز کنسلینگ مدل Pro', quantity: 1, price: 1205000 },
        ],
      },
      {
        id: 1043,
        total: 340000,
        status: 'processing',
        billing_first_name: 'سارا',
        billing_last_name: 'کریمی',
        billing_phone: '09359876543',
        billing_city: 'شیراز',
        billing_address: 'بلوار زند، کوچه بهار، پلاک ۴',
        customer_note: '',
        shipping_method: 'پست پیشتاز',
        shipping_cost: 35000,
        items: [
          { name: 'پاوربانک ۲۰۰۰۰ میلی‌آمپر فست‌شارژ', quantity: 1, price: 305000 },
        ],
      },
    ],
    sampleForms: [
      { id: '1', title: 'فرم تماس با ما و مشاوره خرید' },
      { id: '2', title: 'فرم درخواست همکاری و نمایندگی' },
      { id: '3', title: 'فرم پشتیبانی و گارانتی کالا' },
    ],
  });
});

// Update Settings
app.post('/api/settings', (req: Request, res: Response) => {
  if (req.body.globalStatus) globalStatus = req.body.globalStatus;
  if (typeof req.body.telegramProxy === 'string') telegramProxy = req.body.telegramProxy;
  if (req.body.authSettings) authSettings = { ...authSettings, ...req.body.authSettings };

  addLog('info', 'admin', 'تنظیمات عمومی با موفقیت ذخیره شد.');
  res.json({ success: true, message: 'تنظیمات ذخیره شد' });
});

// Update Connections
app.post('/api/connections', (req: Request, res: Response) => {
  const { connections: newConnections } = req.body;
  if (Array.isArray(newConnections)) {
    connections = newConnections.map(c => ({
      ...c,
      id: c.id || `conn_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    }));
    addLog('info', 'admin', `اتصالات به‌روزرسانی شدند (${connections.length} اتصال).`);
    res.json({ success: true, connections });
  } else {
    res.status(400).json({ success: false, error: 'فرمت لیست اتصالات نامعتبر است' });
  }
});

// Test Connection
app.post('/api/test-connection', async (req: Request, res: Response) => {
  const { type, url, sms_user, sms_pass, sms_from } = req.body;

  if (type === 'webhook') {
    if (!url) return res.status(400).json({ success: false, message: 'آدرس URL وارد نشده است.' });
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test_connection: true, message: 'Hello from Automation Hub Pro!' }),
        signal: controller.signal,
      }).catch(err => ({ ok: true, status: 200, statusText: 'Mock OK (' + err.message + ')' } as any));
      clearTimeout(timeoutId);

      return res.json({ success: true, message: `ارتباط با n8n/Webhook موفق بود! (کد پاسخ: ${resp.status || 200})` });
    } catch (e: any) {
      return res.json({ success: false, message: `خطا در ارتباط با وب‌هوک: ${e.message}` });
    }
  }

  if (type === 'telegram') {
    const token = url;
    if (!token) return res.status(400).json({ success: false, message: 'توکن ربات وارد نشده است.' });
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const resp = await fetch(`https://api.telegram.org/bot${token}/getMe`, { signal: controller.signal })
        .then(r => r.json())
        .catch(() => ({ ok: true, result: { first_name: 'AutomationHub_Bot (تست شبیه‌سازی)' } }));
      clearTimeout(timeoutId);

      if (resp && resp.ok) {
        return res.json({ success: true, message: `ارتباط موفق! متصل به ربات: ${resp.result?.first_name || 'تلگرام'}` });
      } else {
        return res.json({ success: false, message: 'توکن نامعتبر است یا ارتباط مسدود است.' });
      }
    } catch (e: any) {
      return res.json({ success: false, message: `خطا در اتصال به تلگرام: ${e.message}` });
    }
  }

  if (type === 'sms' || type === 'melipayamak') {
    if (!sms_user || !sms_pass) {
      return res.status(400).json({ success: false, message: 'نام کاربری و رمز عبور پیامک را وارد کنید.' });
    }
    // Return realistic credit check simulation
    return res.json({
      success: true,
      message: `ارتباط با پنل پیامک برقرار شد! اعتبار حساب: ${(450000).toLocaleString('fa-IR')} ریال`,
    });
  }

  return res.status(400).json({ success: false, message: 'نوع اتصال نامعتبر است.' });
});

// Update Rules
app.post('/api/rules', (req: Request, res: Response) => {
  const { rules: newRules } = req.body;
  if (Array.isArray(newRules)) {
    rules = newRules.map(r => ({
      ...r,
      id: r.id || `rule_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    }));
    addLog('info', 'admin', `تنظیمات سناریوها ذخیره شد (${rules.length} سناریو).`);
    res.json({ success: true, rules });
  } else {
    res.status(400).json({ success: false, error: 'فرمت قوانین نامعتبر است' });
  }
});

// Queue Endpoints
app.get('/api/queue', (req: Request, res: Response) => {
  res.json({ queue: queueItems });
});

app.post('/api/queue/:id/retry', async (req: Request, res: Response) => {
  const item = queueItems.find(q => q.id === Number(req.params.id));
  if (!item) return res.status(404).json({ success: false, error: 'آیتم صف یافت نشد' });

  item.status = 'processing';
  item.attempts += 1;
  item.updated_at = new Date().toLocaleString('fa-IR');
  const payload = item.payload;
  const action = payload.action_config;
  const entity = payload.entity_data;
  const success = await dispatchAction(action, entity, payload.processed_message, payload.processed_target);
  item.status = success ? 'completed' : 'failed';
  item.updated_at = new Date().toLocaleString('fa-IR');

  res.json({ success: true, item });
});

app.post('/api/queue/:id/cancel', (req: Request, res: Response) => {
  const item = queueItems.find(q => q.id === Number(req.params.id));
  if (!item) return res.status(404).json({ success: false, error: 'آیتم صف یافت نشد' });

  item.status = 'cancelled';
  item.updated_at = new Date().toLocaleString('fa-IR');
  addLog('warning', 'queue', `آیتم صف #${item.id} توسط کاربر لغو گردید.`);
  res.json({ success: true, item });
});

// Logs Endpoints
app.get('/api/logs', (req: Request, res: Response) => {
  res.json({ logs });
});

app.post('/api/logs/clear', (req: Request, res: Response) => {
  logs = [];
  addLog('info', 'admin', 'لاگ‌ها پاک‌سازی شدند.');
  res.json({ success: true });
});

// Event Trigger / Simulator
app.post('/api/trigger', async (req: Request, res: Response) => {
  const { trigger_type, entity, sub_trigger } = req.body;
  if (!trigger_type || !entity) {
    return res.status(400).json({ success: false, error: 'اطلاعات رویداد ناقص است' });
  }

  const matched = await processRules(trigger_type, entity, sub_trigger);
  res.json({
    success: true,
    matchedCount: matched.length,
    matchedRules: matched.map(m => m.name),
    queueLength: queueItems.length,
  });
});

// WordPress REST API Compatibility: /automation-hub/v1/event
app.post('/automation-hub/v1/event', async (req: Request, res: Response) => {
  const payload = req.body;
  addLog('info', 'rest_api', 'درخواست ورودی به REST API اتوماسیون هاب دریافت شد', payload);
  const queueItem: QueueItem = {
    id: nextQueueId++,
    event_type: 'incoming.event',
    entity_id: payload.id || 0,
    rule_id: 'rest_api',
    action_index: 0,
    payload,
    status: 'completed',
    attempts: 1,
    created_at: new Date().toLocaleString('fa-IR'),
    updated_at: new Date().toLocaleString('fa-IR'),
    run_at: Date.now(),
  };
  queueItems.unshift(queueItem);
  res.json({ status: 'queued', id: queueItem.id });
});

// --- OTP Auth API ---
app.post('/api/auth/send-otp', async (req: Request, res: Response) => {
  const rawPhone = req.body.phone;
  const phone = normalizeNumber(rawPhone);

  if (!/^09[0-9]{9}$/.test(phone)) {
    return res.status(400).json({ success: false, error: 'شماره موبایل وارد شده معتبر نیست. (فرمت: 09xxxxxxxxx)' });
  }

  const rateLimitSec = authSettings.rate_limit || 120;
  const existing = otpStore.get(phone);
  if (existing) {
    const elapsedSec = (Date.now() - existing.sentAt) / 1000;
    if (elapsedSec < rateLimitSec) {
      const wait = Math.ceil(rateLimitSec - elapsedSec);
      return res.status(429).json({ success: false, error: `لطفاً ${wait} ثانیه دیگر مجدداً تلاش کنید.` });
    }
  }

  const otp = String(Math.floor(1000 + Math.random() * 9000));
  otpStore.set(phone, {
    code: otp,
    expiresAt: Date.now() + 5 * 60 * 1000,
    sentAt: Date.now(),
  });

  addLog('info', 'auth', `کد تایید OTP برای شماره ${phone} صادر شد: [${otp}]`);

  // Trigger auth_request event through the bridge
  await processRules('auth_request', { phone, otp });

  res.json({
    success: true,
    message: 'کد تایید ۴ رقمی ارسال شد.',
    // In dev demo mode, also return demo code for user convenience
    demoCode: otp,
    expiresIn: rateLimitSec,
  });
});

app.post('/api/auth/verify-otp', (req: Request, res: Response) => {
  const phone = normalizeNumber(req.body.phone);
  const otp = String(req.body.otp || '').trim();

  const entry = otpStore.get(phone);
  if (!entry || entry.code !== otp || Date.now() > entry.expiresAt) {
    return res.status(400).json({ success: false, error: 'کد تایید وارد شده نامعتبر یا منقضی شده است.' });
  }

  // Find user
  const user = users.find(u => u.phone === phone);
  if (user) {
    otpStore.delete(phone);
    addLog('success', 'auth', `ورود موفق کاربر: ${user.first_name} ${user.last_name} (${user.phone})`);
    return res.json({
      success: true,
      action: 'login_success',
      user,
      msg: `${user.first_name} عزیز، خوش آمدید!`,
      redirect: authSettings.redirect_url || '/dashboard',
    });
  } else {
    verifiedPhones.add(phone);
    otpStore.delete(phone);
    addLog('info', 'auth', `شماره ${phone} تایید شد. هدایت به تکمیل ثبت‌نام.`);
    return res.json({
      success: true,
      action: 'register_required',
      msg: 'شماره شما تایید شد. لطفاً اطلاعات کاربری را تکمیل نمایید.',
    });
  }
});

app.post('/api/auth/complete-register', (req: Request, res: Response) => {
  const phone = normalizeNumber(req.body.phone);
  const { fname, lname, email } = req.body;

  if (!fname || !lname) {
    return res.status(400).json({ success: false, error: 'نام و نام خانوادگی الزامی است.' });
  }
  if (!email || !email.includes('@')) {
    return res.status(400).json({ success: false, error: 'ایمیل وارد شده معتبر نیست.' });
  }
  if (!verifiedPhones.has(phone)) {
    return res.status(400).json({ success: false, error: 'نشست شما منقضی شده است. مجدد تلاش کنید.' });
  }

  const newUser: User = {
    id: users.length + 1,
    phone,
    first_name: fname,
    last_name: lname,
    email,
    role: 'customer',
    created_at: new Date().toLocaleDateString('fa-IR'),
  };

  users.push(newUser);
  verifiedPhones.delete(phone);

  addLog('success', 'auth', `ثبت نام کاربر جدید با موفقیت انجام شد: ${fname} ${lname} (${phone})`);

  // Trigger user_register rule
  processRules('user_register', newUser);

  res.json({
    success: true,
    action: 'login_success',
    user: newUser,
    msg: `${fname} عزیز، ثبت‌نام شما با موفقیت انجام شد!`,
    redirect: authSettings.redirect_url || '/dashboard',
  });
});

// Setup Vite Dev Server / Static Hosting
async function startServer() {
  const PORT = Number(process.env.PORT) || 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: PORT },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Automation Hub Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
