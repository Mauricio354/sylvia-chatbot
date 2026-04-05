/**
 * MR Web Solutions — Real Estate AI Chatbot Widget
 *
 * Embed on any website with:
 *   <script>window.CHATBOT_CONFIG = { ... };</script>
 *   <script src="https://realestate-chatbot-demo.vercel.app/widget.js"></script>
 */
(function () {
  'use strict';

  /* ── Auto-detect API base URL from this script's origin ── */
  var scriptEl = document.currentScript;
  var API_BASE = '';
  if (scriptEl && scriptEl.src) {
    try { API_BASE = new URL(scriptEl.src).origin; } catch (e) {}
  }

  /* ── Load Cal.com embed script ───────────────────── */
  (function (W, A, L) {
    var p = function (a, ar) { a.q.push(ar); };
    var d = W.document;
    W.Cal = W.Cal || function () {
      var cal = W.Cal;
      var ar = arguments;
      if (!cal.loaded) {
        cal.ns = {}; cal.q = cal.q || [];
        var s = d.createElement('script'); s.src = A; d.head.appendChild(s);
        cal.loaded = true;
      }
      if (ar[0] === L) {
        var api = function () { p(api, arguments); };
        var ns = ar[1]; api.q = api.q || [];
        if (typeof ns === 'string') { cal.ns[ns] = cal.ns[ns] || api; p(cal.ns[ns], ar); p(cal, ['initNamespace', ns]); }
        else p(cal, ar);
        return;
      }
      p(cal, ar);
    };
  })(window, 'https://app.cal.com/embed/embed.js', 'init');
  Cal('init', { origin: 'https://cal.com' });

  /* ── Read config ─────────────────────────────────── */
  var C = window.CHATBOT_CONFIG || {};
  var agent = C.agent || {};
  var brand = C.branding || {};
  var questions = C.questions || {};
  var questions_es = C.questions_es || {};
  var calendar = C.calendar || {};
  var sms = C.sms || {};
  var leadCapture = C.leadCapture || {};
  var PRIMARY = brand.primaryColor || '#1a3a5c';
  var ACCENT = brand.accentColor || '#e8a87c';
  // Allow config to override the API base URL
  if (C.apiUrl) API_BASE = C.apiUrl;

  /* ── Translations ────────────────────────────────── */
  var T = {
    en: {
      wantBuy: '\ud83c\udfe0 I want to buy',
      wantSell: '\ud83d\udcb0 I want to sell',
      askQuestion: 'Ask a question...',
      selectUpTo2: 'Select up to 2 options',
      continueBtn: 'Continue \u2192',
      typeOwn: 'Or type your own...',
      bookConsultation: 'Continue to Book a Consultation',
      bookYourConsultation: 'Book Your Consultation',
      bookedMsg: "I've booked my consultation!",
      yourName: 'Your name',
      phoneNumber: 'Phone number',
      emailAddress: 'Email address',
      namePlaceholder: 'John Smith',
      phonePlaceholder: '(403) 555-1234',
      emailPlaceholder: 'john@example.com',
      consultSummary: 'Consultation Summary',
      client: 'Client',
      type: 'Type',
      phone: 'Phone',
      email: 'Email',
      newChat: 'New Chat',
      refresh: 'Refresh',
      exit: 'Exit',
      errorConnect: "I'm having trouble connecting right now. Please try again in a moment.",
      errorGeneric: "I'm sorry, something went wrong. Please try again.",
      buyerType: 'buying',
      sellerType: 'selling',
      propertySearch: 'property search',
      listingConsult: 'listing consultation',
      buyerLabel: 'Buyer',
      sellerLabel: 'Seller'
    },
    es: {
      wantBuy: '\ud83c\udfe0 Quiero comprar',
      wantSell: '\ud83d\udcb0 Quiero vender',
      askQuestion: 'Haz una pregunta...',
      selectUpTo2: 'Selecciona hasta 2 opciones',
      continueBtn: 'Continuar \u2192',
      typeOwn: 'O escribe la tuya...',
      bookConsultation: 'Continuar para reservar una consulta',
      bookYourConsultation: 'Reserva tu consulta',
      bookedMsg: '\u00a1He reservado mi consulta!',
      yourName: 'Tu nombre',
      phoneNumber: 'N\u00famero de tel\u00e9fono',
      emailAddress: 'Correo electr\u00f3nico',
      namePlaceholder: 'Juan P\u00e9rez',
      phonePlaceholder: '(403) 555-1234',
      emailPlaceholder: 'juan@ejemplo.com',
      consultSummary: 'Resumen de la consulta',
      client: 'Cliente',
      type: 'Tipo',
      phone: 'Tel\u00e9fono',
      email: 'Correo',
      newChat: 'Nuevo Chat',
      refresh: 'Actualizar',
      exit: 'Salir',
      errorConnect: 'Estoy teniendo problemas para conectarme. Por favor, int\u00e9ntalo de nuevo en un momento.',
      errorGeneric: 'Lo siento, algo sali\u00f3 mal. Por favor, int\u00e9ntalo de nuevo.',
      buyerType: 'compra',
      sellerType: 'venta',
      propertySearch: 'b\u00fasqueda de propiedad',
      listingConsult: 'consulta de venta',
      buyerLabel: 'Comprador',
      sellerLabel: 'Vendedor'
    }
  };

  function t(key) { return T[state.lang][key] || T.en[key] || key; }

  /* ── Guided-flow message builders (by language) ─── */
  var MSG = {
    en: {
      buyerIntro: function (n) { return "Great! I'd love to help you find the perfect property. Let me ask a few quick questions so " + n + " can prepare the best options for you."; },
      sellerIntro: function (n) { return "Wonderful! Let's get some details so " + n + " can give you an accurate market assessment."; },
      contactInfo: function (n) { return "Thanks for those details! To connect you with " + n + ", I'll just need your contact info."; },
      bookingMsg: function (lead, agnt, typ) { return "Perfect, " + lead + "! Based on your " + typ + " needs, I'd recommend booking a consultation with " + agnt + ". Pick a time that works for you:"; },
      bookingDone: function (lead, agnt, typ) { return "You're all set, " + lead + "! " + agnt + " is looking forward to helping with your " + typ + ". You'll receive a confirmation shortly. Feel free to ask me anything else!"; },
      emailFallback: function (em) { return 'Please email ' + em + ' to schedule your consultation.'; }
    },
    es: {
      buyerIntro: function (n) { return "\u00a1Genial! Me encantar\u00eda ayudarte a encontrar la propiedad perfecta. D\u00e9jame hacerte unas preguntas r\u00e1pidas para que " + n + " pueda preparar las mejores opciones para ti."; },
      sellerIntro: function (n) { return "\u00a1Maravilloso! Vamos a obtener algunos detalles para que " + n + " pueda darte una evaluaci\u00f3n precisa del mercado."; },
      contactInfo: function (n) { return "\u00a1Gracias por esos detalles! Para conectarte con " + n + ", solo necesitar\u00e9 tu informaci\u00f3n de contacto."; },
      bookingMsg: function (lead, agnt, typ) { return "\u00a1Perfecto, " + lead + "! Basado en tus necesidades de " + typ + ", te recomiendo reservar una consulta con " + agnt + ". Elige un horario que te convenga:"; },
      bookingDone: function (lead, agnt, typ) { return "\u00a1Listo, " + lead + "! " + agnt + " espera con gusto ayudarte con tu " + typ + ". Recibir\u00e1s una confirmaci\u00f3n pronto. \u00a1No dudes en preguntarme cualquier otra cosa!"; },
      emailFallback: function (em) { return 'Por favor env\u00eda un correo a ' + em + ' para programar tu consulta.'; }
    }
  };

  function m(key) { return MSG[state.lang][key] || MSG.en[key]; }

  function getQuestions() {
    return state.lang === 'es' && questions_es[state.userType]
      ? questions_es
      : questions;
  }

  var state = {
    open: false,
    lang: 'en',
    mode: 'chat',
    userType: '',
    answers: {},
    questionIndex: 0,
    lead: { name: '', phone: '', email: '' },
    messages: [],
    chatHistory: [],
    awaitingAI: false
  };

  /* ── CSS ─────────────────────────────────────────── */
  var style = document.createElement('style');
  style.textContent =
    '#re-chatbot-toggle{position:fixed;bottom:24px;right:24px;width:64px;height:64px;border-radius:50%;background:' + PRIMARY + ';color:#fff;border:none;cursor:pointer;box-shadow:0 4px 20px rgba(0,0,0,.2);z-index:99999;display:flex;align-items:center;justify-content:center;transition:transform .2s ease,box-shadow .2s ease;-webkit-tap-highlight-color:transparent}' +
    '#re-chatbot-toggle:hover{transform:scale(1.08);box-shadow:0 6px 28px rgba(0,0,0,.25)}' +
    '#re-chatbot-toggle svg{width:28px;height:28px}' +
    '#re-chatbot-window{position:fixed;bottom:100px;right:24px;width:400px;max-height:600px;border-radius:16px;overflow:hidden;box-shadow:0 12px 48px rgba(0,0,0,.15);z-index:99999;display:none;flex-direction:column;background:#fff;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;animation:re-chat-slide-up .3s ease}' +
    '#re-chatbot-window.re-open{display:flex}' +
    '@keyframes re-chat-slide-up{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}' +
    '.re-chat-header{background:' + PRIMARY + ';color:#fff;padding:16px 18px;display:flex;align-items:center;gap:12px;flex-shrink:0}' +
    '.re-chat-avatar{width:42px;height:42px;border-radius:50%;background:' + ACCENT + ';display:flex;align-items:center;justify-content:center;font-weight:700;font-size:16px;color:' + PRIMARY + ';flex-shrink:0;overflow:hidden}' +
    '.re-chat-avatar img{width:100%;height:100%;object-fit:cover}' +
    '.re-chat-header-info h3{font-size:14px;font-weight:700;margin:0}' +
    '.re-chat-header-info p{font-size:11px;opacity:.7;margin:0}' +
    '.re-chat-close{background:none;border:none;color:#fff;font-size:20px;cursor:pointer;padding:4px 8px;opacity:.7;transition:opacity .2s}' +
    '.re-chat-close:hover{opacity:1}' +
    '.re-chat-body{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;padding:16px;display:flex;flex-direction:column;gap:8px;min-height:300px;max-height:420px;scroll-behavior:smooth}' +
    '.re-msg{max-width:85%;padding:10px 14px;border-radius:14px;font-size:13.5px;line-height:1.5;animation:re-msg-in .25s ease;word-wrap:break-word}' +
    '@keyframes re-msg-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}' +
    '.re-msg-bot{background:#f0f2f5;color:#1a1a1a;align-self:flex-start;border-bottom-left-radius:4px}' +
    '.re-msg-user{background:' + PRIMARY + ';color:#fff;align-self:flex-end;border-bottom-right-radius:4px}' +
    '.re-msg-typing{background:#f0f2f5;align-self:flex-start;border-bottom-left-radius:4px;padding:12px 18px}' +
    '.re-msg-typing span{display:inline-block;width:7px;height:7px;border-radius:50%;background:#999;margin:0 2px;animation:re-bounce .6s infinite}' +
    '.re-msg-typing span:nth-child(2){animation-delay:.15s}' +
    '.re-msg-typing span:nth-child(3){animation-delay:.3s}' +
    '@keyframes re-bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}' +
    '.re-options{display:flex;flex-wrap:wrap;gap:6px;padding:4px 0;align-self:flex-start;max-width:90%}' +
    '.re-option-btn{background:#fff;color:' + PRIMARY + ';border:1.5px solid ' + PRIMARY + ';border-radius:20px;padding:7px 14px;font-size:12.5px;font-weight:500;cursor:pointer;transition:all .15s ease;font-family:inherit;-webkit-tap-highlight-color:transparent}' +
    '.re-option-btn:hover{background:' + PRIMARY + ';color:#fff}' +
    '.re-option-btn:active{transform:scale(.96)}' +
    '.re-option-btn.re-selected{background:' + PRIMARY + ';color:#fff}' +
    '.re-multi-hint{font-size:11px;color:#999;align-self:flex-start;padding:0 0 2px 2px}' +
    '.re-multi-confirm{background:' + PRIMARY + ';color:#fff;border:none;border-radius:20px;padding:8px 20px;font-size:12.5px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s ease;align-self:flex-start;margin-top:2px}' +
    '.re-multi-confirm:disabled{opacity:.35;cursor:default}' +
    '.re-multi-confirm:not(:disabled):hover{filter:brightness(1.1);transform:translateY(-1px)}' +
    '.re-custom-input{display:flex;gap:6px;align-self:flex-start;max-width:90%;padding:4px 0}' +
    '.re-custom-input input{flex:1;padding:8px 12px;border:1.5px solid #ddd;border-radius:20px;font-size:12.5px;font-family:inherit;outline:none;transition:border-color .2s}' +
    '.re-custom-input input:focus{border-color:' + PRIMARY + '}' +
    '.re-custom-input button{background:' + PRIMARY + ';color:#fff;border:none;border-radius:50%;width:34px;height:34px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0}' +
    '.re-form{display:flex;flex-direction:column;gap:10px;padding:8px 0;align-self:stretch}' +
    '.re-form label{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:#888;margin-bottom:-4px}' +
    '.re-form input{padding:10px 12px;border:1.5px solid #ddd;border-radius:10px;font-size:13px;font-family:inherit;outline:none;transition:border-color .2s}' +
    '.re-form input:focus{border-color:' + PRIMARY + '}' +
    '.re-form-submit{background:' + PRIMARY + ';color:#fff;border:none;border-radius:24px;padding:11px;font-size:13.5px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .2s}' +
    '.re-form-submit:hover{filter:brightness(1.1);transform:translateY(-1px)}' +
    '.re-calendar-embed{width:100%;min-height:200px;display:flex;flex-direction:column;gap:8px;padding:4px 0}' +
    '.re-calendar-btn{display:flex;align-items:center;justify-content:center;gap:8px;background:' + PRIMARY + ';color:#fff;border:none;border-radius:24px;padding:12px;font-size:13.5px;font-weight:600;cursor:pointer;font-family:inherit;text-decoration:none;transition:all .2s}' +
    '.re-calendar-btn:hover{filter:brightness(1.1);transform:translateY(-1px)}' +
    '.re-calendar-btn svg{width:18px;height:18px}' +
    '.re-quick-bar{display:flex;gap:6px;padding:8px 14px;border-top:1px solid #f0f0f0;flex-shrink:0;background:#fafafa}' +
    '.re-quick-bar button{flex:1;background:#fff;color:' + PRIMARY + ';border:1.5px solid ' + PRIMARY + ';border-radius:20px;padding:8px 10px;font-size:12.5px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s ease}' +
    '.re-quick-bar button:hover{background:' + PRIMARY + ';color:#fff}' +
    '.re-quick-bar.re-hidden{display:none}' +
    '.re-header-actions{margin-left:auto;display:flex;gap:4px;align-items:center}' +
    /* ── Language toggle buttons ── */
    '.re-lang-btn{background:rgba(255,255,255,.15);border:none;color:rgba(255,255,255,.85);border-radius:6px;padding:4px 8px;font-size:11px;font-weight:700;cursor:pointer;transition:all .15s;font-family:inherit}' +
    '.re-lang-btn.re-active{background:#fff;color:' + PRIMARY + '}' +
    '.re-lang-btn:hover{background:rgba(255,255,255,.3)}' +
    '.re-lang-btn.re-active:hover{background:#fff}' +
    /* ── Ellipsis menu ── */
    '.re-menu-wrap{position:relative}' +
    '.re-menu-toggle{background:none;border:none;color:#fff;cursor:pointer;padding:4px 6px;opacity:.7;transition:opacity .2s;display:flex;align-items:center;justify-content:center;font-size:18px;line-height:1;letter-spacing:1px}' +
    '.re-menu-toggle:hover{opacity:1}' +
    '.re-menu-dropdown{display:none;position:absolute;top:100%;right:0;margin-top:6px;background:#fff;border-radius:10px;box-shadow:0 6px 24px rgba(0,0,0,.15);min-width:150px;z-index:10;overflow:hidden;animation:re-menu-fade .15s ease}' +
    '.re-menu-dropdown.re-menu-open{display:block}' +
    '@keyframes re-menu-fade{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}' +
    '.re-menu-item{display:flex;align-items:center;gap:8px;width:100%;padding:10px 14px;background:none;border:none;font-size:13px;font-family:inherit;color:#333;cursor:pointer;transition:background .12s}' +
    '.re-menu-item:hover{background:#f5f5f5}' +
    '.re-menu-item svg{width:15px;height:15px;opacity:.6}' +
    '.re-menu-sep{height:1px;background:#eee;margin:0}' +
    /* ── Existing continued ── */
    '.re-input-bar{display:flex;gap:6px;padding:10px 14px;border-top:1px solid #f0f0f0;flex-shrink:0;background:#fff}' +
    '.re-input-bar input{flex:1;padding:9px 14px;border:1.5px solid #e0e0e0;border-radius:22px;font-size:16px;font-family:inherit;outline:none;transition:border-color .2s}' +
    '.re-input-bar input:focus{border-color:' + PRIMARY + '}' +
    '.re-input-bar button{background:' + PRIMARY + ';color:#fff;border:none;border-radius:50%;width:36px;height:36px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .15s}' +
    '.re-input-bar button:hover{filter:brightness(1.1)}' +
    '.re-input-bar button:disabled{opacity:.4;cursor:default}' +
    '.re-powered{text-align:center;padding:6px;font-size:10px;color:#bbb;flex-shrink:0}' +
    '@media(max-width:500px){' +
      '#re-chatbot-window.re-open{top:10px;left:10px;right:10px;bottom:80px;width:auto;max-height:none;border-radius:16px;animation:none}' +
      '#re-chatbot-window .re-chat-body{max-height:none;flex:1;min-height:0}' +
      '#re-chatbot-toggle{bottom:16px;right:16px;width:56px;height:56px}' +
    '}';
  document.head.appendChild(style);

  /* ── Toggle button ───────────────────────────────── */
  var toggle = document.createElement('button');
  toggle.id = 're-chatbot-toggle';
  toggle.setAttribute('aria-label', 'Open chat');
  toggle.innerHTML = getToggleIcon();
  document.body.appendChild(toggle);

  /* ── Chat window ─────────────────────────────────── */
  var win = document.createElement('div');
  win.id = 're-chatbot-window';
  var initials = (agent.firstName || 'A').charAt(0);
  var avatarContent = agent.photo
    ? '<img src="' + agent.photo + '" alt="' + agent.firstName + '">'
    : initials;

  win.innerHTML =
    '<div class="re-chat-header">' +
      '<div class="re-chat-avatar">' + avatarContent + '</div>' +
      '<div class="re-chat-header-info">' +
        '<h3>' + (brand.chatTitle || 'Chat with us') + '</h3>' +
        '<p>' + (agent.firstName || 'Agent') + (agent.title ? ' \u2014 ' + agent.title : '') + '</p>' +
      '</div>' +
      '<div class="re-header-actions">' +
        '<button class="re-lang-btn re-active" id="re-lang-en" aria-label="English">EN</button>' +
        '<button class="re-lang-btn" id="re-lang-es" aria-label="Espa\u00f1ol">ES</button>' +
        '<div class="re-menu-wrap">' +
          '<button class="re-menu-toggle" id="re-menu-toggle" aria-label="Menu">\u22ee</button>' +
          '<div class="re-menu-dropdown" id="re-menu-dropdown">' +
            '<button class="re-menu-item" id="re-menu-new">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>' +
              '<span>' + T.en.newChat + '</span>' +
            '</button>' +
            '<div class="re-menu-sep"></div>' +
            '<button class="re-menu-item" id="re-menu-refresh">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0115-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 01-15 6.7L3 16"/></svg>' +
              '<span>' + T.en.refresh + '</span>' +
            '</button>' +
            '<div class="re-menu-sep"></div>' +
            '<button class="re-menu-item" id="re-menu-exit">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>' +
              '<span>' + T.en.exit + '</span>' +
            '</button>' +
          '</div>' +
        '</div>' +
        '<button class="re-chat-close" aria-label="Close chat">&times;</button>' +
      '</div>' +
    '</div>' +
    '<div class="re-chat-body" id="re-chat-body"></div>' +
    '<div class="re-quick-bar" id="re-quick-bar">' +
      '<button id="re-buy-btn">' + T.en.wantBuy + '</button>' +
      '<button id="re-sell-btn">' + T.en.wantSell + '</button>' +
    '</div>' +
    '<div class="re-input-bar" id="re-input-bar">' +
      '<input type="text" id="re-chat-input" placeholder="' + T.en.askQuestion + '" />' +
      '<button id="re-chat-send" aria-label="Send">' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>' +
      '</button>' +
    '</div>' +
    '<div class="re-powered">Powered by MR Web Solutions</div>';
  document.body.appendChild(win);

  var body = document.getElementById('re-chat-body');
  var chatInput = document.getElementById('re-chat-input');
  var chatSendBtn = document.getElementById('re-chat-send');
  var quickBar = document.getElementById('re-quick-bar');
  var buyBtn = document.getElementById('re-buy-btn');
  var sellBtn = document.getElementById('re-sell-btn');
  var langEnBtn = document.getElementById('re-lang-en');
  var langEsBtn = document.getElementById('re-lang-es');
  var menuToggleBtn = document.getElementById('re-menu-toggle');
  var menuDropdown = document.getElementById('re-menu-dropdown');
  var menuNewBtn = document.getElementById('re-menu-new');
  var menuRefreshBtn = document.getElementById('re-menu-refresh');
  var menuExitBtn = document.getElementById('re-menu-exit');

  function setQuickBarVisible(visible) {
    if (visible) { quickBar.classList.remove('re-hidden'); }
    else { quickBar.classList.add('re-hidden'); }
  }

  /** Update all translatable text in the static DOM */
  function applyLangUI() {
    buyBtn.textContent = t('wantBuy');
    sellBtn.textContent = t('wantSell');
    chatInput.placeholder = t('askQuestion');
    menuNewBtn.querySelector('span').textContent = t('newChat');
    menuRefreshBtn.querySelector('span').textContent = t('refresh');
    menuExitBtn.querySelector('span').textContent = t('exit');
    // Toggle active lang button
    langEnBtn.classList.toggle('re-active', state.lang === 'en');
    langEsBtn.classList.toggle('re-active', state.lang === 'es');
  }

  /* ── Mobile helpers ─────────────────────────────── */
  var isMobile = function () { return window.innerWidth <= 500; };

  function lockBodyScroll() {
    if (!isMobile()) return;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.top = '-' + window.scrollY + 'px';
  }

  function unlockBodyScroll() {
    if (document.body.style.position !== 'fixed') return;
    var scrollY = document.body.style.top;
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.top = '';
    window.scrollTo(0, parseInt(scrollY || '0') * -1);
  }

  /* ── Event listeners ─────────────────────────────── */
  function openChat() {
    state.open = true;
    win.classList.add('re-open');
    lockBodyScroll();
    if (state.messages.length === 0) startConversation();
  }

  function closeChat() {
    state.open = false;
    win.classList.remove('re-open');
    closeMenu();
    unlockBodyScroll();
  }

  toggle.addEventListener('click', function () {
    if (state.open) closeChat(); else openChat();
  });

  win.querySelector('.re-chat-close').addEventListener('click', closeChat);

  buyBtn.addEventListener('click', function () { handleTypeSelection('buyer'); });
  sellBtn.addEventListener('click', function () { handleTypeSelection('seller'); });

  /* ── Language toggle ─────────────────────────────── */
  function switchLang(newLang) {
    if (newLang === state.lang) return;
    state.lang = newLang;
    resetChat();
  }

  langEnBtn.addEventListener('click', function () { switchLang('en'); });
  langEsBtn.addEventListener('click', function () { switchLang('es'); });

  /* ── Ellipsis menu ───────────────────────────────── */
  function closeMenu() { menuDropdown.classList.remove('re-menu-open'); }
  function toggleMenu() { menuDropdown.classList.toggle('re-menu-open'); }

  menuToggleBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    toggleMenu();
  });

  menuNewBtn.addEventListener('click', function () {
    closeMenu();
    resetChat();
  });

  menuRefreshBtn.addEventListener('click', function () {
    closeMenu();
    resetChat();
  });

  menuExitBtn.addEventListener('click', function () {
    closeMenu();
    closeChat();
  });

  // Close menu when clicking outside
  document.addEventListener('click', function (e) {
    if (!menuDropdown.contains(e.target) && e.target !== menuToggleBtn) {
      closeMenu();
    }
  });

  function handleSend() {
    var text = chatInput.value.trim();
    if (!text || state.awaitingAI) return;
    chatInput.value = '';
    addUserMessage(text);
    sendToAI(text);
  }

  chatSendBtn.addEventListener('click', handleSend);
  chatInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') handleSend();
  });

  /* ── Conversation flow ───────────────────────────── */
  function startConversation() {
    state.mode = 'chat';
    setQuickBarVisible(true);
    var welcomeKey = state.lang === 'es' ? 'welcomeMessage_es' : 'welcomeMessage';
    var welcomeText = brand[welcomeKey] || brand.welcomeMessage || "Hi! How can I help you today?";
    showBotMessage(welcomeText);
  }

  function handleTypeSelection(value) {
    var labels = { buyer: t('wantBuy'), seller: t('wantSell') };
    addUserMessage(labels[value] || value);
    state.userType = value;
    state.questionIndex = 0;
    state.answers = { type: value };
    state.mode = 'guided';
    setQuickBarVisible(false);

    var agentName = agent.firstName || 'the agent';
    var introFn = value === 'buyer' ? m('buyerIntro') : m('sellerIntro');
    setTimeout(function () {
      showBotMessage(introFn(agentName), function () {
        setTimeout(function () { askNextQuestion(); }, 400);
      });
    }, 500);
  }

  function askNextQuestion() {
    var qs = getQuestions()[state.userType] || [];
    if (state.questionIndex >= qs.length) {
      setTimeout(function () {
        showBotMessage(
          m('contactInfo')(agent.firstName || 'our agent'),
          function () { setTimeout(function () { showLeadForm(); }, 500); }
        );
      }, 400);
      return;
    }
    var q = qs[state.questionIndex];
    showBotMessage(q.text, function () {
      addOptions(
        q.options.map(function (o) { return { label: o, value: o }; }),
        function (val) { handleQuestionAnswer(q.id, val); },
        q.allowCustom,
        q.multiSelect
      );
    });
  }

  function handleQuestionAnswer(id, value) {
    addUserMessage(value);
    state.answers[id] = value;
    state.questionIndex++;
    setTimeout(function () { askNextQuestion(); }, 400);
  }

  /* ── Lead capture form ───────────────────────────── */
  function showLeadForm() {
    var form = document.createElement('div');
    form.className = 're-form';
    var fields = leadCapture.fields || ['name', 'phone', 'email'];
    var fl = { name: t('yourName'), phone: t('phoneNumber'), email: t('emailAddress') };
    var ft = { name: 'text', phone: 'tel', email: 'email' };
    var fp = { name: t('namePlaceholder'), phone: t('phonePlaceholder'), email: t('emailPlaceholder') };

    fields.forEach(function (f) {
      var label = document.createElement('label');
      label.textContent = fl[f] || f;
      form.appendChild(label);
      var input = document.createElement('input');
      input.type = ft[f] || 'text';
      input.placeholder = fp[f] || '';
      input.id = 're-field-' + f;
      input.required = true;
      form.appendChild(input);
    });

    var btn = document.createElement('button');
    btn.className = 're-form-submit';
    btn.textContent = t('bookConsultation');
    btn.addEventListener('click', function () {
      var valid = true;
      fields.forEach(function (f) {
        var input = document.getElementById('re-field-' + f);
        if (!input.value.trim()) {
          valid = false;
          input.style.borderColor = '#e74c3c';
        } else {
          input.style.borderColor = '#ddd';
          state.lead[f] = input.value.trim();
        }
      });
      if (!valid) return;
      form.remove();
      addUserMessage(state.lead.name + ' | ' + state.lead.phone + ' | ' + state.lead.email);
      setTimeout(function () {
        var tl = { buyer: t('buyerType'), seller: t('sellerType') };
        showBotMessage(
          m('bookingMsg')(state.lead.name.split(' ')[0], agent.firstName || 'our agent', tl[state.userType] || ''),
          function () { setTimeout(function () { showCalendarBooking(); }, 300); }
        );
      }, 400);
    });
    form.appendChild(btn);
    body.appendChild(form);
    scrollToBottom();
  }

  /* ── Calendar booking ────────────────────────────── */
  var bookingListenerSet = false;

  function showCalendarBooking() {
    var container = document.createElement('div');
    container.className = 're-calendar-embed';
    container.id = 're-booking-container';

    var calcomUrl = calendar.calcomUrl || '';
    var calLink = calcomUrl.replace(/^https?:\/\/cal\.com\//, '');

    if (calLink) {
      var btn = document.createElement('button');
      btn.className = 're-calendar-btn';
      btn.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>' +
          '<line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>' +
          '<line x1="3" y1="10" x2="21" y2="10"/>' +
        '</svg> ' + t('bookYourConsultation');
      btn.addEventListener('click', function () {
        Cal('modal', {
          calLink: calLink,
          config: {
            name: state.lead.name || '',
            email: state.lead.email || '',
            layout: 'month_view'
          }
        });
      });
      container.appendChild(btn);

      if (!bookingListenerSet) {
        bookingListenerSet = true;
        Cal('on', {
          action: 'bookingSuccessful',
          callback: function () {
            var el = document.getElementById('re-booking-container');
            if (el) el.remove();
            handleBookingComplete();
          }
        });
      }
    } else {
      var msg = document.createElement('div');
      msg.className = 're-msg re-msg-bot';
      msg.textContent = m('emailFallback')(agent.email || 'us');
      container.appendChild(msg);
    }

    body.appendChild(container);
    scrollToBottom();
  }

  /* ── Booking complete ────────────────────────────── */
  function handleBookingComplete() {
    addUserMessage(t('bookedMsg'));
    state.mode = 'chat';
    setQuickBarVisible(true);
    if (sms.enabled && sms.backendUrl) sendSmsNotifications();
    setTimeout(function () {
      var tl = { buyer: t('propertySearch'), seller: t('listingConsult') };
      showBotMessage(
        m('bookingDone')(state.lead.name.split(' ')[0], agent.firstName || 'Our agent', tl[state.userType] || ''),
        function () {
          setTimeout(function () {
            var summary = document.createElement('div');
            summary.className = 're-msg re-msg-bot';
            summary.style.background = '#f8f9fa';
            summary.style.border = '1px solid #e8e8e8';
            summary.style.fontSize = '12px';
            summary.innerHTML =
              '<strong>' + t('consultSummary') + '</strong><br>' +
              t('client') + ': ' + state.lead.name + '<br>' +
              t('type') + ': ' + (state.userType === 'buyer' ? t('buyerLabel') : t('sellerLabel')) + '<br>' +
              Object.keys(state.answers).filter(function (k) { return k !== 'type'; }).map(function (k) {
                return k.replace(/_/g, ' ').replace(/\b\w/g, function (l) { return l.toUpperCase(); }) + ': ' + state.answers[k];
              }).join('<br>') +
              '<br>' + t('phone') + ': ' + state.lead.phone +
              '<br>' + t('email') + ': ' + state.lead.email;
            body.appendChild(summary);
            scrollToBottom();
          }, 600);
        }
      );
    }, 500);
  }

  /* ── AI Chat ─────────────────────────────────────── */
  function sendToAI(userText) {
    state.awaitingAI = true;
    chatSendBtn.disabled = true;
    state.chatHistory.push({ role: 'user', content: userText });

    var typing = document.createElement('div');
    typing.className = 're-msg re-msg-typing';
    typing.id = 're-ai-typing';
    typing.innerHTML = '<span></span><span></span><span></span>';
    body.appendChild(typing);
    scrollToBottom();

    var ctx = {};
    if (state.userType) ctx.userType = state.userType;
    if (state.lead.name) ctx.leadName = state.lead.name;
    if (state.mode === 'chat' && state.lead.name && Object.keys(state.answers).length > 1) {
      ctx.bookingComplete = true;
      ctx.answersText = Object.keys(state.answers).filter(function (k) { return k !== 'type'; })
        .map(function (k) { return k.replace(/_/g, ' ') + ': ' + state.answers[k]; }).join(', ');
    }

    fetch(API_BASE + '/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: state.chatHistory, context: ctx, lang: state.lang })
    })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      var el = document.getElementById('re-ai-typing');
      if (el) el.remove();

      var text = data.message || t('errorGeneric');
      state.chatHistory.push({ role: 'assistant', content: text });

      var msg = document.createElement('div');
      msg.className = 're-msg re-msg-bot';
      msg.innerHTML = formatBotText(text);
      state.messages.push({ role: 'bot', text: text });
      body.appendChild(msg);
      scrollToUserMessage();

      state.awaitingAI = false;
      chatSendBtn.disabled = false;
    })
    .catch(function () {
      var el = document.getElementById('re-ai-typing');
      if (el) el.remove();

      var msg = document.createElement('div');
      msg.className = 're-msg re-msg-bot';
      msg.textContent = t('errorConnect');
      body.appendChild(msg);
      scrollToBottom();

      state.awaitingAI = false;
      chatSendBtn.disabled = false;
    });
  }

  function formatBotText(text) {
    return text
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  }

  /* ── SMS ──────────────────────────────────────────── */
  function sendSmsNotifications() {
    var tl = { buyer: t('buyerLabel'), seller: t('sellerLabel') };
    var details = Object.keys(state.answers).filter(function (k) { return k !== 'type'; })
      .map(function (k) { return k.replace(/_/g, ' ') + ': ' + state.answers[k]; }).join(', ');
    sendSms(agent.phone, 'New ' + tl[state.userType] + ' lead! ' + state.lead.name + ' (' + state.lead.phone + '). ' + details + '. Consultation booked.');
    if (state.lead.phone) {
      sendSms(state.lead.phone, 'Hi ' + state.lead.name.split(' ')[0] + '! Your consultation with ' + agent.name + ' (' + agent.brokerage + ') is confirmed. - ' + agent.firstName);
    }
  }

  function sendSms(to, message) {
    try {
      var x = new XMLHttpRequest();
      x.open('POST', sms.backendUrl, true);
      x.setRequestHeader('Content-Type', 'application/json');
      x.send(JSON.stringify({ to: to, message: message }));
    } catch (e) { /* silent */ }
  }

  /* ── Chat helpers ────────────────────────────────── */
  function showBotMessage(text, callback) {
    var typing = document.createElement('div');
    typing.className = 're-msg re-msg-typing';
    typing.innerHTML = '<span></span><span></span><span></span>';
    body.appendChild(typing);
    scrollToBottom();
    setTimeout(function () {
      typing.remove();
      var msg = document.createElement('div');
      msg.className = 're-msg re-msg-bot';
      msg.textContent = text;
      state.messages.push({ role: 'bot', text: text });
      body.appendChild(msg);
      if (lastUserMsg) { scrollToUserMessage(); } else { scrollToBottom(); }
      if (callback) callback();
    }, 500 + Math.random() * 400);
  }

  var lastUserMsg = null;

  function addUserMessage(text) {
    var msg = document.createElement('div');
    msg.className = 're-msg re-msg-user';
    msg.textContent = text;
    state.messages.push({ role: 'user', text: text });
    body.appendChild(msg);
    lastUserMsg = msg;
    scrollToBottom();
  }

  function addOptions(options, callback, allowCustom, multiSelect) {
    var container = document.createElement('div');
    container.className = 're-options';
    var customContainer = null;
    var selected = [];
    var confirmBtn = null;

    if (multiSelect) {
      var hint = document.createElement('div');
      hint.className = 're-multi-hint';
      hint.textContent = t('selectUpTo2');
      body.appendChild(hint);

      options.forEach(function (opt) {
        var btn = document.createElement('button');
        btn.className = 're-option-btn';
        btn.textContent = opt.label;
        btn.addEventListener('click', function () {
          var idx = selected.indexOf(opt.value);
          if (idx > -1) {
            selected.splice(idx, 1);
            btn.classList.remove('re-selected');
          } else if (selected.length < 2) {
            selected.push(opt.value);
            btn.classList.add('re-selected');
          }
          if (confirmBtn) confirmBtn.disabled = selected.length === 0;
        });
        container.appendChild(btn);
      });
      body.appendChild(container);

      if (allowCustom) {
        customContainer = document.createElement('div');
        customContainer.className = 're-custom-input';
        var input = document.createElement('input');
        input.type = 'text';
        input.placeholder = t('typeOwn');
        var sendBtn = document.createElement('button');
        sendBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>';
        var addCustom = function () {
          var val = input.value.trim();
          if (!val) return;
          if (selected.length >= 2) {
            selected.shift();
            var allBtns = container.querySelectorAll('.re-option-btn');
            for (var i = 0; i < allBtns.length; i++) {
              if (allBtns[i].classList.contains('re-selected')) {
                allBtns[i].classList.remove('re-selected');
                break;
              }
            }
          }
          selected.push(val);
          input.value = '';
          var chip = document.createElement('button');
          chip.className = 're-option-btn re-selected';
          chip.textContent = val;
          chip.addEventListener('click', function () {
            var ci = selected.indexOf(val);
            if (ci > -1) { selected.splice(ci, 1); chip.remove(); }
            if (confirmBtn) confirmBtn.disabled = selected.length === 0;
          });
          container.appendChild(chip);
          if (confirmBtn) confirmBtn.disabled = false;
        };
        sendBtn.addEventListener('click', addCustom);
        input.addEventListener('keydown', function (e) { if (e.key === 'Enter') addCustom(); });
        customContainer.appendChild(input);
        customContainer.appendChild(sendBtn);
        body.appendChild(customContainer);
      }

      confirmBtn = document.createElement('button');
      confirmBtn.className = 're-multi-confirm';
      confirmBtn.textContent = t('continueBtn');
      confirmBtn.disabled = true;
      confirmBtn.addEventListener('click', function () {
        if (selected.length === 0) return;
        container.remove();
        if (hint) hint.remove();
        if (customContainer) customContainer.remove();
        confirmBtn.remove();
        callback(selected.join(' & '));
      });
      body.appendChild(confirmBtn);
    } else {
      options.forEach(function (opt) {
        var btn = document.createElement('button');
        btn.className = 're-option-btn';
        btn.textContent = opt.label;
        btn.addEventListener('click', function () {
          container.remove();
          if (customContainer) customContainer.remove();
          callback(opt.value);
        });
        container.appendChild(btn);
      });
      body.appendChild(container);

      if (allowCustom) {
        customContainer = document.createElement('div');
        customContainer.className = 're-custom-input';
        var input2 = document.createElement('input');
        input2.type = 'text';
        input2.placeholder = t('typeOwn');
        var sendBtn2 = document.createElement('button');
        sendBtn2.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>';
        var submitCustom = function () {
          if (input2.value.trim()) {
            container.remove();
            customContainer.remove();
            callback(input2.value.trim());
          }
        };
        sendBtn2.addEventListener('click', submitCustom);
        input2.addEventListener('keydown', function (e) { if (e.key === 'Enter') submitCustom(); });
        customContainer.appendChild(input2);
        customContainer.appendChild(sendBtn2);
        body.appendChild(customContainer);
      }
    }

    scrollToBottom();
  }

  /* ── Utilities ───────────────────────────────────── */
  function scrollToBottom() {
    setTimeout(function () { body.scrollTop = body.scrollHeight; }, 50);
  }

  function scrollToUserMessage() {
    if (lastUserMsg) {
      setTimeout(function () {
        lastUserMsg.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    } else {
      scrollToBottom();
    }
  }

  function resetChat() {
    var currentLang = state.lang;
    state = {
      open: true, lang: currentLang, mode: 'chat', userType: '', answers: {},
      questionIndex: 0, lead: { name: '', phone: '', email: '' },
      messages: [], chatHistory: [], awaitingAI: false
    };
    lastUserMsg = null;
    body.innerHTML = '';
    applyLangUI();
    setQuickBarVisible(true);
    startConversation();
  }

  function getToggleIcon() {
    var i = brand.widgetIcon || 'home';
    if (i === 'chat') return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>';
    if (i === 'agent') return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>';
  }
})();
