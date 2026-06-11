
(function() {
  function applyAllFixes() {
    // 1. Root & Visibility
    var root = document.getElementById('root');
    if (root) {
        root.style.minHeight = '100vh';
        root.style.display = 'flex';
        root.style.flexDirection = 'row';
        root.style.background = 'black';
    }

    // 2. Sidebar Navigation (10 Tabs)
    if (!document.getElementById('dashboard-tab-navigation')) {
        var sidebar = document.createElement('div');
        sidebar.id = 'dashboard-tab-navigation';
        sidebar.style.cssText = 'width:64px; height:100vh; background:#030712; border-right:1px solid #1f2937; display:flex; flex-direction:column; align-items:center; padding:15px 0; gap:15px; z-index:1000; flex-shrink:0;';
        
        var tabs = [
          {l:'Overview', i:'🏠'}, {l:'Markets', i:'📊'}, {l:'Chart', i:'📈'}, 
          {l:'Trade', i:'💰'}, {l:'Wallet', i:'💳'}, {l:'Community', i:'👥'}, 
          {l:'Leaderboard', i:'🏆'}, {l:'Academy', i:'🎓'}, {l:'News', i:'📰'}, {l:'About', i:'ℹ️'}
        ];

        sidebar.innerHTML = tabs.map(function(t, idx) {
          return '<button class="tab-btn" data-index="'+idx+'" title="'+t.l+'" style="width:40px; height:40px; background:#111827; border:1px solid #1f2937; border-radius:10px; cursor:pointer; font-size:18px; color:#6b7280; display:flex; align-items:center; justify-content:center;">'+t.i+'</button>';
        }).join('');
        
        if (root) root.insertBefore(sidebar, root.firstChild);

        // Tab Switch Logic
        var panels = Array.prototype.slice.call(document.querySelectorAll('.flex-1.flex.flex-col.lg\\:flex-row > div, .flex-1.flex.flex-col > div'));
        var btns = sidebar.querySelectorAll('.tab-btn');
        
        window.switchTab = function(idx) {
          panels.forEach(function(p, i) { if(p) p.style.display = (i === idx) ? 'flex' : 'none'; });
          btns.forEach(function(b, i) {
            if(i === idx) { b.style.background = '#facc15'; b.style.color = 'black'; }
            else { b.style.background = '#111827'; b.style.color = '#6b7280'; }
          });
          window.dispatchEvent(new Event('resize'));
        };

        btns.forEach(function(btn) {
          btn.onclick = function() { window.switchTab(parseInt(this.getAttribute('data-index'))); };
        });
        window.switchTab(0);
    }

    // 3. TradingView Chart
    var chartContainer = document.querySelector('.relative.w-full.bg-gray-950');
    if (chartContainer && !document.getElementById('tv_main')) {
      chartContainer.innerHTML = '<div id="tv_main" style="height:600px; width:100%;"></div>';
      var script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/tv.js';
      script.onload = function() {
        new TradingView.widget({"autosize":true, "symbol":"BINANCE:BTCUSDT", "interval":"1", "theme":"dark", "style":"1", "container_id":"tv_main"});
      };
      document.head.appendChild(script);
    }
  }

  if (document.readyState === 'complete') { applyAllFixes(); } 
  else { window.addEventListener('load', applyAllFixes); }
})();
