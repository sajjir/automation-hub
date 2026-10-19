import React, { useState } from 'react';
import {
  Server,
  Zap,
  Bot,
  MessageSquare,
  Users,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Download,
  ShoppingBag,
  Sun,
  Moon,
  Send,
  Eye,
  RefreshCw,
  Search,
  Sparkles,
  Phone,
  Truck,
  Tag,
  Check,
  Layers,
  X,
  Sliders,
  FileCode,
  SlidersHorizontal,
  CornerDownLeft,
  ChevronDown,
  UserCheck,
  UserX,
  Paperclip,
  CheckCheck,
  HelpCircle,
  Plus,
  Trash2,
  GitBranch,
  ArrowRight,
  Headphones,
  ShieldAlert,
  Edit3,
  Flame,
  Volume2,
  ChevronLeft,
  ChevronRight,
  Lock,
  Globe,
  KeyRound,
  Play
} from 'lucide-react';

export default function App() {
  // Theme & View mode
  const [isDark, setIsDark] = useState(true);
  const [currentView, setCurrentView] = useState<'admin' | 'storefront'>('admin');
  const [activeAdminTab, setActiveAdminTab] = useState<'inbox' | 'rules' | 'crm' | 'ai_tools' | 'mcp_queue'>('inbox');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Status
  const [n8nPing, setN8nPing] = useState<number>(18);
  const [isPinging, setIsPinging] = useState(false);
  const [copiedEndpoint, setCopiedEndpoint] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // =========================================================================
  // TAB 1: UNIFIED LIVE INBOX & CHAT STATE
  // =========================================================================
  const [inboxFilter, setInboxFilter] = useState<'all' | 'operator' | 'ai' | 'warranty' | 'order' | 'product'>('all');
  const [selectedChatId, setSelectedChatId] = useState<string>('chat_1');
  const [operatorOverride, setOperatorOverride] = useState<Record<string, boolean>>({
    chat_1: false,
    chat_2: true,
    chat_3: false
  });
  const [operatorReply, setOperatorReply] = useState('');
  const [operatorNotes, setOperatorNotes] = useState<Record<string, string>>({
    chat_1: 'مشتری در مورد تاخیر کد رهگیری پستی ووکامرس سوال داشت، پیگیری انجام شد.',
    chat_2: 'درخواست تعویض پد هدفون تحت گارانتی ۲۴ ماهه طلایی.',
    chat_3: 'پرسش فنی در مورد کدک LDAC و سازگاری با آیفون.'
  });

  const [conversations, setConversations] = useState<Array<{
    id: string;
    userName: string;
    userPhone: string;
    isGuest: boolean;
    department: 'warranty' | 'order' | 'support' | 'product';
    departmentLabel: string;
    orderId: string | null;
    status: 'ai' | 'operator' | 'resolved';
    hasUnread: boolean;
    lastTime: string;
    avatarBg: string;
    city: string;
    ltv: string;
    tags: string[];
    messages: Array<{
      id: string;
      sender: 'user' | 'ai' | 'operator';
      senderName?: string;
      text: string;
      time: string;
      card?: {
        type: 'tracking' | 'product';
        title: string;
        code?: string;
        statusText?: string;
        price?: string;
      };
    }>;
  }>>([
    {
      id: 'chat_1',
      userName: 'علی رضایی',
      userPhone: '09121112233',
      isGuest: false,
      department: 'order',
      departmentLabel: 'پیگیری سفارش',
      orderId: '۱۰۴۲',
      status: 'ai',
      hasUnread: true,
      lastTime: '۲ دقیقه پیش',
      avatarBg: 'bg-purple-600',
      city: 'تهران - منطقه ۴',
      ltv: '۱۸,۵۰۰,۰۰۰ تومان',
      tags: ['مشتری وفادار', 'سفارش ثبت‌شده', 'حساس به زمان'],
      messages: [
        { id: 'm1', sender: 'user', text: 'سلام، سفارش هدفون سونی من کجاست؟ شماره سفارش ۱۰۴۲ است.', time: '۱۴:۳۲' },
        {
          id: 'm2',
          sender: 'ai',
          senderName: 'هوش مصنوعی Automation Hub',
          text: 'سلام جناب رضایی عزیز! سفارش شما بررسی شد و به مامور پست تحویل داده شده است.',
          time: '۱۴:۳۲',
          card: {
            type: 'tracking',
            title: 'سفارش #۱۰۴۲ ووکامرس فارسی',
            code: '284910293849102948291048',
            statusText: 'تحویل به پستچی منطقه ۴'
          }
        },
        { id: 'm3', sender: 'user', text: 'بسیار عالی، حدودا چه ساعتی به دستم می‌رسه؟', time: '۱۴:۳۴' }
      ]
    },
    {
      id: 'chat_2',
      userName: 'مهدی کریمی',
      userPhone: '09124458921',
      isGuest: true,
      department: 'warranty',
      departmentLabel: 'بخش گارانتی',
      orderId: '۱۰۳۸',
      status: 'operator',
      hasUnread: true,
      lastTime: '۵ دقیقه پیش',
      avatarBg: 'bg-rose-600',
      city: 'اصفهان',
      ltv: '۲۹,۰۰۰,۰۰۰ تومان',
      tags: ['کاربر مهمان (احراز با کپچا)', 'درخواست گارانتی', 'نیازمند بررسی'],
      messages: [
        { id: 'm4', sender: 'user', text: 'سلام، هدست من پد گوشی سمت راستش باز شده. شرایط گارانتی چطوره؟', time: '۱۴:۲۵' },
        { id: 'm5', sender: 'operator', senderName: 'پشتیبان گارانتی (سارا)', text: 'سلام جناب کریمی، دستگاه شما شامل گارانتی ۲۴ ماهه طلایی تعویض فوری است. لطفا عکس محصول را ارسال فرمایید.', time: '۱۴:۲۸' }
      ]
    },
    {
      id: 'chat_3',
      userName: 'نیما صادقی',
      userPhone: '09358129034',
      isGuest: true,
      department: 'product',
      departmentLabel: 'مشاوره صفحه محصول',
      orderId: null,
      status: 'ai',
      hasUnread: false,
      lastTime: '۲۵ دقیقه پیش',
      avatarBg: 'bg-emerald-600',
      city: 'شیراز',
      ltv: '۰ تومان (لید جدید)',
      tags: ['مشاوره خرید', 'کاربر مهمان', 'حساس به باتری'],
      messages: [
        { id: 'm6', sender: 'user', text: 'آیا هدفون سونی XM5 با آیفون و لپ‌تاپ همزمان وصل میشه؟', time: '۱۴:۰۵' },
        { id: 'm7', sender: 'ai', senderName: 'دستیار مشاور محصول', text: 'بله کاملا! قابلیت Multipoint Connection به شما این امکان را می‌دهد تا همزمان به گوشی و مک‌بوک یا پی‌سی متصل باشید و به محض زنگ خوردن تماس، صدا خودکار سوئیچ شود.', time: '۱۴:۰۶' }
      ]
    }
  ]);

  const activeChat = conversations.find(c => c.id === selectedChatId) || conversations[0];

  const handleSendOperatorMessage = () => {
    if (!operatorReply.trim()) return;
    const newMsg = {
      id: 'm_' + Date.now(),
      sender: 'operator' as const,
      senderName: 'مدیر فروشگاه (شما)',
      text: operatorReply.trim(),
      time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
    };

    setConversations(prev => prev.map(c => {
      if (c.id === selectedChatId) {
        return {
          ...c,
          hasUnread: false,
          lastTime: 'هم‌اکنون',
          messages: [...c.messages, newMsg]
        };
      }
      return c;
    }));

    setOperatorReply('');
    showToast('پیام شما با موفقیت به مشتری ارسال شد.');
  };

  const handleApplyCanned = (text: string) => {
    setOperatorReply(text);
  };

  // =========================================================================
  // TAB 2: NESTED RULES & NOTIFICATIONS STATE
  // =========================================================================
  const [rules, setRules] = useState([
    {
      id: 'rule_1',
      title: 'هشدار سفارش VIP بالای ۱۰ میلیون تومان به تلگرام مدیر',
      enabled: true,
      runsCount: 142,
      trigger: 'wc_order_created',
      triggerLabel: 'ثبت سفارش جدید در ووکامرس',
      matchType: 'all', // AND
      conditions: [
        { field: 'order_total', operator: '>', value: '10000000', label: 'مجموع سفارش بیشتر از ۱۰,۰۰۰,۰۰۰ تومان' },
        { field: 'payment_method', operator: '==', value: 'online', label: 'روش پرداخت برابر با درگاه آنلاین' }
      ],
      nestedGroup: {
        matchType: 'any', // OR
        conditions: [
          { field: 'customer_city', operator: '==', value: 'تهران', label: 'شهر مقصد برابر با تهران' },
          { field: 'crm_tag', operator: 'contains', value: 'خریدار VIP', label: 'برچسب مشتری شامل VIP' }
        ]
      },
      actions: [
        { channel: 'telegram_admin', target: '@shop_manager_bot', template: '🔔 سفارش VIP جدید!\nمشتری: {customer_name}\nمبلغ: {order_total} تومان\nشهر: {shipping_city}' },
        { channel: 'sms_manager', target: '09120000000', template: 'سفارش طلایی جدید #{order_id} دریافت شد.' }
      ]
    },
    {
      id: 'rule_2',
      title: 'ارسال خودکار پیامک پترنی کد رهگیری پستی به مشتری (Persian WC)',
      enabled: true,
      runsCount: 528,
      trigger: 'persian_wc_tracking_added',
      triggerLabel: 'ثبت کد رهگیری پستی ووکامرس فارسی',
      matchType: 'all',
      conditions: [
        { field: 'tracking_code', operator: '!=', value: '', label: 'کد رهگیری پستی خالی نباشد' },
        { field: 'order_status', operator: '==', value: 'completed', label: 'وضعیت سفارش تکمیل شده' }
      ],
      nestedGroup: null,
      actions: [
        { channel: 'sms_customer', target: '{customer_phone}', template: 'سلام {customer_name} عزیز، مرسوله پستی سفارش #{order_id} با کد رهگیری {tracking_code} ارسال شد.' },
        { channel: 'in_chat', target: '{chat_id}', template: 'کارت وضعیت مرسوله شما در اداره پست به روز شد.' }
      ]
    },
    {
      id: 'rule_3',
      title: 'ارسال پیام به مشتری و پشتیبان هنگام ثبت درخواست در بخش گارانتی',
      enabled: true,
      runsCount: 67,
      trigger: 'chat_warranty_started',
      triggerLabel: 'شروع گفتگو در بخش گارانتی',
      matchType: 'all',
      conditions: [
        { field: 'department', operator: '==', value: 'warranty', label: 'دپارتمان انتخاب‌شده برابر با بخش گارانتی' }
      ],
      nestedGroup: {
        matchType: 'all',
        conditions: [
          { field: 'has_order_id', operator: '==', value: 'true', label: 'کاربر شماره سفارش را وارد کرده است' }
        ]
      },
      actions: [
        { channel: 'in_chat', target: '{chat_id}', template: 'درخواست گارانتی سفارش #{order_id} ثبت شد. کارشناس مربوطه تا دقایقی دیگر پاسخ خواهد داد.' },
        { channel: 'n8n_webhook', target: 'https://n8n.cloud/webhook/warranty-alert', template: '{"event":"warranty_claim","order":"{order_id}"}' }
      ]
    }
  ]);

  // Visual Rule Builder Active State
  const [isCreatingRule, setIsCreatingRule] = useState(false);
  const [editingRuleIndex, setEditingRuleIndex] = useState<number>(0);
  const activeRule = rules[editingRuleIndex] || rules[0];

  const handleAITonePolish = (ruleIdx: number, actionIdx: number) => {
    const updated = [...rules];
    const currentTpl = updated[ruleIdx].actions[actionIdx].template;
    updated[ruleIdx].actions[actionIdx].template = currentTpl + ' ✨ [لحن توسط هوش مصنوعی بسیار محترمانه و ترغیب‌کننده شد]';
    setRules(updated);
    showToast('✨ لحن پیام با الگوریتم کپی‌رایتینگ هوش مصنوعی بهینه‌سازی شد.');
  };

  const handleInsertVariable = (ruleIdx: number, actionIdx: number, tag: string) => {
    const updated = [...rules];
    updated[ruleIdx].actions[actionIdx].template += ` ${tag}`;
    setRules(updated);
  };

  // =========================================================================
  // TAB 3: CRM & CUSTOMER RETENTION STATE
  // =========================================================================
  const [selectedCrmUser, setSelectedCrmUser] = useState<any | null>(null);
  const [crmSearch, setCrmSearch] = useState('');
  const [crmData, setCrmData] = useState([
    {
      id: 'c1',
      name: 'مهدی کریمی',
      phone: '09124458921',
      ltv: '۳۸,۵۰۰,۰۰۰ تومان',
      ordersCount: 4,
      churnRisk: 15,
      lastChat: '۲ ساعت پیش (بخش گارانتی)',
      tags: ['علاقه‌مند به تکنولوژی', 'خریدار VIP', 'حساس به باتری'],
      summary: 'مشتری هدفون سنهایزر داشته و در صفحه XM5 دوبار سوال فنی پرسیده است. پتانسیل خرید نسخه نقره‌ای به همراه لوازم جانبی بالا است.',
      campaignSms: 'مهدی عزیز، کد تخفیف ویژه خرید لوازم جانبی برای شما صادر شد: VIP-MEHDI'
    },
    {
      id: 'c2',
      name: 'سارا امینی',
      phone: '09358129034',
      ltv: '۱۹,۲۰۰,۰۰۰ تومان',
      ordersCount: 2,
      churnRisk: 68,
      lastChat: 'دیروز (ترک صفحه تسویه)',
      tags: ['مردد در خرید', 'حساس به هزینه ارسال', 'سبد رها شده'],
      summary: 'کاربر به دلیل هزینه ارسال سبد خرید را تکمیل نکرده است. با یک کد ارسال رایگان خرید قطعی خواهد شد.',
      campaignSms: 'سارا عزیز، ارسال سفارش شما رایگان شد! با کد SHIP-FREE سبد خرید را نهایی کنید.'
    },
    {
      id: 'c3',
      name: 'امیرحسین رضایی',
      phone: '09193214567',
      ltv: '۵۴,۰۰۰,۰۰۰ تومان',
      ordersCount: 6,
      churnRisk: 9,
      lastChat: '۳ روز پیش (پیگیری سفارش)',
      tags: ['تولیدکننده محتوا', 'حساس به کیفیت صدا', 'مشتری وفادار'],
      summary: 'پادکستر فعال، اولویت اصلی او ایزولاسیون صدا و شفافیت میکروفون است. از سرعت پاسخگویی پشتیبان رضایت کامل دارد.',
      campaignSms: 'امیرحسین عزیز، بررسی اختصاصی میکروفون هدست برای شما در سایت منتشر شد.'
    }
  ]);

  // =========================================================================
  // TAB 4: AI WIDGETS & SINGLE PRODUCT BOX SETTINGS
  // =========================================================================
  const [productHook, setProductHook] = useState<'below_cart' | 'tabs' | 'above_summary'>('below_cart');
  const [contextSources, setContextSources] = useState({
    specs: true,
    fullDesc: true,
    reviews: true,
    faq: true,
    pdf: false
  });
  const [promptChipsList, setPromptChipsList] = useState<string[]>([
    '🔋 باتری این دستگاه در استفاده واقعی چند ساعت جواب می‌دهد؟',
    '🎙️ کیفیت میکروفون برای تماس کاری در محیط شلوغ چطور است؟',
    '⚖️ مقایسه این مدل با نسل قبلی (XM4) در چیست؟',
    '📦 اقلام همراه داخل جعبه این هدفون چیست؟'
  ]);
  const [operatorsList, setOperatorsList] = useState([
    { id: 'op1', name: 'سارا مهرابی', role: 'پشتیبان فنی و گارانتی', isOnline: true },
    { id: 'op2', name: 'امیر شریفی', role: 'واحد پیگیری مرسولات پستی', isOnline: true },
    { id: 'op3', name: 'دستیار هوشمند (AI)', role: 'پاسخگوی ۲۴ ساعته فروش', isOnline: true }
  ]);

  // =========================================================================
  // TAB 5: MCP SERVER, QUEUE & HITL STATE
  // =========================================================================
  const [approvalCards, setApprovalCards] = useState([
    {
      id: 'app_1',
      user: 'علی رضایی',
      phone: '09121112233',
      spent: '۱۸,۰۰۰,۰۰۰ تومان',
      reason: 'تاخیر ۲۴ ساعته اداره پست و ارسال پیام نارضایتی در چت',
      proposedAction: 'صدور کوپن تخفیف ۲۵٪ و ارسال پیامک عذرخواهی رسمی',
      discountValue: 25
    },
    {
      id: 'app_2',
      user: 'پریسا محمدی',
      phone: '09365554433',
      spent: '۹,۵۰۰,۰۰۰ تومان',
      reason: 'درخواست بازگشت وجه به دلیل انتخاب اشتباه رنگ نقره‌ای',
      proposedAction: 'تعویض رایگان کالا بدون کسر هزینه پیک بازگشتی',
      discountValue: 0
    }
  ]);

  const [queueLogs, setQueueLogs] = useState<Array<{
    id: number;
    trigger: string;
    status: string;
    latency: string;
    time: string;
    payload: any;
  }>>([
    { id: 1084, trigger: 'مذاکره قیمت در باکس محصول', status: 'Completed', latency: '142ms', time: 'لحظاتی پیش', payload: { action: 'ai_advisory', product_id: 489, query: 'تست شارژدهی باتری' } },
    { id: 1083, trigger: 'استعلام کد رهگیری پستی ووکامرس', status: 'Completed', latency: '95ms', time: '۳ دقیقه پیش', payload: { action: 'persian_wc_track', tracking_code: '284910293849102948291048' } },
    { id: 1082, trigger: 'درخواست کد تخفیف ۲۵٪ (منتظر تأیید مدیر)', status: 'Pending Approval', latency: '210ms', time: '۸ دقیقه پیش', payload: { action: 'issue_coupon_request', discount: 25, customer_id: 102 } },
    { id: 1081, trigger: 'همگام‌سازی تگ‌های CRM با n8n', status: 'Completed', latency: '118ms', time: '۱۴ دقیقه پیش', payload: { tags_added: ['خریدار مردد', 'حساس به قیمت'] } },
    { id: 1080, trigger: 'ارسال وب‌هوک به n8n (سبد خرید رها شده)', status: 'Failed', latency: '4800ms', time: '۲۲ دقیقه پیش', payload: { error: 'Timeout 5000ms reaching n8n worker' } }
  ]);
  const [selectedPayload, setSelectedPayload] = useState<any | null>(null);

  // =========================================================================
  // EXTERNAL CHANNELS & INTEGRATIONS STATE (TAB 5)
  // =========================================================================
  const [smsProvider, setSmsProvider] = useState<'kavenegar' | 'melipayamak' | 'farazsms'>('kavenegar');
  const [smsApiKey, setSmsApiKey] = useState('kav_live_948192837482910293847');
  const [smsPatternCode, setSmsPatternCode] = useState('hub-order-notify-2026');
  const [smsSenderNumber, setSmsSenderNumber] = useState('500040019283');
  const [smsTestPhone, setSmsTestPhone] = useState('09121112233');
  const [isSendingSmsTest, setIsSendingSmsTest] = useState(false);

  const [n8nWebhookUrl, setN8nWebhookUrl] = useState('https://n8n.your-domain.com/webhook/automation-hub-listener');
  const [n8nSecretToken, setN8nSecretToken] = useState('hub_sec_92f8a1bc83e7401d');
  const [isTestingN8n, setIsTestingN8n] = useState(false);
  const [n8nDeliveryMode, setN8nDeliveryMode] = useState<'async_queue' | 'sync_realtime'>('async_queue');

  const [telegramBotToken, setTelegramBotToken] = useState('6829104829:AAHX7-829djq98wjsd8291kj');
  const [telegramAdminChatId, setTelegramAdminChatId] = useState('108293847');
  const [telegramProxyType, setTelegramProxyType] = useState<'socks5' | 'direct' | 'mtproto'>('socks5');
  const [telegramProxyUrl, setTelegramProxyUrl] = useState('socks5://127.0.0.1:1080');
  const [isSendingTelegramTest, setIsSendingTelegramTest] = useState(false);

  const [mcpBearerToken] = useState('hub_mcp_live_token_8829471928374928');
  const [mcpTools, setMcpTools] = useState({
    productSearch: true,
    dynamicCoupon: true,
    persianWCTracking: true,
    crmTags: true
  });
  const [maxDiscountPercent, setMaxDiscountPercent] = useState<number>(20);

  const handleSendTestSms = () => {
    if (!smsTestPhone.trim()) {
      showToast('⚠️ لطفاً شماره موبایل گیرنده تست را وارد کنید.');
      return;
    }
    setIsSendingSmsTest(true);
    setTimeout(() => {
      setIsSendingSmsTest(false);
      const providerLabel = smsProvider === 'kavenegar' ? 'کاوه‌نگار' : smsProvider === 'melipayamak' ? 'ملی‌پیامک' : 'فراز اس‌ام‌اس (IPPanel)';
      const newLog = {
        id: Math.floor(Math.random() * 900) + 1100,
        trigger: `ارسال پیامک تست پترنی (${providerLabel})`,
        status: 'Completed',
        latency: '98ms',
        time: 'لحظاتی پیش',
        payload: {
          provider: smsProvider,
          recipient: smsTestPhone,
          pattern_code: smsPatternCode,
          sender: smsSenderNumber,
          gateway_status: '200 Delivered to Telecom'
        }
      };
      setQueueLogs(prev => [newLog, ...prev]);
      showToast(`✅ پیامک تست با موفقیت از طریق درگاه ${providerLabel} به شماره ${smsTestPhone} ارسال شد.`);
    }, 600);
  };

  const handleTestN8n = () => {
    setIsTestingN8n(true);
    setTimeout(() => {
      setIsTestingN8n(false);
      const ping = Math.floor(Math.random() * 8) + 14;
      setN8nPing(ping);
      const newLog = {
        id: Math.floor(Math.random() * 900) + 1100,
        trigger: 'تست پینگ وب‌هوک n8n',
        status: 'Completed',
        latency: `${ping}ms`,
        time: 'لحظاتی پیش',
        payload: {
          webhook_url: n8nWebhookUrl,
          response_code: 200,
          ping_latency: `${ping}ms`,
          handshake: 'Verified with Secret Token'
        }
      };
      setQueueLogs(prev => [newLog, ...prev]);
      showToast(`⚡ وب‌هوک n8n با موفقیت تایید شد و پاسخ 200 OK دریافت گردید (${ping}ms).`);
    }, 500);
  };

  const handleSendTelegramTest = () => {
    if (!telegramAdminChatId.trim()) {
      showToast('⚠️ لطفاً شناسه چت ادمین (Admin Chat ID) را وارد کنید.');
      return;
    }
    setIsSendingTelegramTest(true);
    setTimeout(() => {
      setIsSendingTelegramTest(false);
      const newLog = {
        id: Math.floor(Math.random() * 900) + 1100,
        trigger: 'ارسال هشدار تستی به ربات تلگرام مدیر',
        status: 'Completed',
        latency: '215ms',
        time: 'لحظاتی پیش',
        payload: {
          bot_token_masked: '6829***:AAHX***',
          chat_id: telegramAdminChatId,
          proxy: telegramProxyType,
          message: '🔔 پیام تست هوشمند: ارتباط با سرور تلگرام پایدار است.'
        }
      };
      setQueueLogs(prev => [newLog, ...prev]);
      showToast(`🔔 پیام تست با موفقیت از طریق پروکسی به تلگرام مدیر (${telegramAdminChatId}) ارسال شد.`);
    }, 600);
  };

  const handleReplayLog = (logItem: any) => {
    const replayId = Math.floor(Math.random() * 900) + 1100;
    const replayed = {
      id: replayId,
      trigger: `بازپخش (Replay): ${logItem.trigger}`,
      status: 'Completed',
      latency: '105ms',
      time: 'هم‌اکنون',
      payload: { ...logItem.payload, replayed_from: logItem.id }
    };
    setQueueLogs(prev => [replayed, ...prev]);
    showToast(`🔄 رویداد #${logItem.id} مجدداً در صف پردازش قرار گرفت و با موفقیت شلیک شد.`);
  };

  const handleDownloadN8nWorkflow = () => {
    const workflowObj = {
      name: "Automation Hub Pro - WooCommerce Agentic Bridge",
      nodes: [
        { name: "Webhook Trigger", type: "n8n-nodes-base.webhook", parameters: { path: "automation-hub-listener", httpMethod: "POST" } },
        { name: "MCP Tool Executor", type: "n8n-nodes-base.httpRequest", parameters: { url: "https://your-store.com/wp-json/automation-hub/v1/mcp" } },
        { name: "Persian WC Tracking", type: "n8n-nodes-base.httpRequest", parameters: { url: "https://your-store.com/wp-json/automation-hub/v1/mcp/tracking" } },
        { name: "Telegram Alert", type: "n8n-nodes-base.telegram", parameters: { operation: "sendMessage" } }
      ]
    };
    const blob = new Blob([JSON.stringify(workflowObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'automation-hub-n8n-workflow.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('📥 سناریوی آماده JSON مخصوص ایمپورت در n8n با موفقیت دانلود شد.');
  };

  // =========================================================================
  // STOREFRONT DEMO & CHATBOT INTERACTIVE STATE
  // =========================================================================
  const [cartCount, setCartCount] = useState(1);
  const [productColor, setProductColor] = useState<'black' | 'silver' | 'blue'>('black');
  const [storeChatOpen, setStoreChatOpen] = useState(false);
  
  // Chatbot Mode Switcher: Guest User vs Logged In User
  const [chatUserMode, setChatUserMode] = useState<'guest' | 'logged_in'>('logged_in');
  
  // 4-Stage Storefront Chat Flow:
  // stage 1: topic_selection
  // stage 2: auth_or_captcha (skipped if logged in)
  // stage 3: order_inquiry
  // stage 4: connected_chat
  const [chatStage, setChatStage] = useState<'topic_selection' | 'auth_or_captcha' | 'order_inquiry' | 'connected_chat'>('topic_selection');
  const [selectedTopic, setSelectedTopic] = useState<'order' | 'support' | 'warranty' | 'product'>('order');
  const [guestName, setGuestName] = useState('امیرحسین پارسا');
  const [captchaNum1, setCaptchaNum1] = useState(4);
  const [captchaNum2, setCaptchaNum2] = useState(3);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [chatOrderIdInput, setChatOrderIdInput] = useState('1042');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'bot' | 'agent'; text: string; time: string; card?: any }>>([]);
  const [chatTyping, setChatTyping] = useState(false);
  const [chatInputText, setChatInputText] = useState('');

  // AI Product Advisor Under Cart State
  const [pdpMessages, setPdpMessages] = useState([
    {
      sender: 'ai',
      text: 'سلام! من مشاور هوشمند تخصصی هدفون Sony WH-1000XM5 هستم. بر اساس دیتاشیت فنی و تجربیات خریداران، آماده پاسخ به سوالات شما درباره شارژدهی، میکروفون یا گارانتی هستم.',
      time: 'هم‌اکنون'
    }
  ]);
  const [pdpTyping, setPdpTyping] = useState(false);
  const [pdpInput, setPdpInput] = useState('');

  // Handlers for Storefront Chat
  const handleSelectTopic = (topic: 'order' | 'support' | 'warranty' | 'product') => {
    setSelectedTopic(topic);
    if (chatUserMode === 'logged_in') {
      // Direct jump to order inquiry or stage 4
      setChatStage('order_inquiry');
    } else {
      // Guest user must provide name and solve captcha
      setCaptchaNum1(Math.floor(Math.random() * 5) + 2);
      setCaptchaNum2(Math.floor(Math.random() * 5) + 1);
      setCaptchaAnswer('');
      setChatStage('auth_or_captcha');
    }
  };

  const handleVerifyCaptcha = () => {
    if (Number(captchaAnswer) !== captchaNum1 + captchaNum2) {
      showToast('❌ پاسخ معمای کپچا اشتباه است. لطفاً دوباره جمع کنید.');
      return;
    }
    showToast('✅ احراز امنیتی کاربر مهمان با موفقیت تایید شد.');
    setChatStage('order_inquiry');
  };

  const handleOrderSubmitted = (hasOrder: boolean) => {
    setChatStage('connected_chat');
    setChatTyping(true);

    setTimeout(() => {
      setChatTyping(false);
      const nowStr = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
      
      const newChatMsgs: any[] = [];
      if (hasOrder && chatOrderIdInput) {
        newChatMsgs.push({
          sender: 'bot',
          text: `اطلاعات سفارش #${chatOrderIdInput} در سیستم ووکامرس فارسی استعلام شد:`,
          time: nowStr,
          card: {
            title: `سفارش #${chatOrderIdInput} (ووکامرس فارسی)`,
            status: 'تحویل به پستچی منطقه ۴',
            code: '284910293849102948291048'
          }
        });
        newChatMsgs.push({
          sender: 'agent',
          text: `سلام ${chatUserMode === 'logged_in' ? 'علی رضایی عزیز' : guestName}، پشتیبان بخش ${selectedTopic === 'order' ? 'پیگیری سفارش' : selectedTopic === 'warranty' ? 'گارانتی' : 'پشتیبانی'} همراه شماست. چطور می‌توانم راهنماییتان کنم؟`,
          time: nowStr
        });
      } else {
        newChatMsgs.push({
          sender: 'agent',
          text: `سلام ${chatUserMode === 'logged_in' ? 'علی رضایی عزیز' : guestName}! شما به اپراتور آنلاین ${selectedTopic === 'warranty' ? 'بخش گارانتی' : 'پشتیبانی فروش'} متصل شدید. لطفاً پیام یا مشکل خود را مطرح فرمایید:`,
          time: nowStr
        });
      }

      setChatMessages(newChatMsgs);

      // LIVE SYNC WITH TAB 1 IN ADMIN DASHBOARD!
      const syncId = 'chat_live_' + Date.now();
      const newSyncConvo = {
        id: syncId,
        userName: chatUserMode === 'logged_in' ? 'علی رضایی (سشن لایو)' : `${guestName} (مهمان)`,
        userPhone: '09128887766',
        isGuest: chatUserMode === 'guest',
        department: selectedTopic,
        departmentLabel: selectedTopic === 'order' ? 'پیگیری سفارش' : selectedTopic === 'warranty' ? 'بخش گارانتی' : 'پشتیبانی',
        orderId: hasOrder ? chatOrderIdInput : null,
        status: 'operator' as const,
        hasUnread: true,
        lastTime: 'هم‌اکنون',
        avatarBg: 'bg-emerald-600',
        city: 'تهران',
        ltv: chatUserMode === 'logged_in' ? '۱۸,۵۰۰,۰۰۰ تومان' : 'کاربر جدید',
        tags: [chatUserMode === 'logged_in' ? 'کاربر لاگین‌شده' : 'مهمان احراز شده', hasOrder ? `سفارش #${chatOrderIdInput}` : 'بدون شماره سفارش'],
        messages: [
          { id: 'sm1', sender: 'user' as const, text: hasOrder ? `استعلام سفارش شماره ${chatOrderIdInput}` : 'درخواست گفتگو با اپراتور بدون شماره سفارش', time: nowStr },
          { id: 'sm2', sender: 'operator' as const, senderName: 'پشتیبان آنلاین', text: 'اتصال برقرار شد.', time: nowStr }
        ]
      };

      setConversations(prev => [newSyncConvo, ...prev]);
      setSelectedChatId(syncId);
      showToast('⚡ این گفتگو به صورت زنده در «تب ۱ پنل مدیریت (صندوق پیام‌ها)» همگام‌سازی شد!');
    }, 700);
  };

  const handleSendStoreChatMessage = () => {
    if (!chatInputText.trim()) return;
    const nowStr = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    const userMsg = { sender: 'user' as const, text: chatInputText.trim(), time: nowStr };
    
    setChatMessages(prev => [...prev, userMsg]);
    
    // Also push to conversations in Admin Tab 1
    setConversations(prev => prev.map(c => {
      if (c.id === selectedChatId || c.id.startsWith('chat_live_')) {
        return {
          ...c,
          hasUnread: true,
          lastTime: 'هم‌اکنون',
          messages: [...c.messages, { id: 'm_' + Date.now(), sender: 'user', text: chatInputText.trim(), time: nowStr }]
        };
      }
      return c;
    }));

    setChatInputText('');
    setChatTyping(true);

    setTimeout(() => {
      setChatTyping(false);
      const agentReply = {
        sender: 'agent' as const,
        text: 'پیام شما دریافت شد. در حال بررسی درخواست و هماهنگی با انبار/واحد مربوطه هستیم...',
        time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, agentReply]);
    }, 800);
  };

  // Handlers for Under Cart Advisor
  const handleAskPdpAdvisor = (question: string) => {
    if (!question.trim()) return;
    setPdpMessages(prev => [...prev, { sender: 'user', text: question, time: 'هم‌اکنون' }]);
    setPdpInput('');
    setPdpTyping(true);

    setTimeout(() => {
      let reply = '';
      if (question.includes('باتری')) {
        reply = '🔋 در استفاده واقعی با نویزکنسلینگ روشن، باتری دقیقاً ۳۰ ساعت دوام دارد. با شارژ سریع ۳ دقیقه‌ای نیز می‌توانید ۳ ساعت مداوم موسیقی پخش کنید.';
      } else if (question.includes('میکروفون')) {
        reply = '🎙️ هدست سونی XM5 دارای ۸ میکروفون مجزا و چیپ V1 است که نویز باد و همهمه خیابان را تفکیک کرده و صدا را فوق‌العاده شفاف ارسال می‌کند.';
      } else if (question.includes('XM4') || question.includes('مقایسه')) {
        reply = '⚖️ تفاوت اصلی با XM4: طراحی سبک‌تر و آرگونومیک بدون درز، ۲ برابر شدن تعداد میکروفون‌های ایزولاسیون و حذف خودکار نویز متغیر با سنسور فشار هوا.';
      } else {
        reply = 'بر اساس دیتاشیت فنی رسمی، این هدفون دارای پاسخ فرکانسی ۴ تا ۴۰,۰۰۰ هرتز بوده و با استاندارد طلایی Hi-Res Wireless و LDAC بهترین تجربه آکوستیک را ارائه می‌دهد.';
      }

      setPdpMessages(prev => [...prev, { sender: 'ai', text: reply, time: 'هم‌اکنون' }]);
      setPdpTyping(false);
    }, 700);
  };

  return (
    <div className={`min-h-screen ${isDark ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 flex items-center gap-3 bg-purple-600 text-white px-5 py-3 rounded-2xl shadow-2xl shadow-purple-900/60 text-xs sm:text-sm font-semibold animate-bounce">
          <Sparkles size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER & VIEW MODE SWITCHER */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-slate-900/85 border-b border-slate-800 px-4 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-purple-600/40">
                <Zap size={22} className="fill-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-black text-white tracking-tight">Automation Hub Pro</h1>
                  <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-mono">v1.2.5</span>
                </div>
                <p className="text-xs text-slate-400">هاب اتوماسیون هوشمند و ایجنتیک ووکامرس (مارکت ژاکت)</p>
              </div>
            </div>

            <div className="flex md:hidden items-center gap-2">
              <button
                onClick={() => setIsDark(!isDark)}
                className="p-2 rounded-lg bg-slate-800 text-slate-300"
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
          </div>

          {/* VIEW SWITCHER: ADMIN vs STOREFRONT */}
          <div className="flex items-center p-1 bg-slate-800/90 rounded-2xl border border-slate-700/60 shadow-inner w-full md:w-auto justify-center">
            <button
              onClick={() => setCurrentView('admin')}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                currentView === 'admin'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-700/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Server size={16} />
              <span>پیشخوان مدیریت افزونه در وردپرس</span>
            </button>

            <button
              onClick={() => setCurrentView('storefront')}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                currentView === 'storefront'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShoppingBag size={16} />
              <span>پیش‌نمایش زنده صفحه محصول (PDP)</span>
              <span className="bg-emerald-400/20 text-emerald-300 text-[10px] px-1.5 py-0.5 rounded-md">لایو</span>
            </button>
          </div>

          {/* Status & Theme Toggle */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-slate-300">اتصال n8n:</span>
              <span className="font-mono text-emerald-400 font-bold">{n8nPing}ms</span>
            </div>

            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all"
            >
              {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-indigo-400" />}
            </button>
          </div>

        </div>
      </header>

      {/* ========================================================================= */}
      {/* VIEW 1: ADMIN DASHBOARD (5 DISTINCT SEMANTIC TABS)                        */}
      {/* ========================================================================= */}
      {currentView === 'admin' && (
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Sidebar Navigation */}
            <aside className={`transition-all duration-300 space-y-3 ${isSidebarCollapsed ? 'lg:col-span-1' : 'lg:col-span-3'}`}>
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-3.5 shadow-sm transition-all">
                <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} mb-3 px-1`}>
                  {!isSidebarCollapsed ? (
                    <span className="text-[11px] font-bold text-slate-400">ماژول‌های پنل مدیریت:</span>
                  ) : (
                    <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">منو</span>
                  )}
                </div>
                <nav className="space-y-1.5">
                  
                  {/* Tab 1: Live Inbox (Default) */}
                  <button
                    onClick={() => setActiveAdminTab('inbox')}
                    title="گفتگوی آنلاین و صندوق پیام‌ها"
                    className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} p-3 rounded-2xl text-xs sm:text-sm font-bold transition-all relative ${
                      activeAdminTab === 'inbox'
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-2.5'}`}>
                      <MessageSquare size={17} />
                      {!isSidebarCollapsed && <span>گفتگوی آنلاین و صندوق پیام‌ها</span>}
                    </div>
                    {conversations.some(c => c.hasUnread) && (
                      <span className={`${isSidebarCollapsed ? 'absolute top-2 right-2' : ''} w-2.5 h-2.5 rounded-full bg-rose-400 animate-pulse`}></span>
                    )}
                  </button>

                  {/* Tab 2: Nested Rules & Notifications */}
                  <button
                    onClick={() => setActiveAdminTab('rules')}
                    title="سناریوساز و اطلاع‌رسانی شرطی"
                    className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} p-3 rounded-2xl text-xs sm:text-sm font-bold transition-all relative ${
                      activeAdminTab === 'rules'
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-2.5'}`}>
                      <Zap size={17} />
                      {!isSidebarCollapsed && <span>سناریوساز و اطلاع‌رسانی شرطی</span>}
                    </div>
                    {!isSidebarCollapsed ? (
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-md font-mono">{rules.length}</span>
                    ) : (
                      <span className="absolute -top-1 -right-1 text-[9px] bg-amber-500 text-slate-950 font-bold px-1 rounded-full">{rules.length}</span>
                    )}
                  </button>

                  {/* Tab 3: CRM & Retention */}
                  <button
                    onClick={() => setActiveAdminTab('crm')}
                    title="خدمات مشتریان و نگهداشت (CRM)"
                    className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} p-3 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                      activeAdminTab === 'crm'
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-2.5'}`}>
                      <Users size={17} />
                      {!isSidebarCollapsed && <span>خدمات مشتریان و نگهداشت (CRM)</span>}
                    </div>
                    {!isSidebarCollapsed && (
                      <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded-md font-mono">360°</span>
                    )}
                  </button>

                  {/* Tab 4: AI Widgets & PDP Box */}
                  <button
                    onClick={() => setActiveAdminTab('ai_tools')}
                    title="هوش مصنوعی و ابزارهای فروش"
                    className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} p-3 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                      activeAdminTab === 'ai_tools'
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-2.5'}`}>
                      <Sparkles size={17} />
                      {!isSidebarCollapsed && <span>هوش مصنوعی و ابزارهای فروش</span>}
                    </div>
                    {!isSidebarCollapsed && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-md">PDP</span>
                    )}
                  </button>

                  {/* Tab 5: MCP, Queue & HITL */}
                  <button
                    onClick={() => setActiveAdminTab('mcp_queue')}
                    title="اتصالات، MCP و مرکز صف و لاگ"
                    className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} p-3 rounded-2xl text-xs sm:text-sm font-bold transition-all relative ${
                      activeAdminTab === 'mcp_queue'
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-2.5'}`}>
                      <Server size={17} />
                      {!isSidebarCollapsed && <span>اتصالات، MCP و مرکز صف و لاگ</span>}
                    </div>
                    {approvalCards.length > 0 && (
                      <span className={`${isSidebarCollapsed ? 'absolute -top-1 -right-1' : ''} text-[11px] bg-rose-500 text-white font-bold px-1.5 py-0.2 rounded-full`}>
                        {approvalCards.length}
                      </span>
                    )}
                  </button>

                </nav>

                {/* Collapse / Expand Toggle Button at Bottom of Sidebar */}
                <div className="pt-2 mt-3 border-t border-slate-800/80">
                  <button
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    title={isSidebarCollapsed ? 'باز کردن سایدبار' : 'جمع کردن سایدبار (افزایش فضا)'}
                    className={`w-full flex items-center ${
                      isSidebarCollapsed ? 'justify-center' : 'justify-between'
                    } p-2.5 rounded-2xl text-xs font-bold transition-all bg-slate-950/60 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800/60 shadow-sm`}
                  >
                    <div className="flex items-center gap-2">
                      {isSidebarCollapsed ? (
                        <ChevronLeft size={16} className="text-purple-400" />
                      ) : (
                        <ChevronRight size={16} className="text-purple-400" />
                      )}
                      {!isSidebarCollapsed && (
                        <span className="text-[11px] font-medium text-slate-300">جمع کردن منو</span>
                      )}
                    </div>
                    {!isSidebarCollapsed && (
                      <span className="text-[10px] text-slate-500 font-mono">Collapse</span>
                    )}
                  </button>
                </div>
              </div>
            </aside>

            {/* Main Tab View Area */}
            <main className={`transition-all duration-300 ${isSidebarCollapsed ? 'lg:col-span-11' : 'lg:col-span-9'}`}>

              {/* ------------------------------------------------------------- */}
              {/* TAB 1: UNIFIED LIVE INBOX (3-COLUMN WORKSPACE)                */}
              {/* ------------------------------------------------------------- */}
              {activeAdminTab === 'inbox' && (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                  
                  {/* Inbox Sub-header Filters */}
                  <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="text-purple-400" size={18} />
                      <h2 className="text-sm font-black text-white">صندوق پیام‌ها و گفتگوی زنده با مشتریان (Unified Live Inbox)</h2>
                    </div>

                    <div className="flex flex-wrap gap-1.5 text-[11px]">
                      {[
                        { key: 'all', label: 'همه' },
                        { key: 'operator', label: '🔴 در انتظار اپراتور' },
                        { key: 'ai', label: '🤖 در حال پاسخ با AI' },
                        { key: 'warranty', label: '🛡️ بخش گارانتی' },
                        { key: 'order', label: '📦 پیگیری سفارش' },
                        { key: 'product', label: '💡 مشاوره محصول' }
                      ].map(f => (
                        <button
                          key={f.key}
                          onClick={() => setInboxFilter(f.key as any)}
                          className={`px-3 py-1 rounded-xl transition-all font-semibold ${
                            inboxFilter === f.key
                              ? 'bg-purple-600 text-white'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3-Column Inbox Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-12 min-h-[580px]">

                    {/* Column 1: Conversations List (Right in RTL) */}
                    <div className="md:col-span-4 border-l border-slate-800/80 p-3 space-y-2 overflow-y-auto max-h-[640px] bg-slate-950/40">
                      <div className="text-[11px] font-bold text-slate-400 px-2 py-1">لیست مکالمات ({conversations.length}):</div>
                      
                      {conversations
                        .filter(c => {
                          if (inboxFilter === 'all') return true;
                          if (inboxFilter === 'operator') return c.status === 'operator';
                          if (inboxFilter === 'ai') return c.status === 'ai';
                          if (inboxFilter === 'warranty') return c.department === 'warranty';
                          if (inboxFilter === 'order') return c.department === 'order';
                          if (inboxFilter === 'product') return c.department === 'product';
                          return true;
                        })
                        .map(chat => (
                          <div
                            key={chat.id}
                            onClick={() => {
                              setSelectedChatId(chat.id);
                              setConversations(prev => prev.map(c => c.id === chat.id ? { ...c, hasUnread: false } : c));
                            }}
                            className={`p-3 rounded-2xl cursor-pointer transition-all border ${
                              selectedChatId === chat.id
                                ? 'bg-purple-950/40 border-purple-500/60 shadow-md'
                                : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-full ${chat.avatarBg} text-white flex items-center justify-center font-bold text-xs shrink-0`}>
                                  {chat.userName[0]}
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                    <span>{chat.userName}</span>
                                    {chat.hasUnread && (
                                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-purple-300">{chat.departmentLabel}</div>
                                </div>
                              </div>

                              <span className="text-[10px] text-slate-500 font-mono">{chat.lastTime}</span>
                            </div>

                            <p className="text-[11px] text-slate-400 line-clamp-1">
                              {chat.messages[chat.messages.length - 1]?.text}
                            </p>

                            <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
                              <span className={`px-2 py-0.5 rounded-md font-bold ${
                                chat.status === 'operator'
                                  ? 'bg-rose-500/20 text-rose-300'
                                  : 'bg-emerald-500/20 text-emerald-300'
                              }`}>
                                {chat.status === 'operator' ? '✋ دسترسی اپراتور' : '🤖 پاسخ با AI'}
                              </span>
                              <span className="text-slate-400 font-mono">{chat.orderId ? `سفارش #${chat.orderId}` : 'بدون سفارش'}</span>
                            </div>
                          </div>
                        ))}
                    </div>

                    {/* Column 2: Live Chat Thread (Middle) */}
                    <div className="md:col-span-5 flex flex-col justify-between border-l border-slate-800/80 bg-slate-900/30">
                      
                      {/* Chat Header with AI Override Toggle */}
                      <div className="p-3.5 border-b border-slate-800 bg-slate-900 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-2">
                            <span>گفتگو با: {activeChat.userName}</span>
                            <span className="text-[10px] bg-slate-800 text-purple-300 px-2 py-0.5 rounded-md font-mono" dir="ltr">
                              {activeChat.userPhone}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            دپارتمان: <strong className="text-slate-300">{activeChat.departmentLabel}</strong>
                          </div>
                        </div>

                        {/* Handover Button */}
                        <button
                          onClick={() => {
                            const newStatus = !operatorOverride[activeChat.id];
                            setOperatorOverride({ ...operatorOverride, [activeChat.id]: newStatus });
                            setConversations(prev => prev.map(c => c.id === activeChat.id ? { ...c, status: newStatus ? 'operator' : 'ai' } : c));
                            showToast(newStatus ? '✋ کنترل چت توسط اپراتور انسان به دست گرفته شد.' : '🤖 گفتگو مجدداً به هوش مصنوعی واگذار گردید.');
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 ${
                            operatorOverride[activeChat.id]
                              ? 'bg-amber-600 hover:bg-amber-700 text-white'
                              : 'bg-purple-600 hover:bg-purple-700 text-white'
                          }`}
                        >
                          {operatorOverride[activeChat.id] ? (
                            <>
                              <Bot size={14} />
                              <span>واگذاری به AI</span>
                            </>
                          ) : (
                            <>
                              <HandIcon size={14} />
                              <span>ورود اپراتور به چت</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Chat Messages */}
                      <div className="flex-1 p-4 overflow-y-auto space-y-3 max-h-[460px] bg-slate-950/20">
                        {activeChat.messages.map((m, idx) => (
                          <div
                            key={idx}
                            className={`flex flex-col ${m.sender === 'user' ? 'items-start' : 'items-end'}`}
                          >
                            <div className="text-[10px] text-slate-500 mb-0.5 px-1 font-semibold">
                              {m.sender === 'user' ? activeChat.userName : m.senderName || 'پشتیبان'}
                            </div>
                            
                            <div
                              className={`max-w-[90%] p-3 rounded-2xl text-xs leading-relaxed ${
                                m.sender === 'user'
                                  ? 'bg-slate-800 text-slate-200 rounded-tr-none'
                                  : m.sender === 'operator'
                                  ? 'bg-amber-600 text-white rounded-tl-none font-medium'
                                  : 'bg-purple-600 text-white rounded-tl-none'
                              }`}
                            >
                              <p>{m.text}</p>

                              {/* Render Card if present */}
                              {m.card && m.card.type === 'tracking' && (
                                <div className="mt-2.5 p-2.5 bg-slate-950/80 rounded-xl border border-white/20 text-[11px] space-y-1">
                                  <div className="font-bold flex items-center gap-1 text-emerald-300">
                                    <Truck size={14} />
                                    <span>{m.card.title}</span>
                                  </div>
                                  <div className="text-[10px] text-slate-300 font-mono" dir="ltr">کد رهگیری: {m.card.code}</div>
                                  <div className="text-[10px] text-purple-200">وضعیت: {m.card.statusText}</div>
                                </div>
                              )}
                            </div>

                            <span className="text-[10px] text-slate-500 mt-0.5 px-1">{m.time}</span>
                          </div>
                        ))}
                      </div>

                      {/* Canned Responses Quick Bar */}
                      <div className="px-3 py-1.5 bg-slate-900 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[11px]">
                        <span className="text-slate-400 shrink-0">پاسخ‌های آماده:</span>
                        <button
                          onClick={() => handleApplyCanned('سلام، سفارش شما بسته‌بندی شده و کد رهگیری پستی به زودی ارسال می‌گردد.')}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg shrink-0"
                        >
                          اطلاع‌رسانی وضعیت پست
                        </button>
                        <button
                          onClick={() => handleApplyCanned('لطفاً شماره فاکتور یا کارت گارانتی دستگاه را بفرمایید.')}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg shrink-0"
                        >
                          استعلام کارت گارانتی
                        </button>
                      </div>

                      {/* Chat Input */}
                      <div className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2">
                        <button
                          onClick={() => showToast('پیوست تصویر یا سند فعال شد.')}
                          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl"
                          title="ارسال فایل"
                        >
                          <Paperclip size={16} />
                        </button>
                        <input
                          type="text"
                          value={operatorReply}
                          onChange={e => setOperatorReply(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleSendOperatorMessage()}
                          placeholder="پاسخ مستقیم اپراتور به مشتری..."
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-600"
                        />
                        <button
                          onClick={handleSendOperatorMessage}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                        >
                          <span>ارسال</span>
                          <Send size={13} className="rotate-180" />
                        </button>
                      </div>

                    </div>

                    {/* Column 3: Live Customer Profile (Left) */}
                    <div className="md:col-span-3 p-4 space-y-4 bg-slate-950/60 overflow-y-auto">
                      
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-white">اطلاعات حساب مشتری</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                            activeChat.isGuest
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}>
                            {activeChat.isGuest ? 'کاربر مهمان' : 'کاربر لاگین‌شده ✓'}
                          </span>
                        </div>

                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 space-y-2 text-xs">
                          <div>
                            <span className="text-slate-400 text-[11px] block">شماره سفارش اعلامی در چت:</span>
                            <span className="font-bold text-white font-mono">
                              {activeChat.orderId ? `سفارش #${activeChat.orderId}` : 'اعلام نکرده (به خاطر نداشت)'}
                            </span>
                          </div>

                          <div>
                            <span className="text-slate-400 text-[11px] block">شهر صورت‌حساب:</span>
                            <span className="text-slate-200">{activeChat.city}</span>
                          </div>

                          <div>
                            <span className="text-slate-400 text-[11px] block">ارزش خرید کل (LTV):</span>
                            <span className="text-emerald-400 font-mono font-bold">{activeChat.ltv}</span>
                          </div>
                        </div>
                      </div>

                      {/* CRM Tags */}
                      <div>
                        <span className="text-xs font-bold text-slate-300 block mb-2">برچسب‌های هوش مصنوعی (CRM Tags):</span>
                        <div className="flex flex-wrap gap-1.5">
                          {activeChat.tags.map((t, idx) => (
                            <span key={idx} className="bg-purple-950/60 text-purple-300 border border-purple-800/40 text-[10px] px-2 py-0.5 rounded-lg">
                              #{t}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Operator Private Internal Notes */}
                      <div>
                        <span className="text-xs font-bold text-slate-300 block mb-2">یادداشت خصوصی اپراتور:</span>
                        <textarea
                          rows={3}
                          value={operatorNotes[activeChat.id] || ''}
                          onChange={e => setOperatorNotes({ ...operatorNotes, [activeChat.id]: e.target.value })}
                          placeholder="یادداشت‌های داخلی برای همکاران پشتیبان..."
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-purple-600"
                        />
                      </div>

                    </div>

                  </div>

                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* TAB 2: NESTED RULES & CONDITIONAL NOTIFICATIONS               */}
              {/* ------------------------------------------------------------- */}
              {activeAdminTab === 'rules' && (
                <div className="space-y-6 animate-fadeIn">
                  
                  {/* Header & New Rule Button */}
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                      <h2 className="text-base font-bold text-white flex items-center gap-2">
                        <Zap className="text-purple-400" size={18} />
                        موتور سناریوساز و اطلاع‌رسانی شرطی تودرتو (Nested Rules Engine)
                      </h2>
                      <p className="text-xs text-slate-400 mt-1">
                        تعریف بی‌نهایت سناریو بر اساس رویدادهای ووکامرس، چت‌بات و پشتیبانی با شروط چندلایه (Nested AND/OR) و شلیک به پیامک، تلگرام، بله و n8n.
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        const newR = {
                          id: 'rule_' + Date.now(),
                          title: `سناریوی شرطی جدید #${rules.length + 1}`,
                          enabled: true,
                          runsCount: 0,
                          trigger: 'wc_order_created',
                          triggerLabel: 'ثبت سفارش جدید',
                          matchType: 'all',
                          conditions: [{ field: 'order_total', operator: '>', value: '5000000', label: 'مبلغ سفارش بالای ۵ میلیون' }],
                          nestedGroup: {
                            matchType: 'any',
                            conditions: [{ field: 'customer_city', operator: '==', value: 'اصفهان', label: 'شهر مقصد اصفهان' }]
                          },
                          actions: [
                            { channel: 'sms_customer', target: '{customer_phone}', template: 'سفارش شما با موفقیت ثبت شد.' }
                          ]
                        };
                        setRules([newR, ...rules]);
                        setEditingRuleIndex(0);
                        showToast('سناریوی جدید اضافه شد. می‌توانید شروط و عملیات آن را در کادر زیر ویرایش کنید.');
                      }}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-md flex items-center gap-2 shrink-0"
                    >
                      <Plus size={16} />
                      <span>+ ساخت سناریوی شرطی جدید</span>
                    </button>
                  </div>

                  {/* Active Rules List Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {rules.map((rule, idx) => (
                      <div
                        key={rule.id}
                        onClick={() => setEditingRuleIndex(idx)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          editingRuleIndex === idx
                            ? 'bg-purple-950/40 border-purple-500 shadow-md'
                            : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] bg-purple-500/20 text-purple-300 font-bold px-2 py-0.5 rounded-md">
                            رویداد: {rule.triggerLabel}
                          </span>
                          <input
                            type="checkbox"
                            checked={rule.enabled}
                            onChange={e => {
                              e.stopPropagation();
                              const updated = [...rules];
                              updated[idx].enabled = e.target.checked;
                              setRules(updated);
                            }}
                            className="accent-purple-600 scale-110"
                          />
                        </div>
                        <h4 className="text-xs font-bold text-white mb-2 leading-snug">{rule.title}</h4>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                          <span>تعداد اجرا: <strong className="text-emerald-400 font-mono">{rule.runsCount}</strong></span>
                          <span className="text-purple-400 font-semibold">ویرایش چیدمان ←</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Visual Nested Rule Builder Container */}
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <span className="text-[11px] text-purple-400 font-bold block">محیط طراحی ویژوال سناریو:</span>
                        <h3 className="text-sm font-bold text-white">{activeRule.title}</h3>
                      </div>
                      <span className="text-xs text-slate-400">شناسه سناریو: <code className="text-purple-300 font-mono">{activeRule.id}</code></span>
                    </div>

                    {/* Step 1: Trigger Selection */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-[11px] flex items-center justify-center font-bold">۱</span>
                        <span>انتخاب رویداد محرک (Trigger Event):</span>
                      </label>
                      <select
                        value={activeRule.trigger}
                        onChange={e => {
                          const updated = [...rules];
                          updated[editingRuleIndex].trigger = e.target.value;
                          setRules(updated);
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-600"
                      >
                        <optgroup label="رویدادهای ووکامرس و ووکامرس فارسی">
                          <option value="wc_order_created">ثبت سفارش جدید در ووکامرس (wc_order_created)</option>
                          <option value="wc_order_status_changed">تغییر وضعیت سفارش (Processing, Completed, Cancelled)</option>
                          <option value="persian_wc_tracking_added">ثبت کد رهگیری پستی ووکامرس فارسی</option>
                          <option value="wc_cart_abandoned">رها شدن سبد خرید مشتری پس از ۳۰ دقیقه</option>
                        </optgroup>
                        <optgroup label="رویدادهای چت‌بات و پشتیبانی آنلاین">
                          <option value="chat_warranty_started">شروع گفتگو در بخش گارانتی و خدمات پس از فروش</option>
                          <option value="chat_no_order_id">عدم وجود شماره سفارش اعلامی در شروع چت</option>
                          <option value="chat_human_requested">درخواست اتصال به اپراتور انسان توسط کاربر</option>
                          <option value="pdp_question_asked">ثبت پرسش جدید در باکس مشاور صفحه محصول</option>
                        </optgroup>
                        <optgroup label="رویدادهای حساب کاربری">
                          <option value="user_otp_registered">ثبت‌نام کاربر جدید با شماره موبایل و OTP</option>
                        </optgroup>
                      </select>
                    </div>

                    {/* Step 2: Nested AND/OR Condition Tree */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-[11px] flex items-center justify-center font-bold">۲</span>
                          <span>موتور شرط‌های تودرتو (Nested AND / OR Condition Tree):</span>
                        </label>
                        <button
                          onClick={() => {
                            const updated = [...rules];
                            updated[editingRuleIndex].conditions.push({
                              field: 'customer_city',
                              operator: '==',
                              value: 'تهران',
                              label: 'شهر مشتری برابر با تهران'
                            });
                            setRules(updated);
                            showToast('شرط جدید به گروه اصلی اضافه شد.');
                          }}
                          className="text-[11px] text-purple-400 hover:text-purple-300 font-bold"
                        >
                          + افزودن شرط به گروه اصلی
                        </button>
                      </div>

                      {/* Main Condition Group */}
                      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                        <div className="flex items-center gap-3 border-b border-slate-800/80 pb-2.5">
                          <span className="text-xs text-slate-400">گروه شرط اصلی:</span>
                          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-[11px]">
                            <button
                              onClick={() => {
                                const updated = [...rules];
                                updated[editingRuleIndex].matchType = 'all';
                                setRules(updated);
                              }}
                              className={`px-3 py-1 rounded-lg font-bold ${
                                activeRule.matchType === 'all' ? 'bg-purple-600 text-white' : 'text-slate-400'
                              }`}
                            >
                              همه شروط برقرار باشد (AND)
                            </button>
                            <button
                              onClick={() => {
                                const updated = [...rules];
                                updated[editingRuleIndex].matchType = 'any';
                                setRules(updated);
                              }}
                              className={`px-3 py-1 rounded-lg font-bold ${
                                activeRule.matchType === 'any' ? 'bg-purple-600 text-white' : 'text-slate-400'
                              }`}
                            >
                              حداقل یکی برقرار باشد (OR)
                            </button>
                          </div>
                        </div>

                        {/* Conditions List */}
                        {activeRule.conditions.map((cond, cIdx) => (
                          <div key={cIdx} className="flex flex-wrap items-center gap-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                            <span className="font-semibold text-slate-300">{cond.field}</span>
                            <span className="text-purple-400 font-mono font-bold">{cond.operator}</span>
                            <span className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-emerald-400 font-mono font-bold">
                              {cond.value}
                            </span>
                            <span className="text-slate-400 text-[11px]">({cond.label})</span>
                            <button
                              onClick={() => {
                                const updated = [...rules];
                                updated[editingRuleIndex].conditions.splice(cIdx, 1);
                                setRules(updated);
                              }}
                              className="mr-auto text-slate-500 hover:text-rose-400"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}

                        {/* Nested Sub-Group (Visual Indentation with Line) */}
                        {activeRule.nestedGroup && (
                          <div className="mr-6 pr-4 border-r-2 border-purple-500/50 mt-3 pt-2 space-y-2.5">
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <GitBranch size={15} className="text-purple-400" />
                                <span className="font-bold text-purple-300">زیرگروه شرطی تودرتو (Nested Sub-Group):</span>
                                <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-300 px-2 py-0.5 rounded">
                                  {activeRule.nestedGroup.matchType === 'all' ? 'AND' : 'OR'}
                                </span>
                              </div>
                            </div>

                            {activeRule.nestedGroup.conditions.map((sCond, sIdx) => (
                              <div key={sIdx} className="flex flex-wrap items-center gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-purple-800/30 text-xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                                <span className="text-slate-300">{sCond.field}</span>
                                <span className="text-purple-400 font-mono font-bold">{sCond.operator}</span>
                                <span className="bg-slate-950 px-2.5 py-1 rounded-lg text-amber-300 font-mono">
                                  {sCond.value}
                                </span>
                                <span className="text-slate-400 text-[11px]">({sCond.label})</span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="pt-2">
                          <button
                            onClick={() => {
                              showToast('زیرگروه شرطی تودرتو ۲ لایه با موفقیت به ساختار درختی اضافه شد.');
                            }}
                            className="text-[11px] bg-slate-900 hover:bg-slate-800 text-purple-300 border border-purple-800/40 px-3 py-1.5 rounded-xl inline-flex items-center gap-1.5"
                          >
                            <Plus size={13} />
                            <span>+ افزودن زیرگروه شرطی تودرتو (Add Nested Group)</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Step 3: Multi-Channel Actions */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-[11px] flex items-center justify-center font-bold">۳</span>
                          <span>عملیات و اطلاع‌رسانی چندکاناله (Multi-Channel Actions):</span>
                        </label>
                      </div>

                      <div className="space-y-3">
                        {activeRule.actions.map((act, aIdx) => (
                          <div key={aIdx} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                              <div className="flex items-center gap-2 text-xs">
                                <span className="font-bold text-white">کانال ارسال:</span>
                                <span className="bg-purple-950 text-purple-300 border border-purple-800/40 px-2.5 py-0.5 rounded-lg font-mono">
                                  {act.channel}
                                </span>
                                <span className="text-slate-400 text-[11px]">به مقصد: {act.target}</span>
                              </div>

                              <button
                                onClick={() => handleAITonePolish(editingRuleIndex, aIdx)}
                                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-3 py-1 rounded-xl text-[11px] font-bold shadow-md flex items-center gap-1.5"
                              >
                                <Sparkles size={13} />
                                <span>بهینه‌سازی لحن پیام با AI</span>
                              </button>
                            </div>

                            {/* Variable Chips */}
                            <div>
                              <span className="text-[10px] text-slate-400 block mb-1">متغیرهای پویا (کلیک برای درج در متن):</span>
                              <div className="flex flex-wrap gap-1.5">
                                {['{customer_name}', '{order_id}', '{order_total}', '{tracking_code}', '{department}', '{shipping_city}'].map(tag => (
                                  <button
                                    key={tag}
                                    type="button"
                                    onClick={() => handleInsertVariable(editingRuleIndex, aIdx, tag)}
                                    className="bg-slate-900 hover:bg-purple-600 hover:text-white text-purple-300 border border-slate-800 text-[10px] px-2 py-0.5 rounded-md font-mono transition-all"
                                  >
                                    {tag}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <textarea
                              rows={2}
                              value={act.template}
                              onChange={e => {
                                const updated = [...rules];
                                updated[editingRuleIndex].actions[aIdx].template = e.target.value;
                                setRules(updated);
                              }}
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-purple-600 font-mono leading-relaxed"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => showToast('تنظیمات سناریوی شرطی تودرتو با موفقیت ذخیره شد.')}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-lg shadow-purple-900/40"
                      >
                        ذخیره نهایی سناریو 💾
                      </button>
                    </div>

                  </div>

                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* TAB 3: CRM & CUSTOMER RETENTION                               */}
              {/* ------------------------------------------------------------- */}
              {activeAdminTab === 'crm' && (
                <div className="space-y-6 animate-fadeIn">
                  
                  {/* KPI Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
                      <span className="text-slate-400 text-xs block mb-1">نرخ بازگشت مشتری (Retention Rate):</span>
                      <div className="text-2xl font-black text-emerald-400 font-mono">۴۲.۸٪</div>
                      <span className="text-[11px] text-emerald-500 font-semibold">+۱۲٪ رشد در ماه جاری</span>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
                      <span className="text-slate-400 text-xs block mb-1">مشتریان در خطر ریزش (Churn Risk):</span>
                      <div className="text-2xl font-black text-amber-400 font-mono">۱۸ مشتری</div>
                      <span className="text-[11px] text-slate-400">نیازمند مداخله پیامکی با AI</span>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
                      <span className="text-slate-400 text-xs block mb-1">ارزش کل مشتریان فعال (Total LTV):</span>
                      <div className="text-2xl font-black text-purple-400 font-mono">۴۸۰,۰۰۰,۰۰۰ ت</div>
                      <span className="text-[11px] text-purple-300">محاسبه بر اساس دیتابیس ووکامرس</span>
                    </div>
                  </div>

                  {/* Customer Table */}
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                      <div>
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                          <Users className="text-purple-400" size={18} />
                          جدول هوشمند مشتریان و برچسب‌های خودکار چت (Conversational Tags)
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">شناسایی رفتار خرید مشتریان از مکالمات درون چت‌بات و صفحه محصول.</p>
                      </div>

                      <div className="relative w-full md:w-64">
                        <Search className="absolute right-3 top-2.5 text-slate-500" size={16} />
                        <input
                          type="text"
                          value={crmSearch}
                          onChange={e => setCrmSearch(e.target.value)}
                          placeholder="جستجوی نام یا موبایل..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-2 text-xs text-white focus:outline-none focus:border-purple-600"
                        />
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                            <th className="py-3 px-3">نام و شماره مشتری</th>
                            <th className="py-3 px-3">ارزش طول عمر (LTV)</th>
                            <th className="py-3 px-3">احتمال ریزش (Churn Risk)</th>
                            <th className="py-3 px-3">برچسب‌های خودکار گفتگو</th>
                            <th className="py-3 px-3 text-left">عملیات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {crmData
                            .filter(c => c.name.includes(crmSearch) || c.phone.includes(crmSearch))
                            .map(cust => (
                              <tr key={cust.id} className="hover:bg-slate-800/40 transition-colors">
                                <td className="py-3 px-3">
                                  <div className="font-bold text-white">{cust.name}</div>
                                  <div className="text-[11px] text-slate-400 font-mono" dir="ltr">{cust.phone}</div>
                                </td>
                                <td className="py-3 px-3 font-mono font-bold text-slate-200">
                                  {cust.ltv}
                                </td>
                                <td className="py-3 px-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-16 bg-slate-800 rounded-full h-2 overflow-hidden">
                                      <div
                                        className={`h-full rounded-full ${
                                          cust.churnRisk > 50
                                            ? 'bg-rose-500'
                                            : cust.churnRisk > 20
                                            ? 'bg-amber-500'
                                            : 'bg-emerald-500'
                                        }`}
                                        style={{ width: `${cust.churnRisk}%` }}
                                      ></div>
                                    </div>
                                    <span className="font-mono text-[11px] text-slate-300">{cust.churnRisk}٪</span>
                                  </div>
                                </td>
                                <td className="py-3 px-3">
                                  <div className="flex flex-wrap gap-1">
                                    {cust.tags.map((t, idx) => (
                                      <span key={idx} className="bg-purple-950/60 text-purple-300 border border-purple-800/40 text-[10px] px-2 py-0.5 rounded-md">
                                        {t}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                                <td className="py-3 px-3 text-left">
                                  <button
                                    onClick={() => setSelectedCrmUser(cust)}
                                    className="bg-slate-800 hover:bg-purple-600 hover:text-white text-slate-300 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all inline-flex items-center gap-1.5"
                                  >
                                    <Eye size={13} />
                                    <span>پرونده ۳۶۰°</span>
                                  </button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* TAB 4: AI WIDGETS & SINGLE PRODUCT BOX SETTINGS               */}
              {/* ------------------------------------------------------------- */}
              {activeAdminTab === 'ai_tools' && (
                <div className="space-y-6 animate-fadeIn">
                  
                  {/* Section 1: Single Product AI Box Settings */}
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <Sparkles className="text-purple-400" size={18} />
                        تنظیمات باکس مشاور هوشمند در صفحه تکی محصول (Single Product AI Box)
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        تعیین موقعیت هوک، منابع استخراج پاسخ و مدیریت چیپ‌های سوالات آماده زیر دکمه سبد خرید.
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-2">محل نمایش هوک ووکامرس:</label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <label
                          onClick={() => setProductHook('below_cart')}
                          className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                            productHook === 'below_cart'
                              ? 'bg-purple-950/50 border-purple-500 text-white'
                              : 'bg-slate-950 border-slate-800 text-slate-400'
                          }`}
                        >
                          <span className="font-bold block">زیر دکمه افزودن به سبد خرید</span>
                          <span className="text-[10px] text-purple-300 font-mono">woocommerce_after_add_to_cart_button</span>
                        </label>

                        <label
                          onClick={() => setProductHook('tabs')}
                          className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                            productHook === 'tabs'
                              ? 'bg-purple-950/50 border-purple-500 text-white'
                              : 'bg-slate-950 border-slate-800 text-slate-400'
                          }`}
                        >
                          <span className="font-bold block">داخل تب‌های اطلاعات محصول</span>
                          <span className="text-[10px] text-purple-300 font-mono">woocommerce_product_tabs</span>
                        </label>

                        <label
                          onClick={() => setProductHook('above_summary')}
                          className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                            productHook === 'above_summary'
                              ? 'bg-purple-950/50 border-purple-500 text-white'
                              : 'bg-slate-950 border-slate-800 text-slate-400'
                          }`}
                        >
                          <span className="font-bold block">بالای توضیحات کوتاه محصول</span>
                          <span className="text-[10px] text-purple-300 font-mono">woocommerce_before_single_product_summary</span>
                        </label>
                      </div>
                    </div>

                    {/* Context Injection Sources */}
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-2">منابع تغذیه دانش محصول (Context Injection):</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        {[
                          { key: 'specs', label: 'جدول مشخصات فنی' },
                          { key: 'fullDesc', label: 'توضیحات و نقد محصول' },
                          { key: 'reviews', label: 'نظرات خریداران' },
                          { key: 'faq', label: 'شرایط گارانتی و عودت' }
                        ].map(item => (
                          <label key={item.key} className="flex items-center gap-2 p-2.5 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer">
                            <input
                              type="checkbox"
                              checked={(contextSources as any)[item.key]}
                              onChange={e => setContextSources({ ...contextSources, [item.key]: e.target.checked })}
                              className="accent-purple-600 rounded"
                            />
                            <span className="text-slate-300">{item.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Chatbot & Operator Settings */}
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Bot className="text-purple-400" size={18} />
                      تنظیمات چت‌بات فروشگاهی و اپراتورهای آنلاین
                    </h3>

                    {/* Operator List */}
                    <div>
                      <span className="text-xs font-semibold text-slate-300 block mb-2">مدیریت اپراتورهای انسانی و ایجنت هوشمند:</span>
                      <div className="space-y-2">
                        {operatorsList.map((op, idx) => (
                          <div key={op.id} className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs">
                            <div className="flex items-center gap-2.5">
                              <span className={`w-2.5 h-2.5 rounded-full ${op.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`}></span>
                              <span className="font-bold text-white">{op.name}</span>
                              <span className="text-slate-400">({op.role})</span>
                            </div>

                            <button
                              onClick={() => {
                                const updated = [...operatorsList];
                                updated[idx].isOnline = !updated[idx].isOnline;
                                setOperatorsList(updated);
                                showToast(`وضعیت اپراتور ${op.name} به ${updated[idx].isOnline ? 'آنلاین' : 'آفلاین'} تغییر یافت.`);
                              }}
                              className={`px-3 py-1 rounded-xl text-[11px] font-bold ${
                                op.isOnline ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {op.isOnline ? 'آنلاین (آماده پاسخ)' : 'آفلاین'}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={() => showToast('تنظیمات ویجت‌های هوش مصنوعی و چت‌بات با موفقیت ذخیره گردید.')}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-md"
                      >
                        ذخیره تنظیمات ویجت‌ها 💾
                      </button>
                    </div>
                  </div>

                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* TAB 5: MCP SERVER, EXTERNAL INTEGRATIONS & QUEUE HUB          */}
              {/* ------------------------------------------------------------- */}
              {activeAdminTab === 'mcp_queue' && (
                <div className="space-y-6 animate-fadeIn">
                  
                  {/* Tab Top Header & Quick Actions */}
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Server className="text-purple-400" size={20} />
                        <h2 className="text-base font-black text-white">اتصالات، MCP و مرکز صف و لاگ (External Hub & MCP Engine)</h2>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        مدیریت یکپارچه درگاه‌های پیامک ایرانی، وب‌هوک n8n، ربات تلگرام، پروتکل MCP اختصاصی، ابزارهای REST و کارتابل تایید انسانی.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        onClick={handleDownloadN8nWorkflow}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
                      >
                        <Download size={15} className="text-purple-400" />
                        <span>دانلود سناریوی n8n (JSON)</span>
                      </button>

                      <button
                        onClick={() => {
                          handleTestN8n();
                          showToast('کلیه اتصالات بیرونی (SMS, n8n, Telegram) بررسی شدند.');
                        }}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-2xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                      >
                        <Zap size={15} />
                        <span>تست جامع اتصالات ⚡</span>
                      </button>
                    </div>
                  </div>

                  {/* ========================================================= */}
                  {/* 1. EXTERNAL CHANNELS & INTEGRATIONS (SMS, N8N, TELEGRAM)  */}
                  {/* ========================================================= */}
                  <div>
                    <div className="flex items-center justify-between mb-3 px-1">
                      <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                        <Globe size={16} className="text-purple-400" />
                        <span>تنظیمات کانال‌های بیرونی و اطلاع‌رسانی (External Channel Integrations):</span>
                      </h3>
                      <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 size={13} />
                        <span>کانال‌ها آنلاین و آماده ارسال</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                      
                      {/* CARD 1: SMS Gateway Integration */}
                      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold">
                                <Phone size={16} />
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-white">پنل پیامکی (SMS Gateway)</h4>
                                <span className="text-[10px] text-slate-400">ارسال پترنی و سریع OTP</span>
                              </div>
                            </div>
                            <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-bold">
                              ایرانی / خدماتی
                            </span>
                          </div>

                          {/* Provider Selector */}
                          <div>
                            <label className="text-[11px] font-bold text-slate-300 block mb-1">انتخاب درگاه پیامک:</label>
                            <select
                              value={smsProvider}
                              onChange={e => {
                                setSmsProvider(e.target.value as any);
                                showToast(`درگاه پیامک به ${e.target.value === 'kavenegar' ? 'کاوه‌نگار' : e.target.value === 'melipayamak' ? 'ملی‌پیامک' : 'فراز اس‌ام‌اس'} تغییر یافت.`);
                              }}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-600"
                            >
                              <option value="kavenegar">کاوه‌نگار (Kavenegar REST API)</option>
                              <option value="melipayamak">ملی‌پیامک (MeliPayamak SOAP/REST)</option>
                              <option value="farazsms">فراز اس‌ام‌اس / IPPanel (FarazSMS)</option>
                            </select>
                          </div>

                          {/* API Key */}
                          <div>
                            <label className="text-[11px] font-bold text-slate-300 block mb-1">کلید امن API Key / رمز عبور:</label>
                            <div className="relative">
                              <Lock size={13} className="absolute right-3 top-2.5 text-slate-500" />
                              <input
                                type="password"
                                value={smsApiKey}
                                onChange={e => setSmsApiKey(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-8 pl-3 py-1.5 text-xs text-purple-300 font-mono focus:outline-none focus:border-purple-600"
                              />
                            </div>
                          </div>

                          {/* Pattern Code & Sender Line */}
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <label className="text-[10px] text-slate-400 block mb-1">کد پترن خدماتی:</label>
                              <input
                                type="text"
                                value={smsPatternCode}
                                onChange={e => setSmsPatternCode(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-[11px] text-white font-mono"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-400 block mb-1">شماره خط فرستنده:</label>
                              <input
                                type="text"
                                value={smsSenderNumber}
                                onChange={e => setSmsSenderNumber(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-[11px] text-slate-300 font-mono"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Test SMS Block */}
                        <div className="pt-3 border-t border-slate-800/80 space-y-2">
                          <label className="text-[10px] text-slate-400 block">شماره موبایل جهت تست پیامک:</label>
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              value={smsTestPhone}
                              onChange={e => setSmsTestPhone(e.target.value)}
                              placeholder="0912..."
                              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono text-center"
                            />
                            <button
                              onClick={handleSendTestSms}
                              disabled={isSendingSmsTest}
                              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1"
                            >
                              {isSendingSmsTest ? (
                                <RefreshCw size={13} className="animate-spin" />
                              ) : (
                                <Send size={13} className="rotate-180" />
                              )}
                              <span>ارسال پیامک تست</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* CARD 2: n8n Webhook Engine */}
                      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold">
                                <Zap size={16} />
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-white">موتور ارتباط با n8n (Webhook)</h4>
                                <span className="text-[10px] text-slate-400">شلیک رویدادها و دریافت پاسخ ایجنت</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                              <span>پینگ: {n8nPing}ms</span>
                            </div>
                          </div>

                          {/* Webhook URL */}
                          <div>
                            <label className="text-[11px] font-bold text-slate-300 block mb-1">آدرس وب‌هوک n8n (Webhook URL):</label>
                            <input
                              type="text"
                              value={n8nWebhookUrl}
                              onChange={e => setN8nWebhookUrl(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-mono text-left focus:outline-none focus:border-purple-600"
                              dir="ltr"
                            />
                          </div>

                          {/* Secret Token */}
                          <div>
                            <label className="text-[11px] font-bold text-slate-300 block mb-1">کلید اعتبارسنجی هدر (Secret Token):</label>
                            <div className="relative">
                              <KeyRound size={13} className="absolute right-3 top-2.5 text-slate-500" />
                              <input
                                type="text"
                                value={n8nSecretToken}
                                onChange={e => setN8nSecretToken(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-8 pl-3 py-1.5 text-xs text-purple-300 font-mono focus:outline-none focus:border-purple-600 text-left"
                                dir="ltr"
                              />
                            </div>
                          </div>

                          {/* Delivery Mode */}
                          <div>
                            <label className="text-[11px] font-bold text-slate-300 block mb-1">روش ارسال رویدادها:</label>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <button
                                type="button"
                                onClick={() => setN8nDeliveryMode('async_queue')}
                                className={`p-2 rounded-xl border text-center transition-all ${
                                  n8nDeliveryMode === 'async_queue'
                                    ? 'bg-purple-950/60 border-purple-500 text-white font-bold'
                                    : 'bg-slate-950 border-slate-800 text-slate-400'
                                }`}
                              >
                                <span className="block text-[11px]">در صف پس‌زمینه</span>
                                <span className="text-[9px] text-purple-300">بدون کندی سرعت سایت</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setN8nDeliveryMode('sync_realtime')}
                                className={`p-2 rounded-xl border text-center transition-all ${
                                  n8nDeliveryMode === 'sync_realtime'
                                    ? 'bg-purple-950/60 border-purple-500 text-white font-bold'
                                    : 'bg-slate-950 border-slate-800 text-slate-400'
                                }`}
                              >
                                <span className="block text-[11px]">ارسال همگام (Sync)</span>
                                <span className="text-[9px] text-slate-400">انتظار برای خروجی n8n</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Test Connection Button */}
                        <div className="pt-3 border-t border-slate-800/80">
                          <button
                            onClick={handleTestN8n}
                            disabled={isTestingN8n}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
                          >
                            {isTestingN8n ? (
                              <RefreshCw size={14} className="animate-spin" />
                            ) : (
                              <Zap size={14} />
                            )}
                            <span>تست پینگ اتصال (Test Connection)</span>
                          </button>
                        </div>
                      </div>

                      {/* CARD 3: Telegram Bot Integration */}
                      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-xl bg-sky-600/20 text-sky-400 flex items-center justify-center font-bold">
                                <Send size={16} />
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-white">ربات تلگرام / پیام‌رسان</h4>
                                <span className="text-[10px] text-slate-400">هشدارهای فوری به مدیر و ادمین‌ها</span>
                              </div>
                            </div>
                            <span className="text-[10px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-full font-bold">
                              Telegram Bot API
                            </span>
                          </div>

                          {/* Bot Token */}
                          <div>
                            <label className="text-[11px] font-bold text-slate-300 block mb-1">توکن اختصاصی ربات (Bot Token):</label>
                            <input
                              type="password"
                              value={telegramBotToken}
                              onChange={e => setTelegramBotToken(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-sky-300 font-mono text-left focus:outline-none focus:border-purple-600"
                              dir="ltr"
                            />
                          </div>

                          {/* Admin Chat ID */}
                          <div>
                            <label className="text-[11px] font-bold text-slate-300 block mb-1">شناسه چت ادمین (Admin Chat ID):</label>
                            <input
                              type="text"
                              value={telegramAdminChatId}
                              onChange={e => setTelegramAdminChatId(e.target.value)}
                              placeholder="108293847"
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono text-left focus:outline-none focus:border-purple-600"
                              dir="ltr"
                            />
                          </div>

                          {/* Proxy Config */}
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <label className="text-[10px] text-slate-400 block mb-1">نوع پروکسی سرور:</label>
                              <select
                                value={telegramProxyType}
                                onChange={e => setTelegramProxyType(e.target.value as any)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5 text-[11px] text-white"
                              >
                                <option value="socks5">SOCKS5 Proxy</option>
                                <option value="direct">مستقیم (سرور خارجی)</option>
                                <option value="mtproto">MTProto Proxy</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-400 block mb-1">آدرس پروکسی داخلی:</label>
                              <input
                                type="text"
                                value={telegramProxyUrl}
                                onChange={e => setTelegramProxyUrl(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5 text-[10px] text-slate-400 font-mono text-left"
                                dir="ltr"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Test Telegram Button */}
                        <div className="pt-3 border-t border-slate-800/80">
                          <button
                            onClick={handleSendTelegramTest}
                            disabled={isSendingTelegramTest}
                            className="w-full bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
                          >
                            {isSendingTelegramTest ? (
                              <RefreshCw size={14} className="animate-spin" />
                            ) : (
                              <Send size={14} />
                            )}
                            <span>ارسال پیام تست به تلگرام 🔔</span>
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* ========================================================= */}
                  {/* 2. MCP SERVER ENDPOINT & AGENT REST TOOLS                */}
                  {/* ========================================================= */}
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <Server className="text-purple-400" size={18} />
                          <h3 className="text-sm font-bold text-white">آدرس سرور MCP اختصاصی سایت و توانایی‌های REST</h3>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          این اندپوینت ابزارهای استاندارد MCP را در اختیار ایجنت هوش مصنوعی در n8n قرار می‌دهد.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            handleTestN8n();
                          }}
                          className="bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-800/40 px-3.5 py-1.5 rounded-xl text-xs font-bold"
                        >
                          تست ارتباط با n8n ⚡
                        </button>
                      </div>
                    </div>

                    {/* Endpoint & Bearer Token Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1.5">
                        <label className="text-slate-400 font-bold block text-[11px]">آدرس اندپوینت سرور MCP:</label>
                        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
                          <code className="text-purple-300 font-mono flex-1 overflow-x-auto text-left" dir="ltr">
                            https://your-store.com/wp-json/automation-hub/v1/mcp
                          </code>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText('https://your-store.com/wp-json/automation-hub/v1/mcp');
                              setCopiedEndpoint(true);
                              setTimeout(() => setCopiedEndpoint(false), 2000);
                              showToast('لینک سرور MCP کپی شد!');
                            }}
                            className="p-1 hover:bg-slate-800 rounded text-slate-400"
                            title="کپی لینک"
                          >
                            {copiedEndpoint ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-slate-400 font-bold block text-[11px]">کلید دسترسی امن (Bearer Token):</label>
                        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
                          <code className="text-emerald-400 font-mono flex-1 overflow-x-auto text-left" dir="ltr">
                            {mcpBearerToken}
                          </code>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(mcpBearerToken);
                              setCopiedToken(true);
                              setTimeout(() => setCopiedToken(false), 2000);
                              showToast('توکن امنیتی Bearer کپی شد!');
                            }}
                            className="p-1 hover:bg-slate-800 rounded text-slate-400"
                            title="کپی توکن"
                          >
                            {copiedToken ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Agent REST Abilities Cards */}
                    <div>
                      <span className="text-xs font-bold text-slate-300 block mb-2.5">مدیریت دسترسی و سقف مجاز ابزارهای REST ایجنت:</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        
                        {/* Tool 1 */}
                        <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-2xl space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white text-xs">۱. جستجوی متغیرهای ووکامرس</span>
                            <input
                              type="checkbox"
                              checked={mcpTools.productSearch}
                              onChange={e => setMcpTools({ ...mcpTools, productSearch: e.target.checked })}
                              className="accent-purple-600 scale-110 cursor-pointer"
                            />
                          </div>
                          <p className="text-[11px] text-slate-400">استعلام موجودی، سایز، رنگ و قیمت لحظه‌ای انبار.</p>
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md inline-block font-mono">
                            wc/v3/products
                          </span>
                        </div>

                        {/* Tool 2: Dynamic Coupon */}
                        <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-2xl space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white text-xs">۲. ساخت کوپن تخفیف پویا</span>
                            <input
                              type="checkbox"
                              checked={mcpTools.dynamicCoupon}
                              onChange={e => setMcpTools({ ...mcpTools, dynamicCoupon: e.target.checked })}
                              className="accent-purple-600 scale-110 cursor-pointer"
                            />
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-300">
                            <span>سقف مجاز ایجنت:</span>
                            <span className="font-mono text-purple-400 font-bold">{maxDiscountPercent}٪</span>
                          </div>
                          <input
                            type="range"
                            min="5"
                            max="50"
                            value={maxDiscountPercent}
                            onChange={e => setMaxDiscountPercent(Number(e.target.value))}
                            className="w-full accent-purple-600 cursor-pointer"
                          />
                        </div>

                        {/* Tool 3: Persian WC Tracking */}
                        <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-2xl space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white text-xs">۳. رهگیری ووکامرس فارسی</span>
                            <input
                              type="checkbox"
                              checked={mcpTools.persianWCTracking}
                              onChange={e => setMcpTools({ ...mcpTools, persianWCTracking: e.target.checked })}
                              className="accent-purple-600 scale-110 cursor-pointer"
                            />
                          </div>
                          <p className="text-[11px] text-slate-400">استعلام کد ۲۴ رقمی پست پیشتاز (`class-persian-wc.php`).</p>
                          <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-md inline-block font-mono">
                            persian_wc_track
                          </span>
                        </div>

                        {/* Tool 4: CRM Tags */}
                        <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-2xl space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white text-xs">۴. خواندن و برچسب‌گذاری CRM</span>
                            <input
                              type="checkbox"
                              checked={mcpTools.crmTags}
                              onChange={e => setMcpTools({ ...mcpTools, crmTags: e.target.checked })}
                              className="accent-purple-600 scale-110 cursor-pointer"
                            />
                          </div>
                          <p className="text-[11px] text-slate-400">ثبت برچسب‌های استخراج‌شده از گفتگو و ارزیابی ریسک ریزش.</p>
                          <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-md inline-block font-mono">
                            crm_tag_update
                          </span>
                        </div>

                      </div>
                    </div>
                  </div>

                  {/* ========================================================= */}
                  {/* 3. HUMAN-IN-THE-LOOP APPROVALS                            */}
                  {/* ========================================================= */}
                  <div className="bg-slate-900 border border-amber-600/30 rounded-3xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                          <AlertTriangle className="text-amber-400" size={18} />
                          کارتابل در انتظار تأیید انسانی (Human-in-the-Loop - HITL)
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">عملیات حساس پیشنهادشده توسط ایجنت n8n که نیاز به اجازه صریح مدیر دارد.</p>
                      </div>
                      <span className="bg-amber-500/20 text-amber-300 text-xs px-2.5 py-1 rounded-full font-bold">
                        {approvalCards.length} عملیات معلق
                      </span>
                    </div>

                    <div className="space-y-3">
                      {approvalCards.map(card => (
                        <div key={card.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-sm">{card.user}</span>
                              <span className="text-slate-400 font-mono" dir="ltr">({card.phone})</span>
                              <span className="text-purple-300">مجموع خرید: {card.spent}</span>
                            </div>
                            <p className="text-amber-300/90 font-medium">علت: {card.reason}</p>
                            <p className="text-slate-300">اقدام پیشنهادی: <strong>{card.proposedAction}</strong></p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => {
                                setApprovalCards(prev => prev.filter(c => c.id !== card.id));
                                showToast('عملیات با موفقیت تأیید و در سیستم اعمال شد.');
                              }}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold"
                            >
                              تأیید و اجرا ✓
                            </button>
                            <button
                              onClick={() => {
                                setApprovalCards(prev => prev.filter(c => c.id !== card.id));
                                showToast('درخواست توسط مدیر رد گردید.');
                              }}
                              className="bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white px-3 py-2 rounded-xl text-xs font-bold"
                            >
                              رد
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ========================================================= */}
                  {/* 4. QUEUE & LOGGER HUB WITH REPLAY ACTION                  */}
                  {/* ========================================================= */}
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                          <Clock className="text-purple-400" size={17} />
                          <span>صف پردازش، مانیتورینگ رویدادها و لاگ‌ها (Queue & Logger Hub)</span>
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">ثبت زنده کلیه تعاملات پیامکی، وب‌هوک‌های n8n و تلگرام با قابلیت شلیک مجدد (Replay).</p>
                      </div>

                      <button
                        onClick={() => showToast('صف پردازش و لاگ‌ها به‌روزرسانی شد.')}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded-xl text-xs flex items-center gap-1.5"
                      >
                        <RefreshCw size={13} />
                        <span>بروزرسانی</span>
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400">
                            <th className="py-2.5 px-3">شناسه</th>
                            <th className="py-2.5 px-3">رویداد</th>
                            <th className="py-2.5 px-3">وضعیت</th>
                            <th className="py-2.5 px-3">زمان پاسخ</th>
                            <th className="py-2.5 px-3">زمان ثبت</th>
                            <th className="py-2.5 px-3 text-left">عملیات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {queueLogs.map(item => (
                            <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                              <td className="py-2.5 px-3 font-mono font-bold text-slate-300">#{item.id}</td>
                              <td className="py-2.5 px-3 text-white font-medium">{item.trigger}</td>
                              <td className="py-2.5 px-3">
                                <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                                  item.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                                }`}>
                                  {item.status}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 font-mono text-slate-400">{item.latency}</td>
                              <td className="py-2.5 px-3 text-slate-400 text-[11px]">{item.time}</td>
                              <td className="py-2.5 px-3 text-left">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleReplayLog(item)}
                                    className="p-1.5 bg-slate-800 hover:bg-purple-600 text-slate-300 hover:text-white rounded-lg text-xs transition-all"
                                    title="شلیک مجدد رویداد (Replay)"
                                  >
                                    <Play size={13} />
                                  </button>
                                  <button
                                    onClick={() => setSelectedPayload(item)}
                                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                                    title="مشاهده JSON Payload"
                                  >
                                    <FileCode size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}

            </main>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: LIVE STOREFRONT & SINGLE PRODUCT DEMO (PDP)                       */}
      {/* ========================================================================= */}
      {currentView === 'storefront' && (
        <div className="animate-fadeIn">
          
          {/* Top Banner */}
          <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-purple-100 text-xs py-2 px-4 text-center font-medium">
            <span>🎉 ارسال رایگان سفارش‌های بالای ۵۰۰ هزار تومان با ضمانت ۲۴ ماهه اصالت کالا</span>
          </div>

          {/* Storefront Nav */}
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-6">
              <span className="text-base font-black text-white flex items-center gap-2">
                <ShoppingBag className="text-emerald-500" size={20} />
                فروشگاه آنلاین صوتی و دیجیتال
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs text-slate-300">
                <ShoppingBag size={15} className="text-emerald-400" />
                <span>سبد خرید:</span>
                <span className="font-bold text-white font-mono bg-emerald-500 text-slate-950 px-1.5 py-0.2 rounded-full text-[11px]">
                  {cartCount}
                </span>
              </div>
            </div>
          </div>

          {/* Product Page Container */}
          <div className="max-w-6xl mx-auto px-4 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Product Visual Box (Right in RTL) */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center space-y-4">
                  <div className="w-52 h-52 mx-auto rounded-full border-8 border-slate-800 bg-slate-950 flex flex-col items-center justify-center relative shadow-2xl">
                    <span className="text-sm font-black text-slate-300 tracking-widest font-mono">SONY</span>
                    <span className="text-xs text-purple-400 font-mono mt-1">WH-1000XM5</span>
                    <span className="text-[9px] text-emerald-400 font-mono mt-0.5">ANC ACTIVE</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">هدفون بی‌سیم نویزکنسلینگ سونی</h3>
                    <p className="text-xs text-slate-400 mt-1">گارانتی ۲۴ ماهه طلایی تعویض فوری</p>
                  </div>
                </div>
              </div>

              {/* Product Info & Purchase Module */}
              <div className="lg:col-span-7 space-y-5">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-white">
                    هدفون بی‌سیم نویزکنسلینگ سونی مدل WH-1000XM5
                  </h1>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    نسل پنجم پرچمدار نویزکنسلینگ جهان مجهز به ۸ میکروفون استودیویی، چیپ صوتی V1 و فناوری هوشمند LDAC.
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                  <div>
                    <span className="text-xs text-slate-400 block mb-0.5">قیمت رسمی با تخفیف:</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-emerald-400 font-mono">۱۹,۸۰۰,۰۰۰</span>
                      <span className="text-xs text-slate-300">تومان</span>
                    </div>
                  </div>
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full font-bold">
                    موجود در انبار ✓
                  </span>
                </div>

                {/* Color Selector */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-2">انتخاب رنگ:</label>
                  <div className="flex gap-2">
                    {[
                      { key: 'black', label: 'مشکی مات' },
                      { key: 'silver', label: 'نقره‌ای پلاتینیوم' },
                      { key: 'blue', label: 'سرمه‌ای تیره' }
                    ].map(c => (
                      <button
                        key={c.key}
                        onClick={() => setProductColor(c.key as any)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold ${
                          productColor === c.key
                            ? 'border-purple-500 bg-purple-950/40 text-white'
                            : 'border-slate-800 bg-slate-900 text-slate-400'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={() => {
                    setCartCount(prev => prev + 1);
                    showToast('هدفون با موفقیت به سبد خرید اضافه شد.');
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-2xl text-sm font-black flex items-center justify-center gap-2 shadow-xl shadow-emerald-900/30"
                >
                  <ShoppingBag size={18} />
                  <span>افزودن به سبد خرید (۱۹,۸۰۰,۰۰۰ تومان)</span>
                </button>

                {/* ========================================================= */}
                {/* 🌟 SINGLE PRODUCT AI ADVISOR BOX (BELOW ADD TO CART)      */}
                {/* ========================================================= */}
                <div className="bg-gradient-to-br from-slate-900 via-purple-950/30 to-slate-900 border-2 border-purple-500/40 rounded-3xl p-5 shadow-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="text-purple-400" size={18} />
                      <span className="text-sm font-bold text-white">مشاور هوشمند این محصول (پاسخگویی آنی با AI)</span>
                    </div>
                    <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-mono">
                      Single Product Box
                    </span>
                  </div>

                  <p className="text-xs text-slate-300">
                    مطمئن نیستید این دستگاه مناسب شماست؟ هر سوالی دارید بپرسید:
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {promptChipsList.slice(0, 3).map((chip, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleAskPdpAdvisor(chip)}
                        className="bg-slate-950 hover:bg-purple-600 hover:text-white text-purple-200 border border-purple-800/40 text-[11px] px-3 py-1.5 rounded-xl transition-all"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>

                  <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3.5 space-y-2.5 max-h-48 overflow-y-auto">
                    {pdpMessages.map((m, i) => (
                      <div key={i} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`p-2.5 rounded-2xl text-xs max-w-[88%] ${
                          m.sender === 'user' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-200'
                        }`}>
                          {m.text}
                        </div>
                      </div>
                    ))}
                    {pdpTyping && (
                      <div className="text-[11px] text-purple-300 font-mono animate-pulse">
                        مشاور در حال آماده‌سازی پاسخ از روی دیتاشیت...
                      </div>
                    )}
                  </div>

                  <form
                    onSubmit={e => {
                      e.preventDefault();
                      handleAskPdpAdvisor(pdpInput);
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      value={pdpInput}
                      onChange={e => setPdpInput(e.target.value)}
                      placeholder="سوالی درباره اتصال، تاخیر صدا یا گارانتی دارید؟..."
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-600"
                    />
                    <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-xs font-bold">
                      ارسال
                    </button>
                  </form>
                </div>

              </div>
            </div>
          </div>

          {/* =================================================================== */}
          {/* 💬 FLOATING CHATBOT WIDGET WITH 4-STAGE INTERACTIVE WORKFLOW       */}
          {/* =================================================================== */}
          <div className="fixed bottom-6 left-6 z-40">
            {!storeChatOpen && (
              <button
                onClick={() => setStoreChatOpen(true)}
                className="flex items-center gap-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-3.5 rounded-full shadow-2xl hover:scale-105 transition-all"
              >
                <Bot size={22} />
                <span className="text-xs font-bold">پشتیبانی و پیگیری سفارش</span>
              </button>
            )}

            {storeChatOpen && (
              <div className="w-[360px] sm:w-[420px] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[540px] animate-fadeIn">
                
                {/* Chat Top Header & Test Mode Switcher */}
                <div className="bg-gradient-to-r from-purple-700 to-indigo-700 p-3.5 text-white flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                        <Bot size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold">پشتیبانی آنلاین فروشگاه</h4>
                        <span className="text-[10px] text-purple-200">اتوماسیون هاب پرو</span>
                      </div>
                    </div>

                    <button onClick={() => setStoreChatOpen(false)} className="p-1 hover:bg-white/20 rounded-lg">
                      <X size={18} />
                    </button>
                  </div>

                  {/* Mode Switcher: Guest vs Logged-In Demo Switch */}
                  <div className="flex items-center justify-between bg-black/25 px-2.5 py-1 rounded-xl text-[10px]">
                    <span className="text-purple-200">تست دمو:</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setChatUserMode('logged_in');
                          setChatStage('topic_selection');
                          showToast('حالت شبیه‌سازی: کاربر لاگین‌شده (علی رضایی)');
                        }}
                        className={`px-2 py-0.5 rounded-md font-bold ${
                          chatUserMode === 'logged_in' ? 'bg-emerald-500 text-slate-950' : 'text-slate-300'
                        }`}
                      >
                        ✓ لاگین‌شده
                      </button>
                      <button
                        onClick={() => {
                          setChatUserMode('guest');
                          setChatStage('topic_selection');
                          showToast('حالت شبیه‌سازی: کاربر مهمان (نیازمند کپچا)');
                        }}
                        className={`px-2 py-0.5 rounded-md font-bold ${
                          chatUserMode === 'guest' ? 'bg-amber-500 text-slate-950' : 'text-slate-300'
                        }`}
                      >
                        👤 مهمان
                      </button>
                    </div>
                  </div>
                </div>

                {/* STAGE 1: TOPIC SELECTION & OPERATORS STATUS */}
                {chatStage === 'topic_selection' && (
                  <div className="flex-1 p-4 bg-slate-950/60 overflow-y-auto space-y-4 text-xs">
                    
                    {/* Operators Banner */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex items-center gap-3">
                      <div className="flex -space-x-2 space-x-reverse">
                        <div className="w-7 h-7 rounded-full bg-purple-600 border border-slate-900 flex items-center justify-center text-[10px] font-bold text-white">س</div>
                        <div className="w-7 h-7 rounded-full bg-emerald-600 border border-slate-900 flex items-center justify-center text-[10px] font-bold text-white">ا</div>
                        <div className="w-7 h-7 rounded-full bg-indigo-600 border border-slate-900 flex items-center justify-center text-[10px] font-bold text-white">AI</div>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 font-bold text-white">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                          <span>۳ اپراتور آنلاین آماده پاسخگویی</span>
                        </div>
                        <span className="text-[10px] text-slate-400">سارا، امیر و دستیار هوشمند فروش</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-slate-300 font-bold block text-xs">لطفاً موضوع گفتگوی خود را انتخاب کنید:</span>
                      
                      <button
                        onClick={() => handleSelectTopic('order')}
                        className="w-full p-3 rounded-2xl bg-slate-900 hover:bg-purple-900/40 border border-slate-800 hover:border-purple-600 text-right transition-all flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <Truck className="text-emerald-400" size={17} />
                          <div>
                            <div className="font-bold text-white">📦 پیگیری سفارش</div>
                            <div className="text-[10px] text-slate-400">استعلام زمان ارسال و کد رهگیری پستی</div>
                          </div>
                        </div>
                        <ChevronLeft size={16} className="text-slate-500" />
                      </button>

                      <button
                        onClick={() => handleSelectTopic('support')}
                        className="w-full p-3 rounded-2xl bg-slate-900 hover:bg-purple-900/40 border border-slate-800 hover:border-purple-600 text-right transition-all flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <Headphones className="text-purple-400" size={17} />
                          <div>
                            <div className="font-bold text-white">🎧 گفتگو با پشتیبان</div>
                            <div className="text-[10px] text-slate-400">اتصال مستقیم به کارشناس پشتیبانی</div>
                          </div>
                        </div>
                        <ChevronLeft size={16} className="text-slate-500" />
                      </button>

                      <button
                        onClick={() => handleSelectTopic('warranty')}
                        className="w-full p-3 rounded-2xl bg-slate-900 hover:bg-purple-900/40 border border-slate-800 hover:border-purple-600 text-right transition-all flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <ShieldAlert className="text-rose-400" size={17} />
                          <div>
                            <div className="font-bold text-white">🛡️ گفتگو با بخش گارانتی</div>
                            <div className="text-[10px] text-slate-400">ثبت درخواست تعویض و خدمات پس از فروش</div>
                          </div>
                        </div>
                        <ChevronLeft size={16} className="text-slate-500" />
                      </button>

                      <button
                        onClick={() => handleSelectTopic('product')}
                        className="w-full p-3 rounded-2xl bg-slate-900 hover:bg-purple-900/40 border border-slate-800 hover:border-purple-600 text-right transition-all flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <Sparkles className="text-amber-400" size={17} />
                          <div>
                            <div className="font-bold text-white">💡 مشاوره تخصصی محصول</div>
                            <div className="text-[10px] text-slate-400">پاسخ به سوالات سازگاری و ویژگی‌ها</div>
                          </div>
                        </div>
                        <ChevronLeft size={16} className="text-slate-500" />
                      </button>
                    </div>

                  </div>
                )}

                {/* STAGE 2: GUEST CAPTCHA & NAME */}
                {chatStage === 'auth_or_captcha' && (
                  <div className="flex-1 p-5 bg-slate-950/70 overflow-y-auto space-y-4 text-xs flex flex-col justify-center">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-3">
                      <div className="text-amber-400 font-bold text-xs flex items-center gap-1.5">
                        <ShieldCheck size={16} />
                        <span>احراز امنیتی کاربر مهمان (Anti-Spam)</span>
                      </div>
                      <p className="text-slate-400 text-[11px] leading-relaxed">
                        جهت جلوگیری از ارسال پیام‌های هرزنامه و اتصال سریع به اپراتور، نام و حاصل جمع زیر را وارد کنید:
                      </p>

                      <div>
                        <label className="text-[11px] text-slate-300 block mb-1">نام و نام خانوادگی:</label>
                        <input
                          type="text"
                          value={guestName}
                          onChange={e => setGuestName(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>

                      {/* Math Captcha */}
                      <div>
                        <label className="text-[11px] text-slate-300 block mb-1">
                          حاصل جمع امنیتی: <strong className="text-purple-400 font-mono text-sm">{captchaNum1} + {captchaNum2} = ؟</strong>
                        </label>
                        <input
                          type="number"
                          value={captchaAnswer}
                          onChange={e => setCaptchaAnswer(e.target.value)}
                          placeholder="پاسخ عدد..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono text-center"
                        />
                      </div>

                      <button
                        onClick={handleVerifyCaptcha}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-xl font-bold text-xs"
                      >
                        تایید و ادامه
                      </button>
                    </div>
                  </div>
                )}

                {/* STAGE 3: ORDER NUMBER INQUIRY OR SKIP BUTTON */}
                {chatStage === 'order_inquiry' && (
                  <div className="flex-1 p-5 bg-slate-950/70 overflow-y-auto space-y-4 text-xs flex flex-col justify-center">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3 text-center">
                      <div className="w-10 h-10 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center mx-auto">
                        <Truck size={22} />
                      </div>
                      <h4 className="text-sm font-bold text-white">استعلام شماره سفارش</h4>
                      <p className="text-slate-400 text-[11px] leading-relaxed">
                        لطفاً برای بررسی سریع‌تر، شماره سفارش خود را وارد کنید:
                      </p>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={chatOrderIdInput}
                          onChange={e => setChatOrderIdInput(e.target.value)}
                          placeholder="مثلاً: 1042"
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono text-center"
                        />
                        <button
                          onClick={() => handleOrderSubmitted(true)}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-xs font-bold"
                        >
                          ثبت سفارش
                        </button>
                      </div>

                      <div className="pt-2 border-t border-slate-800">
                        <button
                          onClick={() => handleOrderSubmitted(false)}
                          className="w-full bg-slate-800 hover:bg-slate-750 text-slate-300 py-2.5 rounded-xl text-xs font-semibold"
                        >
                          شماره سفارش را به خاطر ندارم (اتصال مستقیم به اپراتور)
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* STAGE 4: CONNECTED CHAT (WITH OPERATOR & LIVE SYNC) */}
                {chatStage === 'connected_chat' && (
                  <div className="flex-1 flex flex-col justify-between bg-slate-950/40">
                    
                    {/* Chat Messages */}
                    <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
                      {chatMessages.map((msg, i) => (
                        <div
                          key={i}
                          className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                        >
                          <div
                            className={`p-3 rounded-2xl max-w-[88%] text-xs leading-relaxed ${
                              msg.sender === 'user'
                                ? 'bg-purple-600 text-white rounded-br-none'
                                : 'bg-slate-800 text-slate-200 rounded-bl-none'
                            }`}
                          >
                            <p>{msg.text}</p>
                            {msg.card && (
                              <div className="mt-2.5 p-2.5 bg-slate-950 rounded-xl border border-slate-700/80 space-y-1">
                                <div className="font-bold text-emerald-400 flex items-center gap-1">
                                  <Truck size={14} />
                                  <span>{msg.card.title}</span>
                                </div>
                                <div className="text-[10px] text-slate-300 font-mono" dir="ltr">کد رهگیری: {msg.card.code}</div>
                                <div className="text-[10px] text-purple-300 font-bold">{msg.card.status}</div>
                              </div>
                            )}
                          </div>
                          <span className="text-[9px] text-slate-500 mt-0.5 px-1">{msg.time}</span>
                        </div>
                      ))}

                      {chatTyping && (
                        <div className="text-[10px] text-purple-400 font-mono animate-pulse">
                          اپراتور در حال نوشتن پاسخ...
                        </div>
                      )}
                    </div>

                    {/* Chat Input */}
                    <div className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2">
                      <input
                        type="text"
                        value={chatInputText}
                        onChange={e => setChatInputText(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSendStoreChatMessage()}
                        placeholder="پیام خود را بنویسید..."
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-600"
                      />
                      <button
                        onClick={handleSendStoreChatMessage}
                        className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-xl"
                      >
                        <Send size={15} className="rotate-180" />
                      </button>
                    </div>

                  </div>
                )}

              </div>
            )}
          </div>

        </div>
      )}

      {/* 360° CUSTOMER MODAL */}
      {selectedCrmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-white">پرونده ۳۶۰ درجه: {selectedCrmUser.name}</h3>
                <span className="text-[11px] text-slate-400 font-mono" dir="ltr">{selectedCrmUser.phone}</span>
              </div>
              <button onClick={() => setSelectedCrmUser(null)} className="p-1 text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="bg-purple-950/30 border border-purple-800/40 p-3.5 rounded-2xl text-xs space-y-1">
              <span className="font-bold text-purple-300">تحلیل هوش مصنوعی از رفتار گفتگوها:</span>
              <p className="text-slate-300 leading-relaxed">{selectedCrmUser.summary}</p>
            </div>

            <div>
              <span className="text-slate-400 font-bold block mb-1">برچسب‌ها:</span>
              <div className="flex flex-wrap gap-1">
                {selectedCrmUser.tags.map((t: string, i: number) => (
                  <span key={i} className="bg-slate-800 px-2 py-0.5 rounded text-[11px] text-slate-300">#{t}</span>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                showToast(`پیامک کمپین بازگردانی به ${selectedCrmUser.phone} ارسال شد.`);
                setSelectedCrmUser(null);
              }}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-xl text-xs font-bold"
            >
              ارسال پیامک اختصاصی بازگردانی 🚀
            </button>
          </div>
        </div>
      )}

      {/* JSON PAYLOAD MODAL */}
      {selectedPayload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-sm font-bold text-white">Payload رویداد #{selectedPayload.id}</span>
              <button onClick={() => setSelectedPayload(null)} className="p-1 text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-purple-300 font-mono text-[11px] overflow-x-auto text-left" dir="ltr">
              {JSON.stringify(selectedPayload.payload, null, 2)}
            </pre>
            <button
              onClick={() => setSelectedPayload(null)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-xl font-bold"
            >
              بستن
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

function HandIcon(props: any) {
  return (
    <svg width={props.size || 16} height={props.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
      <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
      <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
      <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
    </svg>
  );
}
