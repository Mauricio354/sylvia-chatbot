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
  var calendar = C.calendar || {};
  var sms = C.sms || {};
  var leadCapture = C.leadCapture || {};
  var PRIMARY = brand.primaryColor || '#1a3a5c';
  var ACCENT = brand.accentColor || '#e8a87c';
  // Allow config to override the API base URL
  if (C.apiUrl) API_BASE = C.apiUrl;

  var state = {
    open: false,
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
    '.re-chat-body{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:8px;min-height:300px;max-height:420px;scroll-behavior:smooth}' +
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
    '.re-new-chat{background:none;border:none;color:#fff;cursor:pointer;padding:4px 6px;opacity:.7;transition:opacity .2s;display:flex;align-items:center;justify-content:center}' +
    '.re-new-chat:hover{opacity:1}' +
    '.re-new-chat svg{width:16px;height:16px}' +
    '.re-input-bar{display:flex;gap:6px;padding:10px 14px;border-top:1px solid #f0f0f0;flex-shrink:0;background:#fff}' +
    '.re-input-bar input{flex:1;padding:9px 14px;border:1.5px solid #e0e0e0;border-radius:22px;font-size:13px;font-family:inherit;outline:none;transition:border-color .2s}' +
    '.re-input-bar input:focus{border-color:' + PRIMARY + '}' +
    '.re-input-bar button{background:' + PRIMARY + ';color:#fff;border:none;border-radius:50%;width:36px;height:36px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .15s}' +
    '.re-input-bar button:hover{filter:brightness(1.1)}' +
    '.re-input-bar button:disabled{opacity:.4;cursor:default}' +
    '.re-powered{text-align:center;padding:6px;font-size:10px;color:#bbb;flex-shrink:0}' +
    '@media(max-width:480px){' +
      '#re-chatbot-window{bottom:0;right:0;left:0;top:0;width:100%;max-height:none;height:100%;border-radius:0;animation:none}' +
      '#re-chatbot-window .re-chat-body{max-height:none;flex:1;min-height:0}' +
      '#re-chatbot-toggle{bottom:16px;right:16px;width:56px;height:56px}' +
      'body.re-chat-open{overflow:hidden;position:fixed;width:100%;height:100%}' +
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
        '<button class="re-new-chat" id="re-new-chat" aria-label="New conversation" title="New conversation">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>' +
        '</button>' +
        '<button class="re-chat-close" aria-label="Close chat">&times;</button>' +
      '</div>' +
    '</div>' +
    '<div class="re-chat-body" id="re-chat-body"></div>' +
    '<div class="re-quick-bar" id="re-quick-bar">' +
      '<button id="re-buy-btn">\ud83c\udfe0 I want to buy</button>' +
      '<button id="re-sell-btn">\ud83d\udcb0 I want to sell</button>' +
    '</div>' +
    '<div class="re-input-bar" id="re-input-bar">' +
      '<input type="text" id="re-chat-input" placeholder="Ask a question..." />' +
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
  var newChatBtn = document.getElementById('re-new-chat');

  function setQuickBarVisible(visible) {
    if (visible) { quickBar.classList.remove('re-hidden'); }
    else { quickBar.classList.add('re-hidden'); }
  }

  /* ── Mobile helpers ─────────────────────────────── */
  var isMobile = function () { return window.innerWidth <= 480; };
  var savedScrollY = 0;

  function lockBodyScroll() {
    if (!isMobile()) return;
    savedScrollY = window.scrollY;
    document.body.classList.add('re-chat-open');
    document.body.style.top = '-' + savedScrollY + 'px';
  }

  function unlockBodyScroll() {
    if (!document.body.classList.contains('re-chat-open')) return;
    document.body.classList.remove('re-chat-open');
    document.body.style.top = '';
    window.scrollTo(0, savedScrollY);
  }

  // Prevent chat body touch scroll from leaking to background
  win.addEventListener('touchmove', function (e) {
    e.stopPropagation();
  }, { passive: true });

  /* ── Event listeners ─────────────────────────────── */
  toggle.addEventListener('click', function () {
    state.open = !state.open;
    if (state.open) {
      win.classList.add('re-open');
      lockBodyScroll();
      if (state.messages.length === 0) startConversation();
      chatInput.focus();
    } else {
      win.classList.remove('re-open');
      unlockBodyScroll();
    }
  });

  win.querySelector('.re-chat-close').addEventListener('click', function () {
    state.open = false;
    win.classList.remove('re-open');
    unlockBodyScroll();
  });

  buyBtn.addEventListener('click', function () { handleTypeSelection('buyer'); });
  sellBtn.addEventListener('click', function () { handleTypeSelection('seller'); });
  newChatBtn.addEventListener('click', resetChat);

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
    showBotMessage(brand.welcomeMessage || "Hi! How can I help you today?");
  }

  function handleTypeSelection(value) {
    var labels = { buyer: "I want to buy", seller: "I want to sell" };
    addUserMessage(labels[value] || value);
    state.userType = value;
    state.questionIndex = 0;
    state.answers = { type: value };
    state.mode = 'guided';
    setQuickBarVisible(false);

    var resp = {
      buyer: "Great! I'd love to help you find the perfect property. Let me ask a few quick questions so " + (agent.firstName || 'the agent') + " can prepare the best options for you.",
      seller: "Wonderful! Let's get some details so " + (agent.firstName || 'the agent') + " can give you an accurate market assessment."
    };
    setTimeout(function () {
      showBotMessage(resp[value], function () {
        setTimeout(function () { askNextQuestion(); }, 400);
      });
    }, 500);
  }

  function askNextQuestion() {
    var qs = questions[state.userType] || [];
    if (state.questionIndex >= qs.length) {
      setTimeout(function () {
        showBotMessage(
          "Thanks for those details! To connect you with " + (agent.firstName || 'our agent') + ", I'll just need your contact info.",
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
    var fl = { name: 'Your name', phone: 'Phone number', email: 'Email address' };
    var ft = { name: 'text', phone: 'tel', email: 'email' };
    var fp = { name: 'John Smith', phone: '(403) 555-1234', email: 'john@example.com' };

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
    btn.textContent = 'Continue to Book a Consultation';
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
        var tl = { buyer: 'buying', seller: 'selling' };
        showBotMessage(
          "Perfect, " + state.lead.name.split(' ')[0] + "! Based on your " + (tl[state.userType] || '') +
          " needs, I'd recommend booking a consultation with " + (agent.firstName || 'our agent') +
          ". Pick a time that works for you:",
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
        '</svg> Book Your Consultation';
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
      msg.textContent = 'Please email ' + (agent.email || 'us') + ' to schedule your consultation.';
      container.appendChild(msg);
    }

    body.appendChild(container);
    scrollToBottom();
  }

  /* ── Booking complete ────────────────────────────── */
  function handleBookingComplete() {
    addUserMessage("I've booked my consultation!");
    state.mode = 'chat';
    setQuickBarVisible(true);
    if (sms.enabled && sms.backendUrl) sendSmsNotifications();
    setTimeout(function () {
      var tl = { buyer: 'property search', seller: 'listing consultation' };
      showBotMessage(
        "You're all set, " + state.lead.name.split(' ')[0] + "! " +
        (agent.firstName || 'Our agent') + " is looking forward to helping with your " +
        (tl[state.userType] || 'real estate needs') +
        ". You'll receive a confirmation shortly. Feel free to ask me anything else!",
        function () {
          setTimeout(function () {
            var summary = document.createElement('div');
            summary.className = 're-msg re-msg-bot';
            summary.style.background = '#f8f9fa';
            summary.style.border = '1px solid #e8e8e8';
            summary.style.fontSize = '12px';
            summary.innerHTML =
              '<strong>Consultation Summary</strong><br>' +
              'Client: ' + state.lead.name + '<br>' +
              'Type: ' + state.userType.charAt(0).toUpperCase() + state.userType.slice(1) + '<br>' +
              Object.keys(state.answers).filter(function (k) { return k !== 'type'; }).map(function (k) {
                return k.replace(/_/g, ' ').replace(/\b\w/g, function (l) { return l.toUpperCase(); }) + ': ' + state.answers[k];
              }).join('<br>') +
              '<br>Phone: ' + state.lead.phone +
              '<br>Email: ' + state.lead.email;
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
      body: JSON.stringify({ messages: state.chatHistory, context: ctx })
    })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      var el = document.getElementById('re-ai-typing');
      if (el) el.remove();

      var text = data.message || "I'm sorry, something went wrong. Please try again.";
      state.chatHistory.push({ role: 'assistant', content: text });

      var msg = document.createElement('div');
      msg.className = 're-msg re-msg-bot';
      msg.innerHTML = formatBotText(text);
      state.messages.push({ role: 'bot', text: text });
      body.appendChild(msg);
      scrollToBottom();

      state.awaitingAI = false;
      chatSendBtn.disabled = false;
      chatInput.focus();
    })
    .catch(function () {
      var el = document.getElementById('re-ai-typing');
      if (el) el.remove();

      var msg = document.createElement('div');
      msg.className = 're-msg re-msg-bot';
      msg.textContent = "I'm having trouble connecting right now. Please try again in a moment.";
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
    var tl = { buyer: 'Buyer', seller: 'Seller' };
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
      scrollToBottom();
      if (callback) callback();
    }, 500 + Math.random() * 400);
  }

  function addUserMessage(text) {
    var msg = document.createElement('div');
    msg.className = 're-msg re-msg-user';
    msg.textContent = text;
    state.messages.push({ role: 'user', text: text });
    body.appendChild(msg);
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
      hint.textContent = 'Select up to 2 options';
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
        input.placeholder = 'Or type your own...';
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
      confirmBtn.textContent = 'Continue \u2192';
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
        input2.placeholder = 'Or type your own...';
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

  function resetChat() {
    state = {
      open: true, mode: 'chat', userType: '', answers: {},
      questionIndex: 0, lead: { name: '', phone: '', email: '' },
      messages: [], chatHistory: [], awaitingAI: false
    };
    body.innerHTML = '';
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
