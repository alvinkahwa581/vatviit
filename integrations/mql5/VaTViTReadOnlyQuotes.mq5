#property strict
#property version   "0.1.0"
#property description "Read-only quote observer; does not send or modify orders."

input string WatchSymbol = "";

int OnInit()
{
   if(WatchSymbol != "" && !SymbolSelect(WatchSymbol, true))
   {
      PrintFormat("VaTViT read-only observer: cannot select %s", WatchSymbol);
      return INIT_FAILED;
   }

   EventSetTimer(1);
   return INIT_SUCCEEDED;
}

void OnDeinit(const int reason)
{
   EventKillTimer();
}

void OnTick()
{
   PublishQuote();
}

void OnTimer()
{
   PublishQuote();
}

void PublishQuote()
{
   string symbol = WatchSymbol == "" ? _Symbol : WatchSymbol;
   MqlTick tick;
   if(!SymbolInfoTick(symbol, tick))
   {
      PrintFormat("VaTViT read-only observer: no quote for %s", symbol);
      return;
   }

   PrintFormat("VaTViT_READ_ONLY|%s|%I64d|%.10f|%.10f",
               symbol, tick.time_msc, tick.bid, tick.ask);
}
