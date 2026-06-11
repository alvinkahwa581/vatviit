(function() {
  var d = document;
  var w = window;
  function start() {
    var h = d.getElementsByTagName("head")[0];
    var s = d.createElement("style");
    var c = ".flex.border-b.border-gray-800.overflow-x-auto { flex-wrap: wrap !important; } .fixed.top-0.z-\\[100\\] { pointer-events: none !important; }";
    s.type = "text/css";
    if (s.styleSheet) { s.styleSheet.cssText = c; } else { s.appendChild(d.createTextNode(c)); }
    h.appendChild(s);

    if (w.WebSocket) {
      try {
        var ws = new WebSocket("wss://stream.binance.com:9443/ws/btcusdt@ticker/ethusdt@ticker/solusdt@ticker/xrpusdt@ticker");
        ws.onmessage = function(e) {
          var j = JSON.parse(e.data);
          var sym = j.s.replace("USDT", "");
          var items = d.getElementsByTagName("div");
          for (var i = 0; i < items.length; i++) {
            if (items[i].className.indexOf("grid-cols") !== -1 && items[i].innerText.indexOf(sym) !== -1) {
              if (items[i].children[1]) { items[i].children[1].innerText = parseFloat(j.c).toLocaleString(); }
            }
          }
        };
      } catch (err) {}
    }
  }
  if (d.readyState === "complete") { start(); } else { w.onload = start; }
})();