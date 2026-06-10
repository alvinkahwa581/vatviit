
/* VaTViT ULTIMATE TERMINAL CORE - PASTE THIS INTO YOUR PROJECT */
(function() {
  var d = document, w = window;

  function initVatvit() {
    // 1. INJECT STYLES
    var h = d.getElementsByTagName("head")[0];
    var s = d.createElement("style");
    var c = "#root { min-height: 100vh; background: black; display: flex; flex-direction: row; overflow: hidden; } " +
            ".flex.border-b.border-gray-800.overflow-x-auto { flex-wrap: wrap !important; } " +
            "#dashboard-tab-navigation { width: 64px; height: 100vh; background: #030712; border-right: 1px solid #1f2937; display: flex; flex-direction: column; align-items: center; padding: 15px 0; gap: 15px; flex-shrink: 0; } " +
            ".tab-btn { width: 40px; height: 40px; background: #111827; border: 1px solid #1f2937; border-radius: 10px; cursor: pointer; font-size: 18px; color: #6b7280; display: flex; align-items: center; justify-content: center; transition: 0.2s; } " +
            ".tab-btn:hover { border-color: #facc15; box-shadow: 0 0 10px rgba(250,204,21,0.2); }";
    s.type = "text/css";
    if (s.styleSheet) { s.styleSheet.cssText = c; } else { s.appendChild(d.createTextNode(c)); }
    h.appendChild(s);

    // 2. BUILD SIDEBAR
    var root = d.getElementById('root');
    if (root && !d.getElementById('dashboard-tab-navigation')) {
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
      root.insertBefore(sidebar, root.firstChild);

      // Tab Switching Logic
      var btns = sidebar.querySelectorAll('.tab-btn');
      btns.forEach(function(btn) {
        btn.onclick = function() {
          var idx = parseInt(this.getAttribute('data-index'));
          btns.forEach(function(b, i) { b.style.background = (i === idx) ? '#facc15' : '#111827'; b.style.color = (i === idx) ? 'black' : '#6b7280'; });
          w.dispatchEvent(new Event('resize'));
          if (idx === 9) alert("CEO: 0724862593 | Management: 07112930938");
        };
      });
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
