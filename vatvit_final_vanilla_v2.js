/* VaTViT ULTIMATE PRODUCTION BUNDLE (FIXED) */
(function() {
  var head = document.getElementsByTagName("head")[0];
  var style = document.createElement("style");
  var css = ".flex.border-b.border-gray-800.overflow-x-auto { flex-wrap: wrap !important; } " + 
            ".fixed.top-0.z-\\[100\\] { pointer-events: none !important; } " + 
            ".fixed.top-0.z-\\[100\\] > * { pointer-events: auto !important; } " + 
            ".custom-scroll::-webkit-scrollbar { width: 4px; } " + 
            ".custom-scroll::-webkit-scrollbar-thumb { background: #374151; border-radius: 10px; }";
  
  style.type = "text/css";
  if (style.styleSheet) { style.styleSheet.cssText = css; } else { style.appendChild(document.createTextNode(css)); }
  head.appendChild(style);

  var crypto = ["btcusdt", "ethusdt", "solusdt", "xrpusdt"];
  var url = "wss://stream.binance.com:9443/ws/btcusdt@ticker/ethusdt@ticker/solusdt@ticker/xrpusdt@ticker";

  try {
    var ws = new WebSocket(url);
    ws.onmessage = function(e) {
      var d = JSON.parse(e.data);
      var s = d.s.replace("USDT", "");
      var rows = document.querySelectorAll(".grid-cols-4, .grid-cols-5");
      for (var i = 0; i < rows.length; i++) {
        if (rows[i].innerText.indexOf(s) !== -1) {
          if (rows[i].children[1]) { rows[i].children[1].innerText = parseFloat(d.c).toLocaleString(); }
          if (rows[i].children[2]) {
            var pct = parseFloat(d.P);
            rows[i].children[2].innerText = (pct >= 0 ? "+" : "") + pct.toFixed(2) + "%";
            rows[i].children[2].style.color = pct >= 0 ? "#22c55e" : "#ef4444";
          }
        }
      }
    };
  } catch (err) { console.log("WebSocket connection skipped."); }

  window.showNotification = function(t, m) {
    var o = document.querySelector(".fixed.top-0.z-\\[100\\]");
    if (!o) return;
    var n = document.createElement("div");
    n.className = "p-3 mb-2 bg-gray-950 border border-yellow-500 rounded text-xs pointer-events-auto";
    n.innerHTML = "<b>" + t + "</b><p>" + m + "</p>";
    o.appendChild(n);
    setTimeout(function() { n.remove(); }, 4000);
  };

  console.log("VaTViT Core: Success.");
})();