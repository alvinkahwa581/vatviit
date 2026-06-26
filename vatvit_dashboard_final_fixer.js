
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
        sidebar.style.cssText = 'width:74px; height:100vh; background:linear-gradient(180deg,#070b13 0%,#030712 100%); border-right:1px solid #1f2937; display:flex; flex-direction:column; align-items:center; padding:16px 0 18px; gap:12px; z-index:1000; flex-shrink:0; box-shadow:0 0 0 1px rgba(255,255,255,0.03) inset;';
        
        var tabs = [
          {l:'Overview', i:'🏠'}, {l:'Markets', i:'📊'}, {l:'Chart', i:'📈'}, 
          {l:'Trade', i:'💰'}, {l:'Wallet', i:'💳'}, {l:'Community', i:'👥'}, 
          {l:'Leaderboard', i:'🏆'}, {l:'Academy', i:'🎓'}, {l:'News', i:'📰'}, {l:'About', i:'ℹ️'}
        ];

        sidebar.innerHTML = tabs.map(function(t, idx) {
          return '<button class="tab-btn" data-index="'+idx+'" title="'+t.l+'" style="width:46px; height:46px; background:#111827; border:1px solid #1f2937; border-radius:12px; cursor:pointer; font-size:18px; color:#9ca3af; display:flex; align-items:center; justify-content:center; transition:all .2s ease; box-shadow:0 4px 12px rgba(0,0,0,0.2);">'+t.i+'</button>';
        }).join('');
        
        if (root) root.insertBefore(sidebar, root.firstChild);

        // Tab Switch Logic
        var panels = Array.prototype.slice.call(document.querySelectorAll('.flex-1.flex.flex-col.lg\\:flex-row > div, .flex-1.flex.flex-col > div'));
        var btns = sidebar.querySelectorAll('.tab-btn');
        
        window.switchTab = function(idx) {
          panels.forEach(function(p, i) { if(p) p.style.display = (i === idx) ? 'flex' : 'none'; });
          btns.forEach(function(b, i) {
            if(i === idx) {
              b.style.background = 'linear-gradient(135deg,#facc15 0%,#fde68a 100%)';
              b.style.color = '#111827';
              b.style.borderColor = '#facc15';
              b.style.transform = 'translateY(-1px) scale(1.03)';
            } else {
              b.style.background = '#111827';
              b.style.color = '#9ca3af';
              b.style.borderColor = '#1f2937';
              b.style.transform = 'none';
            }
          });
          window.dispatchEvent(new Event('resize'));
        };

        btns.forEach(function(btn) {
          btn.onclick = function() { window.switchTab(parseInt(this.getAttribute('data-index'))); };
          btn.onmouseenter = function() {
            if (this.getAttribute('data-index') !== String(window.currentTabIndex)) {
              this.style.borderColor = '#374151';
            }
          };
          btn.onmouseleave = function() {
            if (this.getAttribute('data-index') !== String(window.currentTabIndex)) {
              this.style.borderColor = '#1f2937';
            }
          };
        });
        window.currentTabIndex = 0;
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
