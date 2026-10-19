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
  ExternalLink,
  ChevronLeft,
  ChevronRight,
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
  HelpCircle,
  X,
  Sliders,
  Maximize2,
  FileCode,
  Award,
  Play
} from 'lucide-react';

export default function App() {
  // Theme & View mode
  const [isDark, setIsDark] = useState(true);
  const [currentView, setCurrentView] = useState<'admin' | 'storefront'>('admin');
  const [activeAdminTab, setActiveAdminTab] = useState<'mcp' | 'product_box' | 'chatbot' | 'crm' | 'queue'>('mcp');

  // Top Bar Status
  const [n8nPing, setN8nPing] = useState<number>(18);
  const [isPinging, setIsPinging] = useState(false);
  const [copiedEndpoint, setCopiedEndpoint] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  // Cart Count
  const [cartCount, setCartCount] = useState(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // --- TAB 1: MCP Server State ---
  const [rateLimitDiscount, setRateLimitDiscount] = useState<number>(20);
  const [toolsActive, setToolsActive] = useState({
    stockSearch: true,
    dynamicDiscount: true,
    persianWcTracking: true,
    crmTags: true
  });

  // --- TAB 2: Product Box Settings State ---
  const [selectedHook, setSelectedHook] = useState<'below_cart' | 'tabs' | 'above_summary'>('below_cart');
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
  const [newChipInput, setNewChipInput] = useState('');

  // --- TAB 3: Chatbot & OTP Settings State ---
  const [smsGateway, setSmsGateway] = useState<'melipayamak' | 'kavenegar' | 'farapayamak'>('melipayamak');
  const [otpExpiry, setOtpExpiry] = useState(120);
  const [enableRichCards, setEnableRichCards] = useState(true);
  const [enableExitIntent, setEnableExitIntent] = useState(true);

  // --- TAB 4: CRM State & Drawer Modal ---
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [crmCustomers, setCrmCustomers] = useState([
    {
      id: 1,
      name: 'مهدی کریمی',
      phone: '09124458921',
      ltv: '۳۸,۵۰۰,۰۰۰ تومان',
      ordersCount: 4,
      churnRisk: 15,
      lastInteraction: '۲ ساعت پیش (صفحه Sony XM5)',
      tags: ['علاقه‌مند به تکنولوژی', 'خریدار VIP', 'حساس به باتری'],
      summary: 'این مشتری پیش‌تر هدفون سنهایزر خریداری کرده و در صفحه سونی XM5 دو بار در مورد نویزکنسلینگ و کدک LDAC پرسیده است. تمایل به خرید هدفون دوم به صورت اقساطی دارد.',
      recommendedSms: 'سلام آقای کریمی عزیز، هدست Sony XM5 با ۲ سال گارانتی طلایی و ارسال ویژه برای شما آماده است. کد تخفیف اختصاصی VIP: SONY-MEHDI'
    },
    {
      id: 2,
      name: 'سارا امینی',
      phone: '09358129034',
      ltv: '۱۹,۲۰۰,۰۰۰ تومان',
      ordersCount: 2,
      churnRisk: 65,
      lastInteraction: 'دیروز (ترک سبد خرید)',
      tags: ['مردد در خرید', 'حساس به قیمت', 'کارت رها شده'],
      summary: 'این کاربر هدفون XM5 مشکی را به سبد خرید افزود اما در مرحله پرداخت به دلیل هزینه ارسال متوقف شد. نیاز به مداخله تخفیف ۵ درصدی یا ارسال رایگان دارد.',
      recommendedSms: 'سارا عزیز، ارسال سفارش شما رایگان شد! با کد SHIP-FREE سبد خرید خود را تکمیل نمایید.'
    },
    {
      id: 3,
      name: 'امیرحسین رضایی',
      phone: '09193214567',
      ltv: '۵۴,۰۰۰,۰۰۰ تومان',
      ordersCount: 6,
      churnRisk: 8,
      lastInteraction: '۳ روز پیش',
      tags: ['تولیدکننده محتوا', 'حساس به میکروفون', 'مشتری وفادار'],
      summary: 'کاربر پادکستر است و اولویت اصلی او کیفیت صدای میکروفون در فضای استودیویی و محیط شلوغ است. به شدت به تست صدا اهمیت می‌دهد.',
      recommendedSms: 'امیرحسین عزیز، تست ویدیویی میکروفون XM5 در استودیو برای شما ارسال شد. خوشحال می‌شویم دیدگاهت را بدانیم.'
    }
  ]);

  // --- TAB 5: Approvals & Queue State ---
  const [approvalCards, setApprovalCards] = useState([
    {
      id: 'app_1',
      user: 'علی رضایی',
      phone: '09121112233',
      spent: '۱۸,۰۰۰,۰۰۰ تومان',
      reason: 'تاخیر ۲۴ ساعته اداره پست و ارسال پیام نارضایتی در چت',
      proposedAction: 'صدور کوپن تخفیف ۲۵٪ و ارسال پیامک عذرخواهی رسمی',
      discountValue: 25,
      status: 'pending'
    },
    {
      id: 'app_2',
      user: 'پریسا محمدی',
      phone: '09365554433',
      spent: '۹,۵۰۰,۰۰۰ تومان',
      reason: 'درخواست بازگشت وجه به دلیل انتخاب اشتباه رنگ نقره‌ای',
      proposedAction: 'تعویض رایگان کالا بدون کسر هزینه پیک بازگشتی',
      discountValue: 0,
      status: 'pending'
    }
  ]);

  const [queueLogs, setQueueLogs] = useState([
    { id: 1084, trigger: 'مذاکره قیمت در باکس محصول', status: 'Completed', latency: '142ms', time: 'لحظاتی پیش', payload: { action: 'ai_advisory', product_id: 489, query: 'تست شارژدهی باتری' } },
    { id: 1083, trigger: 'استعلام کد رهگیری پستی ووکامرس', status: 'Completed', latency: '95ms', time: '۳ دقیقه پیش', payload: { action: 'persian_wc_track', tracking_code: '284910293849102948291048' } },
    { id: 1082, trigger: 'درخواست کد تخفیف ۲۵٪ (منتظر تأیید مدیر)', status: 'Pending Approval', latency: '210ms', time: '۸ دقیقه پیش', payload: { action: 'issue_coupon_request', discount: 25, customer_id: 102 } },
    { id: 1081, trigger: 'همگام‌سازی تگ‌های CRM با n8n', status: 'Completed', latency: '118ms', time: '۱۴ دقیقه پیش', payload: { tags_added: ['خریدار مردد', 'حساس به قیمت'] } },
    { id: 1080, trigger: 'ارسال وب‌هوک به n8n (سبد خرید رها شده)', status: 'Failed', latency: '4800ms', time: '۲۲ دقیقه پیش', payload: { error: 'Timeout 5000ms reaching n8n worker' } }
  ]);

  // Modal State for JSON Payload View
  const [selectedPayload, setSelectedPayload] = useState<any | null>(null);

  // Edit discount modal for approval
  const [editingApproval, setEditingApproval] = useState<any | null>(null);
  const [editDiscountVal, setEditDiscountVal] = useState<number>(20);

  // --- STOREFRONT PRODUCT STATE ---
  const [productColor, setProductColor] = useState<'black' | 'silver' | 'blue'>('black');
  const [productWarranty, setProductWarranty] = useState<'gold' | 'silver'>('gold');

  // AI Product Advisor Interactive State
  const [advisorMessages, setAdvisorMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; time: string }>>([
    {
      sender: 'ai',
      text: 'سلام! من مشاور هوشمند تخصصی هدفون Sony WH-1000XM5 هستم. دیتاشیت فنی و تجربیات صدها خریدار در اختیار من است. مایلید درباره شارژدهی، تست نویزکنسلینگ یا گارانتی سوال بپرسید؟',
      time: 'هم‌اکنون'
    }
  ]);
  const [advisorTyping, setAdvisorTyping] = useState(false);
  const [advisorInput, setAdvisorInput] = useState('');

  // Floating Chatbot Widget State
  const [chatOpen, setChatOpen] = useState(false);
  const [chatStage, setChatStage] = useState<'initial' | 'otp_form' | 'verified_order'>('initial');
  const [chatPhone, setChatPhone] = useState('09124458921');
  const [chatOtp, setChatOtp] = useState('');
  const [chatOtpTimer, setChatOtpTimer] = useState(115);
  const [chatTyping, setChatTyping] = useState(false);

  // Toast notification trigger
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Ping Test simulation
  const handlePingTest = () => {
    setIsPinging(true);
    setTimeout(() => {
      setIsPinging(false);
      setN8nPing(Math.floor(Math.random() * 8) + 14);
      showToast('✅ ارتباط با وب‌هوک n8n با موفقیت تست شد. پینگ سرور پایدار است.');
    }, 600);
  };

  // Replay Log
  const handleReplayLog = (logId: number) => {
    setQueueLogs(prev => prev.map(l => l.id === logId ? { ...l, status: 'Completed', latency: '124ms' } : l));
    showToast(`🔄 رویداد #${logId} مجدداً به صف n8n ارسال و با موفقیت اجرا شد.`);
  };

  // Approval Handlers
  const handleApprove = (id: string) => {
    setApprovalCards(prev => prev.filter(c => c.id !== id));
    showToast('✅ عملیات ایجنت با موفقیت توسط مدیر تأیید و در ووکامرس اعمال شد.');
  };

  const handleReject = (id: string) => {
    setApprovalCards(prev => prev.filter(c => c.id !== id));
    showToast('❌ درخواست ایجنت رد شد و به n8n اطلاع داده شد.');
  };

  const handleSaveEditDiscount = () => {
    if (editingApproval) {
      setApprovalCards(prev => prev.map(c => c.id === editingApproval.id ? { ...c, discountValue: editDiscountVal, proposedAction: `صدور کوپن تخفیف ${editDiscountVal}٪ و پیامک دلجویی` } : c));
      setEditingApproval(null);
      showToast(`✏️ سقف تخفیف برای کاربر به ${editDiscountVal}٪ تغییر یافت.`);
    }
  };

  // Advisor Q&A Trigger
  const handleAskAdvisor = (question: string) => {
    if (!question.trim()) return;

    setAdvisorMessages(prev => [...prev, { sender: 'user', text: question, time: 'هم‌اکنون' }]);
    setAdvisorInput('');
    setAdvisorTyping(true);

    setTimeout(() => {
      let reply = '';
      if (question.includes('باتری')) {
        reply = '🔋 در آزمایش‌های واقعی با نویزکنسلینگ فعال (ANC ON)، باتری دقیقاً ۳۰ ساعت پخش مداوم دارد. با خاموش کردن ANC این زمان به ۴۰ ساعت می‌رسد. همچنین قابلیت Fast Charge به شما این امکان را می‌دهد که تنها با ۳ دقیقه شارژ، تا ۳ ساعت موسیقی گوش دهید!';
      } else if (question.includes('میکروفون') || question.includes('تماس')) {
        reply = '🎙️ هدفون XM5 مجهز به ۸ میکروفون مجزا و ۲ پردازنده صوتی (V1 و QN1) است. سیستم حذف نویز مبتنی بر هوش مصنوعی نویز محیطی باد و همهمه خیابان را کاملاً فیلتر کرده و صدای شما به صورت شفاف و ایزوله منتقل می‌شود.';
      } else if (question.includes('XM4') || question.includes('مقایسه')) {
        reply = '⚖️ تفاوت‌های کلیدی نسبت به XM4: ۱. بدنه فوق سبک و ارگونومیک‌تر با حذف لولای تاشو ۲. دو برابر شدن تعداد میکروفون‌ها (۸ در برابر ۴) ۳. الگوریتم هوشمند Auto NC Optimizer که نویز محیط را خودکار اسکن می‌کند.';
      } else if (question.includes('جعبه') || question.includes('اقلام')) {
        reply = '📦 داخل جعبه رسمی سونی: ۱. کیف هاردکیس چرمی با آهنربای تاشو ۲. کابل شارژ Type-C ۳. کابل AUX جک ۳.۵ میلی‌متری طلایی ۴. دفترچه‌های راهنما و کارت اصالت سونی.';
      } else {
        reply = `پاسخ ایجنت: بر اساس مشخصات فنی ثبت شده در ووکامرس، هدفون Sony WH-1000XM5 با آمپدانس ۴۸ اهم و پاسخ فرکانسی ۴ تا ۴۰,۰۰۰ هرتز سازگار با صدای Hi-Res و فرمت LDAC است و پاسخگوی کامل این نیاز شما خواهد بود.`;
      }

      setAdvisorMessages(prev => [...prev, { sender: 'ai', text: reply, time: 'هم‌اکنون' }]);
      setAdvisorTyping(false);
    }, 750);
  };

  // In-Chat OTP Handlers
  const handleVerifyChatOtp = () => {
    if (!chatOtp || chatOtp.length < 4) {
      showToast('لطفاً کد تایید ۴ رقمی را وارد کنید.');
      return;
    }
    setChatTyping(true);
    setTimeout(() => {
      setChatTyping(false);
      setChatStage('verified_order');
      showToast('✅ شماره موبایل تایید شد. استعلام سفارش ووکامرس دریافت گردید.');
    }, 600);
  };

  return (
    <div className={`min-h-screen ${isDark ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 flex items-center gap-3 bg-purple-600 text-white px-5 py-3 rounded-xl shadow-2xl shadow-purple-900/50 text-sm font-medium animate-bounce">
          <Sparkles size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER & VIEW MODE SWITCHER */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-slate-900/80 border-b border-slate-800/80 px-4 lg:px-8 py-3 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Brand & Subtitle */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-purple-600/30">
                <Zap size={22} className="fill-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-black tracking-tight text-white">Automation Hub Pro</h1>
                  <span className="text-[11px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-mono">v1.2 AI</span>
                </div>
                <p className="text-xs text-slate-400">هاب اتوماسیون هوشمند و ایجنتیک ووکامرس (ویژه مارکت ژاکت)</p>
              </div>
            </div>

            {/* Mobile dark mode & status */}
            <div className="flex md:hidden items-center gap-2">
              <button
                onClick={() => setIsDark(!isDark)}
                className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                title="تغییر تم"
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
          </div>

          {/* MAIN VIEW SWITCHER (ADMIN DASHBOARD vs LIVE STOREFRONT) */}
          <div className="flex items-center p-1 bg-slate-800/90 rounded-2xl border border-slate-700/60 shadow-inner w-full md:w-auto justify-center">
            <button
              onClick={() => setCurrentView('admin')}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                currentView === 'admin'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-700/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Server size={16} />
              <span>پیشخوان مدیریت افزونه در وردپرس</span>
            </button>

            <button
              onClick={() => setCurrentView('storefront')}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                currentView === 'storefront'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShoppingBag size={16} />
              <span>پیش‌نمایش زنده صفحه محصول (PDP)</span>
              <span className="bg-emerald-400/20 text-emerald-300 text-[10px] px-1.5 py-0.5 rounded-md">لایو</span>
            </button>
          </div>

          {/* Right Status Badges & Controls */}
          <div className="hidden md:flex items-center gap-3">
            {/* Live n8n Ping Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/70 border border-slate-700 text-xs">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-slate-300">اتصال n8n:</span>
              <span className="font-mono text-emerald-400 font-semibold">{n8nPing}ms</span>
              <button
                onClick={handlePingTest}
                disabled={isPinging}
                className="text-slate-400 hover:text-white transition-colors"
                title="تست پینگ مجدد"
              >
                <RefreshCw size={13} className={isPinging ? 'animate-spin text-purple-400' : ''} />
              </button>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-750 transition-all"
              title={isDark ? 'تغییر به تم روشن' : 'تغییر به تم تاریک'}
            >
              {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-indigo-400" />}
            </button>
          </div>

        </div>
      </header>

      {/* ========================================================================= */}
      {/* VIEW 1: ADMIN DASHBOARD UI                                               */}
      {/* ========================================================================= */}
      {currentView === 'admin' && (
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
          
          {/* Admin Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Sidebar Navigation (Right in RTL) */}
            <aside className="lg:col-span-3 space-y-2">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
                <div className="text-xs font-semibold text-slate-400 mb-3 px-2">ماژول‌های هوش مصنوعی ایجنتیک:</div>
                <nav className="space-y-1">
                  
                  <button
                    onClick={() => setActiveAdminTab('mcp')}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-sm font-medium transition-all ${
                      activeAdminTab === 'mcp'
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Server size={18} />
                      <span>موتور سرور MCP و ابزارها</span>
                    </div>
                    <span className="text-[10px] bg-purple-400/20 text-purple-200 px-1.5 py-0.5 rounded">Core</span>
                  </button>

                  <button
                    onClick={() => setActiveAdminTab('product_box')}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-sm font-medium transition-all ${
                      activeAdminTab === 'product_box'
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Sparkles size={18} />
                      <span>مشاور هوشمند صفحه محصول</span>
                    </div>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">PDP</span>
                  </button>

                  <button
                    onClick={() => setActiveAdminTab('chatbot')}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-sm font-medium transition-all ${
                      activeAdminTab === 'chatbot'
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <MessageSquare size={18} />
                      <span>چت‌بات و احراز هویت پیامکی</span>
                    </div>
                    <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded">OTP</span>
                  </button>

                  <button
                    onClick={() => setActiveAdminTab('crm')}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-sm font-medium transition-all ${
                      activeAdminTab === 'crm'
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Users size={18} />
                      <span>پروفایل ۳۶۰ درجه مشتریان</span>
                    </div>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">CRM</span>
                  </button>

                  <button
                    onClick={() => setActiveAdminTab('queue')}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-sm font-medium transition-all ${
                      activeAdminTab === 'queue'
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Clock size={18} />
                      <span>صف، لاگ‌ها و تأیید انسانی</span>
                    </div>
                    {approvalCards.length > 0 && (
                      <span className="text-[11px] bg-rose-500 text-white font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                        {approvalCards.length}
                      </span>
                    )}
                  </button>

                </nav>
              </div>

              {/* Quick Info Box */}
              <div className="bg-gradient-to-br from-purple-950/40 to-slate-900 border border-purple-800/30 rounded-2xl p-4 text-xs space-y-2">
                <div className="flex items-center gap-2 text-purple-300 font-bold">
                  <ShieldCheck size={16} />
                  <span>سازگاری ۱۰۰٪ با وردپرس و ووکامرس</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  طراحی شده طبق استانداردهای مارکت ژاکت همراه با فایل‌های ترجمه، استایل‌های اختصاصی و سازگاری با ووکامرس فارسی.
                </p>
              </div>
            </aside>

            {/* Main Content Area */}
            <main className="lg:col-span-9 space-y-6">

              {/* ----------------------------------------------------------------- */}
              {/* TAB 1: MCP Server & REST Tools                                    */}
              {/* ----------------------------------------------------------------- */}
              {activeAdminTab === 'mcp' && (
                <div className="space-y-6 animate-fadeIn">
                  
                  {/* MCP Endpoint Box */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                      <div>
                        <h2 className="text-base font-bold text-white flex items-center gap-2">
                          <Server className="text-purple-400" size={18} />
                          آدرس سرور MCP اختصاصی سایت (Model Context Protocol)
                        </h2>
                        <p className="text-xs text-slate-400 mt-1">
                          این اندپوینت را در سناریوهای n8n به عنوان Tool Provider وارد کنید تا تمام توانایی‌های فروشگاه مستقیماً در اختیار ایجنت قرار گیرد.
                        </p>
                      </div>

                      <button
                        onClick={handlePingTest}
                        className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-md shrink-0"
                      >
                        <Zap size={14} />
                        <span>تست پینگ با n8n</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-slate-300 mb-1 block">MCP Server Endpoint (REST):</label>
                        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
                          <code className="text-xs text-purple-300 font-mono flex-1 overflow-x-auto text-left" dir="ltr">
                            https://your-store.com/wp-json/automation-hub/v1/mcp
                          </code>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText('https://your-store.com/wp-json/automation-hub/v1/mcp');
                              setCopiedEndpoint(true);
                              setTimeout(() => setCopiedEndpoint(false), 2000);
                              showToast('لینک اندپوینت کپی شد!');
                            }}
                            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                            title="کپی لینک"
                          >
                            {copiedEndpoint ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-300 mb-1 block">کلید امنیتی Bearer Token (رمزنگاری شده):</label>
                        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
                          <code className="text-xs text-slate-400 font-mono flex-1 overflow-x-auto text-left" dir="ltr">
                            hub_sec_98f12a0d9e838bcae91249b7c8e90a12
                          </code>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText('hub_sec_98f12a0d9e838bcae91249b7c8e90a12');
                              setCopiedToken(true);
                              setTimeout(() => setCopiedToken(false), 2000);
                              showToast('توکن امنیتی کپی شد!');
                            }}
                            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                            title="کپی توکن"
                          >
                            {copiedToken ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Agent Abilities & REST Tools */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                          <Sliders className="text-purple-400" size={18} />
                          مدیریت توانایی‌های ایجنت (Agent Abilities & REST Tools)
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">ابزارهایی که ایجنت n8n مجاز است به صورت خودکار در ووکامرس صدا بزند.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Tool 1 */}
                      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-sm text-white">۱. جستجوی زنده متغیرهای ووکامرس</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={toolsActive.stockSearch}
                                onChange={e => setToolsActive({ ...toolsActive, stockSearch: e.target.checked })}
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                            </label>
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            استعلام زنده موجودی انبار، رنگ‌بندی، سایز و قیمت نهایی محصول در پاسخ به مشتری بدون کش شدن اطلاعات.
                          </p>
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                          <span>سقف درخواست مجاز (Rate Limit):</span>
                          <span className="font-mono text-purple-300">۱۲۰ در دقیقه</span>
                        </div>
                      </div>

                      {/* Tool 2: Dynamic Discount with Slider */}
                      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-sm text-white">۲. ساخت کوپن تخفیف برای چانه‌زنی</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={toolsActive.dynamicDiscount}
                                onChange={e => setToolsActive({ ...toolsActive, dynamicDiscount: e.target.checked })}
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                            </label>
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            امکان صدور کوپن یکبارمصرف توسط ایجنت در هنگام تردید مشتری در خرید یا رها شدن سبد خرید.
                          </p>
                        </div>
                        
                        <div className="mt-3 pt-3 border-t border-slate-800 space-y-1">
                          <div className="flex items-center justify-between text-[11px] text-slate-300">
                            <span>حداکثر سقف تخفیف مجاز (Guardrail):</span>
                            <span className="font-bold text-amber-400">{rateLimitDiscount}٪</span>
                          </div>
                          <input
                            type="range"
                            min={5}
                            max={40}
                            value={rateLimitDiscount}
                            onChange={e => setRateLimitDiscount(Number(e.target.value))}
                            className="w-full accent-purple-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Tool 3: Persian WC Postal Tracking */}
                      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-sm text-white">۳. استعلام کد رهگیری پست (Persian WC)</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={toolsActive.persianWcTracking}
                                onChange={e => setToolsActive({ ...toolsActive, persianWcTracking: e.target.checked })}
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                            </label>
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            خواندن مستقیم کد رهگیری ۲۴ رقمی پستی از پلاگین ووکامرس فارسی و نمایش مرحله به مرحله ارسال کالا درون چت.
                          </p>
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                          <span>ماژول سازگار:</span>
                          <span className="text-emerald-400 font-mono">class-persian-wc.php</span>
                        </div>
                      </div>

                      {/* Tool 4: CRM Tags */}
                      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-sm text-white">۴. برچسب‌گذاری و آپدیت پروفایل CRM</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={toolsActive.crmTags}
                                onChange={e => setToolsActive({ ...toolsActive, crmTags: e.target.checked })}
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                            </label>
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            ایجنت پس از هر مکالمه برچسب‌های شخصیتی (مانند «حساس به باتری» یا «تردید در قیمت») را به پروفایل مشتری سنجاق می‌کند.
                          </p>
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                          <span>ذخیره‌سازی متادیتا:</span>
                          <span className="text-purple-300 font-mono">usermeta: hub_tags</span>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* 1-Click Blueprints for n8n */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                      <Download className="text-purple-400" size={18} />
                      قالب‌های آماده یک‌کلیکی n8n (One-Click Agentic Blueprints)
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">
                      فایل‌های JSON آماده سناریو را دانلود کرده و در سرور n8n خود ایمپورت (Import) کنید تا در ۲ دقیقه راه‌اندازی شود.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      
                      <div className="bg-slate-950 border border-slate-800 hover:border-purple-600/50 rounded-xl p-4 transition-all">
                        <div className="w-8 h-8 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center mb-3">
                          <Bot size={18} />
                        </div>
                        <h4 className="text-sm font-bold text-white mb-1">ایجنت مشاور صفحه محصول</h4>
                        <p className="text-xs text-slate-400 leading-relaxed mb-4">
                          متصل به Gemini 2.5 Flash برای پاسخگویی به سوالات مشخصات فنی، گارانتی و سازگاری.
                        </p>
                        <button
                          onClick={() => showToast('دانلود فایل سناریو n8n-product-advisor.json آغاز شد.')}
                          className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-purple-600 hover:text-white text-slate-300 py-2 rounded-lg text-xs font-semibold transition-colors"
                        >
                          <Download size={14} />
                          <span>دانلود فایل سناریو JSON</span>
                        </button>
                      </div>

                      <div className="bg-slate-950 border border-slate-800 hover:border-emerald-600/50 rounded-xl p-4 transition-all">
                        <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center mb-3">
                          <ShoppingBag size={18} />
                        </div>
                        <h4 className="text-sm font-bold text-white mb-1">ایجنت بازگردانی سبد خرید رها</h4>
                        <p className="text-xs text-slate-400 leading-relaxed mb-4">
                          مذاکره هوشمند خودکار پیامکی با مشتریانی که در مرحله نهایی خرید منصرف شده‌اند.
                        </p>
                        <button
                          onClick={() => showToast('دانلود فایل سناریو n8n-cart-recovery.json آغاز شد.')}
                          className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-300 py-2 rounded-lg text-xs font-semibold transition-colors"
                        >
                          <Download size={14} />
                          <span>دانلود فایل سناریو JSON</span>
                        </button>
                      </div>

                      <div className="bg-slate-950 border border-slate-800 hover:border-blue-600/50 rounded-xl p-4 transition-all">
                        <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center mb-3">
                          <Tag size={18} />
                        </div>
                        <h4 className="text-sm font-bold text-white mb-1">ایجنت اتوماتیک CRM و تحلیل</h4>
                        <p className="text-xs text-slate-400 leading-relaxed mb-4">
                          استخراج رفتار خرید از روی چت‌ها، محاسبه ریسک ریزش و اطلاع‌رسانی لیدهای داغ به تلگرام ادمین.
                        </p>
                        <button
                          onClick={() => showToast('دانلود فایل سناریو n8n-auto-crm.json آغاز شد.')}
                          className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-300 py-2 rounded-lg text-xs font-semibold transition-colors"
                        >
                          <Download size={14} />
                          <span>دانلود فایل سناریو JSON</span>
                        </button>
                      </div>

                    </div>
                  </div>

                </div>
              )}

              {/* ----------------------------------------------------------------- */}
              {/* TAB 2: Single Product AI Box Settings                             */}
              {/* ----------------------------------------------------------------- */}
              {activeAdminTab === 'product_box' && (
                <div className="space-y-6 animate-fadeIn">
                  
                  {/* Placement & Hook Configuration */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                      <Sparkles className="text-purple-400" size={18} />
                      تنظیمات محل نمایش باکس مشاور هوشمند در صفحه محصول ووکامرس
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">
                      موقعیت دقیق قرارگیری باکس گفتگو در ساختار تم ووکامرس را مشخص کنید.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <label
                        className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                          selectedHook === 'below_cart'
                            ? 'bg-purple-950/40 border-purple-500 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name="hook_placement"
                          checked={selectedHook === 'below_cart'}
                          onChange={() => setSelectedHook('below_cart')}
                          className="mt-1 accent-purple-600"
                        />
                        <div>
                          <div className="text-xs font-bold">دقیقاً زیر دکمه افزودن به سبد خرید</div>
                          <div className="text-[11px] text-slate-400 mt-1 font-mono">woocommerce_after_add_to_cart_button</div>
                          <span className="inline-block mt-2 text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">
                            پیشنهادی (بیشترین نرخ تبدیل)
                          </span>
                        </div>
                      </label>

                      <label
                        className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                          selectedHook === 'tabs'
                            ? 'bg-purple-950/40 border-purple-500 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name="hook_placement"
                          checked={selectedHook === 'tabs'}
                          onChange={() => setSelectedHook('tabs')}
                          className="mt-1 accent-purple-600"
                        />
                        <div>
                          <div className="text-xs font-bold">داخل تب‌های اطلاعات محصول</div>
                          <div className="text-[11px] text-slate-400 mt-1 font-mono">woocommerce_product_tabs</div>
                        </div>
                      </label>

                      <label
                        className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                          selectedHook === 'above_summary'
                            ? 'bg-purple-950/40 border-purple-500 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name="hook_placement"
                          checked={selectedHook === 'above_summary'}
                          onChange={() => setSelectedHook('above_summary')}
                          className="mt-1 accent-purple-600"
                        />
                        <div>
                          <div className="text-xs font-bold">بالای توضیحات کوتاه محصول</div>
                          <div className="text-[11px] text-slate-400 mt-1 font-mono">woocommerce_before_single_product_summary</div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Context Injection Sources */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                      <Layers className="text-purple-400" size={18} />
                      تغذیه دانش محصول به ایجنت هوشمند (Product Context Injection)
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">
                      مشخص کنید ایجنت در پاسخگویی به سوالات خریدار، چه بخش‌هایی از اطلاعات محصول را مطالعه کند:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        { key: 'specs', label: 'جدول مشخصات فنی محصول', desc: 'ابعاد، وزن، اتصالات و متغیرها' },
                        { key: 'fullDesc', label: 'توضیحات کامل محصول', desc: 'متن نقد و بررسی و امکانات اصلی' },
                        { key: 'reviews', label: 'نظرات خریداران تاییدشده', desc: 'تحلیل نقاط قوت و ضعف از دید خریداران' },
                        { key: 'faq', label: 'سوالات متداول و شرایط گارانتی', desc: 'نحوه مرجوعی، مهلت تست و پشتیبانی' },
                        { key: 'pdf', label: 'کاتالوگ و دیتاشیت PDF', desc: 'استخراج متن از فایل پی‌دی‌اف پیوست' }
                      ].map(item => (
                        <label
                          key={item.key}
                          className="flex items-start gap-3 p-3 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={(contextSources as any)[item.key]}
                            onChange={e => setContextSources({ ...contextSources, [item.key]: e.target.checked })}
                            className="mt-1 accent-purple-600 rounded"
                          />
                          <div>
                            <div className="text-xs font-semibold text-white">{item.label}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">{item.desc}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Smart Prompt Chips */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                      <Tag className="text-purple-400" size={18} />
                      چیپ‌های سؤالات پیشنهادی هوشمند (Quick Prompt Chips)
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">
                      این گزینه‌ها به صورت دکمه‌های آماده بالای باکس چت در صفحه محصول قرار می‌گیرند تا کاربر با یک کلیک پاسخ را ببیند:
                    </p>

                    <div className="space-y-2 mb-4">
                      {promptChipsList.map((chip, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-3 bg-slate-950 border border-slate-800 px-4 py-2.5 rounded-xl text-xs">
                          <span className="text-slate-200">{chip}</span>
                          <button
                            onClick={() => setPromptChipsList(promptChipsList.filter((_, i) => i !== idx))}
                            className="text-slate-500 hover:text-rose-400 transition-colors"
                          >
                            <X size={15} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newChipInput}
                        onChange={e => setNewChipInput(e.target.value)}
                        placeholder="افزودن سوال پیشنهادی جدید (مثلا: آیا برای گیمینگ تاخیر صدا دارد؟)..."
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-purple-600"
                      />
                      <button
                        onClick={() => {
                          if (newChipInput.trim()) {
                            setPromptChipsList([...promptChipsList, newChipInput.trim()]);
                            setNewChipInput('');
                            showToast('چیپ سوال جدید با موفقیت اضافه شد.');
                          }
                        }}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shrink-0"
                      >
                        + افزودن چیپ
                      </button>
                    </div>
                  </div>

                  {/* Conversion Analytics Table */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-base font-bold text-white mb-3">آمار و عملکرد باکس مشاور هوشمند (ماه جاری)</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                        <div className="text-2xl font-black text-emerald-400 font-mono">۸.۴٪</div>
                        <div className="text-xs text-slate-400 mt-1">نرخ تبدیل با مکالمه مشاور</div>
                      </div>
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                        <div className="text-2xl font-black text-slate-400 font-mono">۲.۱٪</div>
                        <div className="text-xs text-slate-400 mt-1">نرخ تبدیل بدون مشاوره عادی</div>
                      </div>
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                        <div className="text-2xl font-black text-purple-400 font-mono">+۳۰۰٪</div>
                        <div className="text-xs text-slate-400 mt-1">میزان رشد فروش قطعی</div>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* ----------------------------------------------------------------- */}
              {/* TAB 3: Chatbot & In-Chat OTP Settings                             */}
              {/* ----------------------------------------------------------------- */}
              {activeAdminTab === 'chatbot' && (
                <div className="space-y-6 animate-fadeIn">
                  
                  {/* SMS Gateway & OTP Config */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                      <Phone className="text-purple-400" size={18} />
                      تنظیمات احراز هویت پیامکی درون چت (In-Chat OTP)
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">
                      کاربر بدون ترک صفحه چت یا هدایت به صفحه دیگر، شماره موبایل خود را وارد کرده و کد ۴ رقمی را مستقیماً در حباب چت تایید می‌کند.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-slate-300 mb-1 block">سامانه پیامک فعال:</label>
                        <select
                          value={smsGateway}
                          onChange={e => setSmsGateway(e.target.value as any)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-600"
                        >
                          <option value="melipayamak">ملی پیامک (Payamak-Panel REST & SOAP)</option>
                          <option value="kavenegar">کاوه‌نگار (Kavenegar Verify Lookup)</option>
                          <option value="farapayamak">فراپیامک (FaraPayamak Service)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-300 mb-1 block">مدت زمان اعتبار کد تایید (ثانیه):</label>
                        <input
                          type="number"
                          value={otpExpiry}
                          onChange={e => setOtpExpiry(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-600 font-mono"
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="text-xs font-medium text-slate-300 mb-1 block">متن قالب پیامک کد تایید (Pattern):</label>
                      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 font-mono leading-relaxed" dir="rtl">
                        کد تایید ورود شما به فروشگاه: <span className="text-purple-400 font-bold">&#123;otp&#125;</span>
                        <br />
                        اتوماسیون هاب هوشمند
                      </div>
                    </div>
                  </div>

                  {/* Rich UI Cards & Exit-Intent */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Layers className="text-purple-400" size={18} />
                      کارت‌های تعاملی و مداخله هوشمند
                    </h3>

                    <div className="space-y-3">
                      <label className="flex items-center justify-between p-3.5 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer">
                        <div>
                          <div className="text-sm font-semibold text-white">کارت‌های گرافیکی سفارش و انتخاب متغیر درون چت</div>
                          <div className="text-xs text-slate-400 mt-0.5">امکان انتخاب رنگ، سایز و افزودن مستقیم به سبد خرید از داخل محیط چت‌بات</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={enableRichCards}
                          onChange={e => setEnableRichCards(e.target.checked)}
                          className="accent-purple-600 rounded scale-125"
                        />
                      </label>

                      <label className="flex items-center justify-between p-3.5 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer">
                        <div>
                          <div className="text-sm font-semibold text-white">مذاکره‌کننده هوشمند هنگام خروج از صفحه (Exit-Intent AI)</div>
                          <div className="text-xs text-slate-400 mt-0.5">تشخیص قصد ترک صفحه تسویه‌حساب و پیشنهاد کد تخفیف یا پاسخ فوری به ابهام مشتری</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={enableExitIntent}
                          onChange={e => setEnableExitIntent(e.target.checked)}
                          className="accent-purple-600 rounded scale-125"
                        />
                      </label>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={() => showToast('تنظیمات چت‌بات با موفقیت در وردپرس ذخیره گردید.')}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md"
                      >
                        ذخیره تنظیمات چت‌بات 💾
                      </button>
                    </div>
                  </div>

                </div>
              )}

              {/* ----------------------------------------------------------------- */}
              {/* TAB 4: CRM & AI Lead Profiling                                    */}
              {/* ----------------------------------------------------------------- */}
              {activeAdminTab === 'crm' && (
                <div className="space-y-6 animate-fadeIn">
                  
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                      <div>
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                          <Users className="text-purple-400" size={18} />
                          پروفایل‌سازی ۳۶۰ درجه مشتریان با هوش مصنوعی (AI Lead Profiling)
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                          تحلیل رفتار خرید، سوالات پرسیده شده در چت، تشخیص ریسک ریزش و استخراج خودکار برچسب‌های مشتری.
                        </p>
                      </div>

                      <div className="relative w-full md:w-64">
                        <Search className="absolute right-3 top-2.5 text-slate-500" size={16} />
                        <input
                          type="text"
                          value={customerSearch}
                          onChange={e => setCustomerSearch(e.target.value)}
                          placeholder="جستجوی نام یا شماره موبایل..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-2 text-xs text-white focus:outline-none focus:border-purple-600"
                        />
                      </div>
                    </div>

                    {/* Customers Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                            <th className="py-3 px-3">نام و شماره مشتری</th>
                            <th className="py-3 px-3">ارزش خرید (LTV)</th>
                            <th className="py-3 px-3">ریسک ریزش (Churn)</th>
                            <th className="py-3 px-3">برچسب‌های هوش مصنوعی (AI Tags)</th>
                            <th className="py-3 px-3 text-left">عملیات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {crmCustomers
                            .filter(c => c.name.includes(customerSearch) || c.phone.includes(customerSearch))
                            .map(cust => (
                              <tr key={cust.id} className="hover:bg-slate-800/40 transition-colors">
                                <td className="py-3 px-3">
                                  <div className="font-bold text-white">{cust.name}</div>
                                  <div className="text-[11px] text-slate-400 font-mono" dir="ltr">{cust.phone}</div>
                                </td>
                                <td className="py-3 px-3 font-mono font-semibold text-slate-200">
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
                                    onClick={() => setSelectedCustomer(cust)}
                                    className="bg-slate-800 hover:bg-purple-600 hover:text-white text-slate-300 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1.5"
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

              {/* ----------------------------------------------------------------- */}
              {/* TAB 5: Approvals, Queue & Live Logs (Human-in-the-Loop)           */}
              {/* ----------------------------------------------------------------- */}
              {activeAdminTab === 'queue' && (
                <div className="space-y-6 animate-fadeIn">
                  
                  {/* Human-in-the-Loop Approvals Desk */}
                  <div className="bg-slate-900 border border-amber-600/30 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                          <AlertTriangle className="text-amber-400" size={18} />
                          کارتابل در انتظار تأیید انسانی (Human-in-the-Loop Desk)
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                          ایجنت قبل از اجرای این عملیات‌های حساس (مانند ایجاد تخفیف ویژه یا کسر انبار)، منتظر تأیید مدیر فروشگاه است.
                        </p>
                      </div>
                      <span className="bg-amber-500/20 text-amber-300 text-xs px-2.5 py-1 rounded-full font-bold">
                        {approvalCards.length} عملیات معلق
                      </span>
                    </div>

                    {approvalCards.length === 0 ? (
                      <div className="text-center py-6 text-xs text-slate-400 bg-slate-950 rounded-xl border border-slate-800">
                        ✅ تمام درخواست‌های ایجنت بررسی و تأیید شدند. کارتابل خالی است.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {approvalCards.map(card => (
                          <div key={card.id} className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-white">{card.user}</span>
                                <span className="text-slate-400 text-xs font-mono" dir="ltr">({card.phone})</span>
                                <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">مجموع خرید: {card.spent}</span>
                              </div>
                              <p className="text-xs text-amber-300/90 font-medium">علت: {card.reason}</p>
                              <p className="text-xs text-slate-300">پیشنهاد ایجنت: <strong>{card.proposedAction}</strong></p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => handleApprove(card.id)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-md inline-flex items-center gap-1.5"
                              >
                                <Check size={14} />
                                <span>تأیید و اجرا</span>
                              </button>

                              {card.discountValue > 0 && (
                                <button
                                  onClick={() => {
                                    setEditingApproval(card);
                                    setEditDiscountVal(card.discountValue);
                                  }}
                                  className="bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5"
                                >
                                  <Sliders size={14} />
                                  <span>ویرایش درصد</span>
                                </button>
                              )}

                              <button
                                onClick={() => handleReject(card.id)}
                                className="bg-slate-800 hover:bg-rose-600 hover:text-white text-slate-400 px-3.5 py-2 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5"
                              >
                                <X size={14} />
                                <span>رد</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Live Queue & Logs Table */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                          <Clock className="text-purple-400" size={18} />
                          صف اجرا، لاگ‌ها و پاسخ‌های سرور n8n (Live Queue)
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">مدیریت رویدادهای Async با امکان مشاهده Payload کامل JSON و اجرای مجدد ۱-کلیکی (Replay).</p>
                      </div>

                      <button
                        onClick={() => showToast('صف رویدادها به‌روزرسانی شد.')}
                        className="bg-slate-800 hover:bg-slate-750 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5"
                      >
                        <RefreshCw size={13} />
                        <span>تازه‌سازی</span>
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                            <th className="py-3 px-3">شناسه</th>
                            <th className="py-3 px-3">نوع رویداد (Trigger)</th>
                            <th className="py-3 px-3">وضعیت</th>
                            <th className="py-3 px-3">زمان پاسخ</th>
                            <th className="py-3 px-3">زمان ثبت</th>
                            <th className="py-3 px-3 text-left">عملیات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {queueLogs.map(item => (
                            <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                              <td className="py-3 px-3 font-mono font-bold text-slate-300">#{item.id}</td>
                              <td className="py-3 px-3 text-white font-medium">{item.trigger}</td>
                              <td className="py-3 px-3">
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                                    item.status === 'Completed'
                                      ? 'bg-emerald-500/20 text-emerald-300'
                                      : item.status === 'Pending Approval'
                                      ? 'bg-amber-500/20 text-amber-300'
                                      : item.status === 'Queued'
                                      ? 'bg-blue-500/20 text-blue-300'
                                      : 'bg-rose-500/20 text-rose-300'
                                  }`}
                                >
                                  {item.status}
                                </span>
                              </td>
                              <td className="py-3 px-3 font-mono text-slate-400">{item.latency}</td>
                              <td className="py-3 px-3 text-slate-400">{item.time}</td>
                              <td className="py-3 px-3 text-left">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => setSelectedPayload(item)}
                                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                                    title="مشاهده Payload JSON"
                                  >
                                    <FileCode size={14} />
                                  </button>

                                  {item.status === 'Failed' && (
                                    <button
                                      onClick={() => handleReplayLog(item.id)}
                                      className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1"
                                      title="اجرای مجدد"
                                    >
                                      <RefreshCw size={12} />
                                      <span>Replay</span>
                                    </button>
                                  )}
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
      {/* VIEW 2: LIVE STOREFRONT & SINGLE PRODUCT PAGE DEMO (PDP)                  */}
      {/* ========================================================================= */}
      {currentView === 'storefront' && (
        <div className="animate-fadeIn">
          
          {/* Top Promotional Banner */}
          <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-purple-100 text-xs py-2 px-4 text-center font-medium border-b border-purple-800/40">
            <span>🎉 ارسال رایگان سفارش‌های بالای ۵۰۰ هزار تومان به سراسر کشور با ضمانت اصالت کالا</span>
          </div>

          {/* Storefront Mini Header */}
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-6">
              <span className="text-base font-black text-white flex items-center gap-2">
                <ShoppingBag className="text-emerald-500" size={20} />
                فروشگاه آنلاین تکنولوژی
              </span>
              <nav className="hidden sm:flex items-center gap-4 text-xs text-slate-400">
                <span className="hover:text-white cursor-pointer">کالای دیجیتال</span>
                <span className="hover:text-white cursor-pointer">هدفون و هندزفری</span>
                <span className="hover:text-white cursor-pointer">لوازم جانبی صوتی</span>
                <span className="hover:text-white cursor-pointer">تخفیف‌های ویژه</span>
              </nav>
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

          {/* Breadcrumbs */}
          <div className="max-w-6xl mx-auto px-4 py-3 text-xs text-slate-400 flex items-center gap-2">
            <span>خانه</span>
            <span>/</span>
            <span>کالای دیجیتال</span>
            <span>/</span>
            <span>هدفون و هندزفری</span>
            <span>/</span>
            <span className="text-slate-200">هدفون بی‌سیم نویزکنسلینگ سونی مدل WH-1000XM5</span>
          </div>

          {/* Single Product Showcase Container */}
          <div className="max-w-6xl mx-auto px-4 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Product Gallery (Right column in RTL) */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden group">
                  <div className="absolute top-4 right-4 bg-emerald-500 text-slate-950 text-xs font-bold px-2.5 py-1 rounded-full shadow-md z-10">
                    اصل / گارانتی رسمی
                  </div>

                  {/* High Quality Product Render Illustration */}
                  <div className="w-full h-80 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 flex flex-col items-center justify-center p-6 border border-slate-800/80 relative">
                    {/* Visual Headphone Representation */}
                    <div className="relative w-48 h-48 flex items-center justify-center">
                      <div className={`w-40 h-40 rounded-full border-8 transition-all duration-300 ${
                        productColor === 'black'
                          ? 'border-slate-800 bg-slate-950 shadow-2xl shadow-slate-950'
                          : productColor === 'silver'
                          ? 'border-slate-300 bg-slate-200 shadow-2xl shadow-slate-400/20'
                          : 'border-blue-900 bg-slate-950 shadow-2xl shadow-blue-900/30'
                      } flex items-center justify-center relative`}>
                        <div className="absolute -top-3 w-32 h-6 border-t-8 border-inherit rounded-t-full"></div>
                        <div className="text-center space-y-1">
                          <span className="text-xs font-black tracking-widest text-slate-400 block font-mono">SONY</span>
                          <span className="text-[10px] text-purple-400 block font-mono">WH-1000XM5</span>
                          <span className="text-[9px] text-emerald-400 block font-mono">ANC ACTIVE</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 text-center">
                      <span className="text-xs font-semibold text-slate-300">هدفون سونی پرچمدار نویزکنسلینگ</span>
                      <span className="block text-[11px] text-slate-500 mt-0.5">سری ۲۰۲۶ با معماری پردازنده V1 + QN1</span>
                    </div>
                  </div>

                  {/* Thumbnail Row */}
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {['نمای جلو', 'کیف هاردکیس', 'درگاه Type-C'].map((label, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-950 border border-slate-800 rounded-xl p-2 text-center text-[10px] text-slate-400 hover:border-purple-600 cursor-pointer"
                      >
                        {label}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Key Features Pill Badges */}
                <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-4 grid grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                    <span>۳۰ ساعت شارژ مداوم</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                    <span>۸ میکروفون Beamforming</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                    <span>شارژ سریع ۳ دقیقه = ۳ ساعت</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                    <span>پشتیبانی از صدای Hi-Res و LDAC</span>
                  </div>
                </div>
              </div>

              {/* Product Info & Purchase Module (Left column in RTL) */}
              <div className="lg:col-span-7 space-y-6">
                <div>
                  <div className="flex items-center gap-2 text-xs text-purple-400 font-semibold mb-2">
                    <span>برند: سونی (SONY)</span>
                    <span>·</span>
                    <span>دسته‌بندی: پرچمدار صوتی ۲۰۲۶</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">
                    هدفون بی‌سیم نویزکنسلینگ سونی مدل WH-1000XM5
                  </h1>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    نسل پنجم برترین هدفون نویزکنسلینگ دنیا با ساختار ارگونومیک بدون درز، ۲ پردازنده مجزا برای خنثی‌سازی کامل نویز هواپیما و محیط و پشتیبانی کامل از اپلیکیشن رسمی Sony Headphones.
                  </p>
                </div>

                {/* Price & Rating */}
                <div className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                  <div>
                    <span className="text-xs text-slate-400 block mb-0.5">قیمت رسمی با تخفیف ویژه:</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-emerald-400 font-mono">۱۹,۸۰۰,۰۰۰</span>
                      <span className="text-xs text-slate-300">تومان</span>
                      <span className="text-xs text-slate-500 line-through mr-2 font-mono">۲۱,۵۰۰,۰۰۰</span>
                    </div>
                  </div>

                  <div className="text-left">
                    <div className="flex items-center gap-1 text-amber-400 justify-end">
                      {'★'.repeat(5)}
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1 block">۴.۹ از ۵ (۴۸ نظر تاییدشده)</span>
                  </div>
                </div>

                {/* Color Selector */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-2">
                    انتخاب رنگ: <span className="text-purple-400">{productColor === 'black' ? 'مشکی مات' : productColor === 'silver' ? 'نقره‌ای پلاتینیوم' : 'سرمه‌ای تیره'}</span>
                  </label>
                  <div className="flex gap-3">
                    {[
                      { key: 'black', label: 'مشکی مات', colorClass: 'bg-slate-950 border-slate-700' },
                      { key: 'silver', label: 'نقره‌ای پلاتینیوم', colorClass: 'bg-slate-200 border-slate-400' },
                      { key: 'blue', label: 'سرمه‌ای تیره', colorClass: 'bg-blue-950 border-blue-800' }
                    ].map(c => (
                      <button
                        key={c.key}
                        onClick={() => setProductColor(c.key as any)}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-medium transition-all ${
                          productColor === c.key
                            ? 'border-purple-500 bg-purple-950/40 text-white'
                            : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded-full border ${c.colorClass}`}></span>
                        <span>{c.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Warranty Selector */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-2">گارانتی و خدمات پس از فروش:</label>
                  <div className="grid grid-cols-2 gap-3">
                    <label
                      onClick={() => setProductWarranty('gold')}
                      className={`p-3 rounded-xl border cursor-pointer text-xs flex items-center justify-between ${
                        productWarranty === 'gold' ? 'border-purple-500 bg-purple-950/30 text-white' : 'border-slate-800 bg-slate-900 text-slate-400'
                      }`}
                    >
                      <span className="font-semibold">گارانتی ۲۴ ماهه طلایی تعویض فوری</span>
                      <span className="text-emerald-400 font-bold">+ رایگان</span>
                    </label>

                    <label
                      onClick={() => setProductWarranty('silver')}
                      className={`p-3 rounded-xl border cursor-pointer text-xs flex items-center justify-between ${
                        productWarranty === 'silver' ? 'border-purple-500 bg-purple-950/30 text-white' : 'border-slate-800 bg-slate-900 text-slate-400'
                      }`}
                    >
                      <span className="font-semibold">گارانتی ۱۸ ماهه شرکتی سونی</span>
                      <span className="text-slate-400 font-mono">پایه</span>
                    </label>
                  </div>
                </div>

                {/* Add To Cart Primary Button */}
                <button
                  onClick={() => {
                    setCartCount(prev => prev + 1);
                    showToast('🛒 هدفون Sony WH-1000XM5 با موفقیت به سبد خرید افزوده شد!');
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 px-6 rounded-2xl text-sm font-black flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-900/30 hover:scale-[1.01]"
                >
                  <ShoppingBag size={20} />
                  <span>افزودن به سبد خرید (۱۹,۸۰۰,۰۰۰ تومان)</span>
                </button>

                {/* ============================================================= */}
                {/* 🌟 FEATURE HIGHLIGHT: SINGLE PRODUCT AI ADVISOR BOX          */}
                {/* (Located strictly below Add to Cart Button as requested)      */}
                {/* ============================================================= */}
                <div className="bg-gradient-to-br from-slate-900 via-purple-950/30 to-slate-900 border-2 border-purple-500/40 rounded-3xl p-5 shadow-2xl relative overflow-hidden ai-glow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center text-white shadow-md">
                        <Sparkles size={16} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">مشاور هوشمند این محصول (پاسخگویی آنی با AI)</h3>
                        <p className="text-[11px] text-purple-300">متصل به متادیتا، نظرات خریداران و دیتاشیت فنی کارخانه</p>
                      </div>
                    </div>
                    <span className="text-[10px] bg-purple-500/20 text-purple-200 border border-purple-500/30 px-2 py-0.5 rounded-full font-mono">
                      Online AI Agent
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                    مطمئن نیستید این دستگاه مناسب شماست؟ هر سؤالی درباره مشخصات واقعی یا کارایی آن دارید بپرسید!
                  </p>

                  {/* Interactive Quick Prompt Chips */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {promptChipsList.slice(0, 3).map((chip, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleAskAdvisor(chip)}
                        className="bg-slate-950/80 hover:bg-purple-600 hover:text-white text-purple-200 border border-purple-800/40 text-[11px] px-3 py-1.5 rounded-xl transition-all text-right"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>

                  {/* Advisor Chat Messages Window */}
                  <div className="bg-slate-950/90 border border-slate-800/80 rounded-2xl p-3.5 space-y-3 max-h-56 overflow-y-auto mb-3">
                    {advisorMessages.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[88%] p-3 rounded-2xl text-xs leading-relaxed ${
                            msg.sender === 'user'
                              ? 'bg-purple-600 text-white rounded-br-none'
                              : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-bl-none'
                          }`}
                        >
                          {msg.text}
                        </div>
                        <span className="text-[10px] text-slate-500 mt-0.5 px-1">{msg.time}</span>
                      </div>
                    ))}

                    {/* Typing Animation Simulator */}
                    {advisorTyping && (
                      <div className="flex items-center gap-1.5 bg-slate-800/80 px-3.5 py-2.5 rounded-2xl rounded-bl-none w-20">
                        <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-dot-1"></span>
                        <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-dot-2"></span>
                        <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-dot-3"></span>
                      </div>
                    )}
                  </div>

                  {/* Custom Question Input */}
                  <form
                    onSubmit={e => {
                      e.preventDefault();
                      handleAskAdvisor(advisorInput);
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      value={advisorInput}
                      onChange={e => setAdvisorInput(e.target.value)}
                      placeholder="سوالی درباره اتصال همزمان به دو دستگاه، شارژدهی یا صدای بازی دارید؟..."
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    />
                    <button
                      type="submit"
                      disabled={advisorTyping}
                      className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center shrink-0"
                    >
                      <Send size={14} className="rotate-180" />
                    </button>
                  </form>
                </div>

              </div>

            </div>
          </div>

          {/* =================================================================== */}
          {/* 💬 FLOATING STOREFRONT CHATBOT WIDGET (Bottom Corner)             */}
          {/* =================================================================== */}
          <div className="fixed bottom-6 left-6 z-40">
            {!chatOpen && (
              <button
                onClick={() => setChatOpen(true)}
                className="flex items-center gap-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-4 py-3.5 rounded-full shadow-2xl shadow-purple-900/50 hover:scale-105 transition-all"
              >
                <div className="relative">
                  <Bot size={22} />
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-purple-900"></span>
                </div>
                <span className="text-xs font-bold">پشتیبانی و رهگیری سفارش</span>
              </button>
            )}

            {chatOpen && (
              <div className="w-[360px] sm:w-[400px] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[520px] animate-fadeIn">
                
                {/* Chat Header */}
                <div className="bg-gradient-to-r from-purple-700 to-indigo-700 p-4 text-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                      <Bot size={20} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold">دستیار فروشگاهی و رهگیری ووکامرس</h4>
                      <p className="text-[10px] text-purple-200">احراز هویت پیامکی و پیگیری مرسوله</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setChatOpen(false)}
                    className="p-1 rounded-lg hover:bg-white/20 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Chat Body */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-950/60">
                  
                  {/* Assistant greeting */}
                  <div className="flex flex-col items-start">
                    <div className="bg-slate-800 p-3 rounded-2xl rounded-bl-none text-xs text-slate-200 leading-relaxed max-w-[90%]">
                      سلام! 👋 برای رهگیری سفارشات، استعلام موجودی یا پیگیری پستی در خدمت شما هستم.
                    </div>
                  </div>

                  {/* Simulated user inquiry */}
                  <div className="flex flex-col items-end">
                    <div className="bg-purple-600 text-white p-3 rounded-2xl rounded-br-none text-xs max-w-[85%]">
                      سفارش قبلی من کجاست؟ الان در چه وضعیتی قرار دارد؟
                    </div>
                  </div>

                  {/* Stage 1: Phone + OTP Form directly inside chat bubble */}
                  {chatStage !== 'verified_order' && (
                    <div className="bg-slate-900 border border-purple-800/40 rounded-2xl p-4 space-y-3 text-xs">
                      <div className="text-purple-300 font-semibold flex items-center gap-1.5">
                        <ShieldCheck size={16} />
                        <span>احراز هویت سریع جهت نمایش وضعیت سفارش</span>
                      </div>
                      <p className="text-slate-400 text-[11px]">
                        برای حفظ حریم خصوصی، لطفاً شماره موبایل ثبت شده در سفارش را تایید کنید:
                      </p>

                      <div>
                        <input
                          type="tel"
                          dir="ltr"
                          value={chatPhone}
                          onChange={e => setChatPhone(e.target.value)}
                          placeholder="0912xxxxxxx"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white text-center font-mono"
                        />
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          dir="ltr"
                          maxLength={4}
                          value={chatOtp}
                          onChange={e => setChatOtp(e.target.value)}
                          placeholder="کد تایید ۴ رقمی..."
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white text-center font-mono tracking-widest"
                        />
                        <button
                          onClick={handleVerifyChatOtp}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-xs font-bold"
                        >
                          تایید کد
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span>ارسال کد به خط شما</span>
                        <span className="text-amber-400 font-mono">کد نمونه تستی: 4421</span>
                      </div>
                    </div>
                  )}

                  {/* Typing State */}
                  {chatTyping && (
                    <div className="flex items-center gap-1.5 bg-slate-800/80 px-3.5 py-2.5 rounded-2xl rounded-bl-none w-20">
                      <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-dot-1"></span>
                      <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-dot-2"></span>
                      <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-dot-3"></span>
                    </div>
                  )}

                  {/* Stage 2: Verified Order + Persian WC Tracking Graphical Card */}
                  {chatStage === 'verified_order' && (
                    <div className="space-y-3 animate-fadeIn">
                      
                      {/* Tracking Card */}
                      <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-4 text-xs space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <span className="font-bold text-white flex items-center gap-1.5">
                            <Truck className="text-emerald-400" size={16} />
                            سفارش #۱۰۴۲ (ووکامرس فارسی)
                          </span>
                          <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded font-bold">
                            تحویل به پستچی منطقه ۴
                          </span>
                        </div>

                        <div className="space-y-1.5 text-[11px]">
                          <div className="flex justify-between text-slate-300">
                            <span>کد رهگیری ۲۴ رقمی پست پیشتاز:</span>
                            <span className="font-mono text-purple-300" dir="ltr">284910293849102948291048</span>
                          </div>
                          <div className="flex justify-between text-slate-400">
                            <span>زمان تحویل تخمینی:</span>
                            <span>فردا قبل از ظهر</span>
                          </div>
                        </div>

                        {/* 4-Step Progress Bar */}
                        <div className="pt-2">
                          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                            <span className="text-emerald-400 font-bold">ثبت سفارش</span>
                            <span className="text-emerald-400 font-bold">انبارداری</span>
                            <span className="text-emerald-400 font-bold">تحویل پست</span>
                            <span className="text-slate-500">تحویل نهایی</span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-emerald-500 h-full w-[75%] rounded-full"></div>
                          </div>
                        </div>
                      </div>

                      {/* In-Chat Product Recommendation Card (Cross-Sell) */}
                      <div className="bg-slate-900 border border-purple-800/40 rounded-2xl p-3.5 text-xs space-y-2">
                        <div className="flex items-center gap-2">
                          <Tag className="text-purple-400" size={14} />
                          <span className="font-bold text-white text-[11px]">پیشنهاد مکمل اختصاصی هدفون سونی شما:</span>
                        </div>
                        <div className="flex items-center gap-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                          <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-purple-400 font-bold text-xs">
                            SONY
                          </div>
                          <div className="flex-1">
                            <div className="text-[11px] font-bold text-white">کیف مسافرتی ضدضربه سونی Pro</div>
                            <div className="text-[10px] text-emerald-400 font-mono mt-0.5">۳۸۰,۰۰۰ تومان</div>
                          </div>
                          <button
                            onClick={() => {
                              setCartCount(prev => prev + 1);
                              showToast('کیف مسافرتی به سبد خرید افزوده شد.');
                            }}
                            className="bg-purple-600 hover:bg-purple-700 text-white text-[10px] px-2.5 py-1.5 rounded-lg font-bold"
                          >
                            + خرید سریع
                          </button>
                        </div>
                      </div>

                    </div>
                  )}

                </div>

                {/* Chat Footer */}
                <div className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2">
                  <input
                    type="text"
                    placeholder="پیام یا سوال خود را بنویسید..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-600"
                  />
                  <button className="bg-purple-600 text-white p-2 rounded-xl hover:bg-purple-700 transition-colors">
                    <Send size={15} className="rotate-180" />
                  </button>
                </div>

              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* DRAWER MODAL: 360° CUSTOMER PROFILE (From CRM Tab)                       */}
      {/* ========================================================================= */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-xs">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Users className="text-purple-400" size={18} />
                  پرونده ۳۶۰ درجه مشتری: {selectedCustomer.name}
                </h3>
                <span className="text-[11px] text-slate-400 font-mono" dir="ltr">{selectedCustomer.phone}</span>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* AI Summary Box */}
            <div className="bg-purple-950/30 border border-purple-800/40 rounded-2xl p-4 space-y-2">
              <span className="text-purple-300 font-bold flex items-center gap-1.5 text-xs">
                <Sparkles size={14} />
                خلاصه تحلیلی ۳۶۰ درجه هوش مصنوعی (AI Contact Summary):
              </span>
              <p className="text-slate-300 leading-relaxed text-xs">
                {selectedCustomer.summary}
              </p>
            </div>

            {/* Auto Tags */}
            <div>
              <span className="text-slate-400 font-semibold block mb-2">برچسب‌های رفتار خرید (Auto-Tags):</span>
              <div className="flex flex-wrap gap-1.5">
                {selectedCustomer.tags.map((t: string, idx: number) => (
                  <span key={idx} className="bg-slate-800 text-slate-200 text-xs px-2.5 py-1 rounded-lg border border-slate-700">
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            {/* Recommended SMS Trigger */}
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-slate-300 font-bold">متن پیشنهادی پیامک بازگردانی (تولیدشده با AI):</span>
              <p className="text-slate-400 font-mono text-[11px] leading-relaxed">
                {selectedCustomer.recommendedSms}
              </p>
              <button
                onClick={() => {
                  showToast(`پیامک اختصاصی با موفقیت به شماره ${selectedCustomer.phone} ارسال شد.`);
                  setSelectedCustomer(null);
                }}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
              >
                <Send size={13} className="rotate-180" />
                <span>ارسال آنی این پیامک برای مشتری 🚀</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PAYLOAD JSON VIEWER                                                */}
      {/* ========================================================================= */}
      {selectedPayload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <FileCode className="text-purple-400" size={16} />
                محتوای Payload ارسالی به n8n (#{selectedPayload.id})
              </span>
              <button
                onClick={() => setSelectedPayload(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-purple-300 font-mono text-[11px] overflow-x-auto text-left leading-relaxed" dir="ltr">
              {JSON.stringify(selectedPayload.payload, null, 2)}
            </pre>

            <button
              onClick={() => setSelectedPayload(null)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-xl text-xs font-bold transition-colors"
            >
              بستن
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT DISCOUNT VALUE (Human-in-the-Loop)                             */}
      {/* ========================================================================= */}
      {editingApproval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-xs">
            <h4 className="text-sm font-bold text-white">ویرایش درصد تخفیف پیشنهادی</h4>
            <p className="text-slate-400">
              میزان درصد تخفیف دلخواه برای کاربر {editingApproval.user} را تعیین کنید:
            </p>

            <div className="flex items-center justify-between">
              <span className="text-slate-300">درصد تخفیف:</span>
              <span className="text-lg font-black text-amber-400 font-mono">{editDiscountVal}٪</span>
            </div>

            <input
              type="range"
              min={5}
              max={35}
              value={editDiscountVal}
              onChange={e => setEditDiscountVal(Number(e.target.value))}
              className="w-full accent-amber-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSaveEditDiscount}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-xl text-xs font-bold transition-colors"
              >
                اعمال تغییر
              </button>
              <button
                onClick={() => setEditingApproval(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs font-bold transition-colors"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
