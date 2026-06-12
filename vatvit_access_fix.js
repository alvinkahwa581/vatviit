/* VaTViT Terminal Core */
(function() {
  var css = ".flex.border-b.border-gray-800.overflow-x-auto { flex-wrap: wrap !important; } .fixed.top-0.z-\\[100\\] { pointer-events: none !important; } .fixed.top-0.z-\\[100\\] > * { pointer-events: auto !important; }";
  var style = document.createElement("style");
  style.type = "text/css";
  if (style.styleSheet) { style.styleSheet.cssText = css; } else { style.appendChild(document.createTextNode(css)); }
  document.getElementsByTagName("head")[0].appendChild(style);

  var symbols = ["btcusdt", "ethusdt", "solusdt", "xrpusdt"];
  var wsUrl = "wss://stream.binance.com:9443/ws/btcusdt@ticker/ethusdt@ticker/solusdt@ticker/xrpusdt@ticker";
  var ws = new WebSocket(wsUrl);
  ws.onmessage = function(e) {
    var d = JSON.parse(e.data);
    var s = d.s.replace("USDT", "");
    var rows = document.querySelectorAll(".grid-cols-4, .grid-cols-5");
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].innerText.indexOf(s) !== -1) {
        if (rows[i].children[1]) rows[i].children[1].innerText = parseFloat(d.c).toLocaleString();
      }
    }
  };
})();