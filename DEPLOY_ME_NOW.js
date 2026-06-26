
/* VaTViT ULTIMATE TERMINAL CORE - PASTE THIS INTO YOUR PROJECT */
(function() {
  var d = document, w = window;

  function initVatvit() {
    // 1. INJECT STYLES
    var h = d.getElementsByTagName("head")[0];
    var s = d.createElement("style");
    var c = "#root { min-height: 100vh; background: black; display: flex; flex-direction: row; overflow: hidden; } " +
            ".flex.border-b.border-gray-800.overflow-x-auto { flex-wrap: wrap !important; } " +
            "#dashboard-tab-navigation { width: 74px; height: 100vh; background: linear-gradient(180deg,#070b13 0%,#030712 100%); border-right: 1px solid #1f2937; display: flex; flex-direction: column; align-items: center; padding: 16px 0 18px; gap: 12px; flex-shrink: 0; box-shadow: inset 0 0 0 1px rgba(255,255,255,0.03); } " +
            ".tab-btn { width: 46px; height: 46px; background: #111827; border: 1px solid #1f2937; border-radius: 12px; cursor: pointer; font-size: 18px; color: #9ca3af; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; box-shadow: 0 4px 12px rgba(0,0,0,0.2); } " +
            ".tab-btn:hover { border-color: #facc15; box-shadow: 0 0 12px rgba(250,204,21,0.2); transform: translateY(-1px); } " +
            ".tab-btn.active { background: linear-gradient(135deg,#facc15 0%,#fde68a 100%); color: #111827; border-color: #facc15; transform: translateY(-1px) scale(1.03); } " +
            "#vatvit-dashboard-shell { flex: 1; display: flex; flex-direction: column; min-width: 0; background: linear-gradient(180deg,#05070b 0%,#090d14 100%); } " +
            "#vatvit-topbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 16px 20px; border-bottom: 1px solid #1f2937; background: rgba(3,7,18,0.88); backdrop-filter: blur(10px); } " +
            "#vatvit-topbar .title { font-size: 1rem; font-weight: 700; color: #f9fafb; } " +
            "#vatvit-topbar .subtitle { font-size: 0.8rem; color: #9ca3af; } " +
            "#vatvit-quick-actions { display: flex; gap: 10px; flex-wrap: wrap; } " +
            ".quick-action { border: 1px solid #1f2937; background: #111827; color: #f3f4f6; padding: 8px 12px; border-radius: 10px; cursor: pointer; font-size: 0.8rem; } " +
            ".quick-action:hover { border-color: #facc15; color: #facc15; }";
    s.type = "text/css";
    if (s.styleSheet) { s.styleSheet.cssText = c; } else { s.appendChild(d.createTextNode(c)); }
    h.appendChild(s);

    // 2. BUILD SIDEBAR
    var root = d.getElementById('root');
    if (root && !d.getElementById('dashboard-tab-navigation')) {
      var shell = d.createElement('div');
      shell.id = 'vatvit-dashboard-shell';
      shell.innerHTML = '<div id="vatvit-topbar"><div><div class="title">Welcome back</div><div class="subtitle">Here’s a simple view of your portfolio and next steps.</div></div><div id="vatvit-quick-actions"><button class="quick-action">＋ Add Funds</button><button class="quick-action">📈 Open Trade</button><button class="quick-action">🧭 Help</button></div></div>';
      root.insertBefore(shell, root.firstChild);

      var sidebar = d.createElement('div');
      sidebar.id = 'dashboard-tab-navigation';
      var tabs = [
        {l:'Overview', i:'🏠'}, {l:'Markets', i:'📊'}, {l:'Chart', i:'📈'}, 
        {l:'Trade', i:'💰'}, {l:'Wallet', i:'💳'}, {l:'Community', i:'👥'}, 
        {l:'Leaderboard', i:'🏆'}, {l:'Academy', i:'🎓'}, {l:'News', i:'📰'}, {l:'About', i:'ℹ️'}
      ];
      sidebar.innerHTML = tabs.map(function(t, idx) {
        return '<button class="tab-btn" data-index="'+idx+'" title="'+t.l+'">'+t.i+'</button>';
      }).join('');
      shell.insertBefore(sidebar, shell.firstChild);

      // Tab Switching Logic
      var btns = sidebar.querySelectorAll('.tab-btn');
      btns.forEach(function(btn) {
        btn.onclick = function() {
          var idx = parseInt(this.getAttribute('data-index'));
          btns.forEach(function(b, i) {
            b.classList.toggle('active', i === idx);
          });
          w.dispatchEvent(new Event('resize'));
          if (idx === 9) alert("CEO: 0724862593 | Management: 07112930938");
        };
      });
      if (btns[0]) btns[0].classList.add('active');
    }

    // 3. START BINANCE DATA
    if (w.WebSocket) {
      var ws = new WebSocket("wss://stream.binance.com:9443/ws/btcusdt@ticker/ethusdt@ticker/solusdt@ticker/xrpusdt@ticker");
      ws.onmessage = function(e) {
        var j = JSON.parse(e.data), sym = j.s.replace("USDT", ""), items = d.getElementsByTagName("div");
        for (var i = 0; i < items.length; i++) {
          if (items[i].className.indexOf("grid-cols") !== -1 && items[i].innerText.indexOf(sym) !== -1) {
            if (items[i].children[1]) items[i].children[1].innerText = parseFloat(j.c).toLocaleString();
          }
        }
      };
    }
  }

  if (d.readyState === "complete") { initVatvit(); } else { w.onload = initVatvit; }
})();
