/* =====================================================================
   وحدة التداول — الآلية الموحدة للمضاربة (5 طبقات)
   الطبقة 0: بوابة السوق (0–7) → مُضاعِف التعرض G
   الدرجة المركّبة: 0.30 فني + 0.30 قيمة + 0.15 زخم + 0.15 أخبار + 0.10 تدفق × G
   المحركان: الشهري (الرئيسي) والربع سنوي — اليومي مؤجل عمداً وفق الخطة
===================================================================== */
"use strict";

const TRS={
ar:{
  sec:"وحدة التداول",n:"الآلية الموحدة — 5 طبقات",
  sub:"بوابة سوق → درجة مركّبة → قادح دخول → وقف هيكلي → حجم مركز. النظام يرشّح ويوقّت ويدير المخاطر — لا يتنبأ.",
  gateTitle:"الطبقة 0 — بوابة السوق",
  gateOf:"من 7",gateLoading:"جارٍ حساب بوابة السوق…",gateFail:"تعذر حساب البوابة — أعد المحاولة.",
  gateUpd:"آخر تحديث: ",refresh:"تحديث",
  regimes:["هابط — نقد 100٪، لا إشارات شراء","عرضي/ضبابي — تعرض ≤ 30٪، صفقات انتقائية فقط","صاعد حذر — تعرض ≤ 60٪","صاعد قوي — تعرض حتى 100٪"],
  exposure:"التعرض المسموح",gMult:"مُضاعِف البوابة G",
  conds:{ma200:"المؤشر فوق MA200 (+2)",ma50:"المؤشر فوق MA50 (+1)",golden:"تقاطع ذهبي MA50>MA200 (+1)",breadth:"اتساع: >50٪ من سلة القيادات فوق MA50 (+1)",brent:"برنت فوق MA50 (+1)",brentUS:"ناسداك فوق MA50 (+1)",news:"لا حدث كلي سلبي نشط (+1)"},
  newsToggle:"لا يوجد حدث كلي سلبي (فيدرالي/جيوسياسي/OPEC) خلال 5 أيام — أكّد يدوياً",
  horizon:"المحرك",hm:"شهري (Swing) — الرئيسي",hq:"ربع سنوي (Position)",hd:"يومي — مؤجل وفق الخطة (بوابة 6–7 فقط + تحذير 97٪)",
  capital:"رأس المال (ريال/دولار)",
  sentStock:"مشاعر أخبار السهم (−1 إلى +1)",sentSector:"مشاعر القطاع (−1 إلى +1)",
  veto:"فيتو خبري",vetoNone:"لا يوجد",
  vetoOpts:{earn3:"أرباح خلال ≤3 جلسات (حجب)",earnMiss:"أرباح دون التوقعات (حظر 10 جلسات)",rights:"حقوق أولوية قائمة",halt:"تعليق/استفسار تداول أو CMA (صارم)",fed:"قرار فيدرالي/OPEC خلال 24 ساعة"},
  cat:"محفّز خبري",catNone:"لا يوجد",
  catOpts:{earnBeat:"أرباح فوق التوقعات + رفع توزيعات (+)",contract:"عقد حكومي كبير (+)",mna:"استحواذ/اندماج (+)"},
  score:"الدرجة المركّبة",conf:"الثقة الفنية",
  comps:{F:"فني (7 شروط)",V:"قيمة (فجوة DCF)",M:"زخم 12−1 + قوة نسبية",N:"أخبار ومشاعر",L:"تدفق (حجم نسبي RVOL)"},
  fconds:["فوق MA200","EMA50 > EMA200","ADX > 25","RSI بين 50–70","MACD موجب","انكماش تقلب (VCP مبسّط)","فوق VWAP-20"],
  signal:"الإشارة",
  sigs:{strong:"شراء قوي",buy:"شراء (نصف الحجم)",watch:"مراقبة — لا دخول",avoid:"تجنّب / خروج",cash:"نقد — البوابة هابطة",vetoed:"فيتو خبري — لا دخول"},
  levels:"خطة الصفقة",
  entry:"قادح الدخول",entryNote:m=>m==="m"?"إغلاق فوق قمة دونشيان 20 + RVOL > 2":"إغلاق فوق قمة دونشيان 55 + RVOL > 1.5",
  brokeOut:"السعر فوق القادح بالفعل — الدخول بالسعر الحالي",
  stop:"وقف الخسارة",stopNote:m=>m==="m"?"هيكلي (قاع 20) − 0.5×ATR، بسقف 8٪":"الأدنى من (قاع دونشيان 20، الدخول − 2×ATR)",
  target:"الهدف (2R)",targetNote:"جزئي 50٪ عند 2R والباقي بوقف متحرك",
  size:"حجم المركز",shares:"سهم",posVal:"قيمة المركز",riskAmt:"المخاطرة (1.5٪)",
  timeStop:"وقف زمني: خروج إن لم يتحرك السعر +1×ATR لصالحك خلال 10 جلسات",
  rules:"سقف المركز 15٪ · المخاطرة المفتوحة الكلية ≤ 6٪ · لا أكثر من مركزين بالقطاع · دوائر قاطعة: −5٪ تنصيف الأحجام، −8٪ إيقاف الشهري، −12٪ إيقاف كامل",
  atr:"ATR(14)",adx:"ADX(14)",rvol:"RVOL",don20:"دونشيان 20 (قمة/قاع)",don55:"قمة دونشيان 55",
  lockP:"<b>الإشارة الكاملة وخطة الصفقة (دخول/وقف/هدف/حجم)</b> — حصرية للمشتركين",
  lockBtn:"اشترك — 50 ريال/شهر",
  disc:"⚠ إشارات احتمالية من نظام كمي وليست نصيحة استثمارية. الحافة = احتمال متواضع × عائد/مخاطرة ≥ 2 × حجم منضبط × تكرار. مدخلات الأخبار يدوية في هذا الإصدار — تحقق من إعلانات الشركة قبل أي قرار. 97٪ من المضاربين اليوميين يخسرون (دراسة SSRN #3423101).",
  applied:"أعد الحساب",
},
en:{
  sec:"Trading Unit",n:"Unified mechanism — 5 layers",
  sub:"Market gate → composite score → entry trigger → structural stop → position size. The system filters, times and manages risk — it does not predict.",
  gateTitle:"Layer 0 — Market Gate",
  gateOf:"of 7",gateLoading:"Computing market gate…",gateFail:"Gate computation failed — retry.",
  gateUpd:"Updated: ",refresh:"Refresh",
  regimes:["Bearish — 100% cash, no buy signals","Choppy — exposure ≤ 30%, selective trades only","Cautious bull — exposure ≤ 60%","Strong bull — exposure up to 100%"],
  exposure:"Allowed exposure",gMult:"Gate multiplier G",
  conds:{ma200:"Index above MA200 (+2)",ma50:"Index above MA50 (+1)",golden:"Golden cross MA50>MA200 (+1)",breadth:"Breadth: >50% of leaders basket above MA50 (+1)",brent:"Brent above MA50 (+1)",brentUS:"Nasdaq above MA50 (+1)",news:"No active negative macro event (+1)"},
  newsToggle:"No negative macro event (Fed/geopolitical/OPEC) within 5 days — confirm manually",
  horizon:"Engine",hm:"Monthly (Swing) — primary",hq:"Quarterly (Position)",hd:"Intraday — deferred per plan (gate 6–7 only + 97% warning)",
  capital:"Capital (SAR/USD)",
  sentStock:"Stock news sentiment (−1 to +1)",sentSector:"Sector sentiment (−1 to +1)",
  veto:"News veto",vetoNone:"None",
  vetoOpts:{earn3:"Earnings within ≤3 sessions (blackout)",earnMiss:"Earnings miss (10-session ban)",rights:"Rights issue in progress",halt:"Exchange/CMA halt or inquiry (strict)",fed:"Fed/OPEC decision within 24h"},
  cat:"News catalyst",catNone:"None",
  catOpts:{earnBeat:"Earnings beat + dividend raise (+)",contract:"Major government contract (+)",mna:"M&A announcement (+)"},
  score:"Composite score",conf:"Technical confidence",
  comps:{F:"Technical (7 conditions)",V:"Value (DCF gap)",M:"Momentum 12−1 + RS",N:"News & sentiment",L:"Flow (relative volume)"},
  fconds:["Above MA200","EMA50 > EMA200","ADX > 25","RSI 50–70","MACD positive","Volatility contraction (simplified VCP)","Above VWAP-20"],
  signal:"Signal",
  sigs:{strong:"STRONG BUY",buy:"BUY (half size)",watch:"WATCH — no entry",avoid:"AVOID / EXIT",cash:"CASH — bearish gate",vetoed:"NEWS VETO — no entry"},
  levels:"Trade plan",
  entry:"Entry trigger",entryNote:m=>m==="m"?"Close above Donchian-20 high + RVOL > 2":"Close above Donchian-55 high + RVOL > 1.5",
  brokeOut:"Price already above trigger — enter at market",
  stop:"Stop loss",stopNote:m=>m==="m"?"Structural (20-low) − 0.5×ATR, capped at 8%":"Lower of (Donchian-20 low, entry − 2×ATR)",
  target:"Target (2R)",targetNote:"Take 50% at 2R, trail the rest",
  size:"Position size",shares:"shares",posVal:"Position value",riskAmt:"Risk (1.5%)",
  timeStop:"Time stop: exit if price hasn't moved +1×ATR in your favor within 10 sessions",
  rules:"Position cap 15% · total open risk ≤ 6% · max 2 positions per sector · circuit breakers: −5% halve sizes, −8% stop monthly engine, −12% full stop",
  atr:"ATR(14)",adx:"ADX(14)",rvol:"RVOL",don20:"Donchian 20 (high/low)",don55:"Donchian 55 high",
  lockP:"<b>The full signal and trade plan (entry/stop/target/size)</b> — subscribers only",
  lockBtn:"Subscribe — 50 SAR/month",
  disc:"⚠ Probabilistic signals from a quantitative system — not investment advice. Edge = modest hit-rate × R:R ≥ 2 × disciplined sizing × repetition. News inputs are manual in this version — verify company announcements before any decision. 97% of day traders lose money (SSRN #3423101).",
  applied:"Recalculate",
},
};
const trs=()=>TRS[LANG]||TRS.ar;

/* --------- مؤشرات إضافية --------- */
function trATRseries(h,l,c,n=14){
  if(c.length<n+1)return null;
  const tr=[];
  for(let i=1;i<c.length;i++)tr.push(Math.max(h[i]-l[i],Math.abs(h[i]-c[i-1]),Math.abs(l[i]-c[i-1])));
  const out=[];let a=tr.slice(0,n).reduce((x,y)=>x+y,0)/n;out.push(a);
  for(let i=n;i<tr.length;i++){a=(a*(n-1)+tr[i])/n;out.push(a);}
  return out;
}
function trADX(h,l,c,n=14){
  if(c.length<2*n+1)return null;
  const pdm=[],ndm=[],tr=[];
  for(let i=1;i<c.length;i++){
    const up=h[i]-h[i-1],dn=l[i-1]-l[i];
    pdm.push(up>dn&&up>0?up:0);ndm.push(dn>up&&dn>0?dn:0);
    tr.push(Math.max(h[i]-l[i],Math.abs(h[i]-c[i-1]),Math.abs(l[i]-c[i-1])));
  }
  const sm=a=>{let s=a.slice(0,n).reduce((x,y)=>x+y,0);const o=[s];for(let i=n;i<a.length;i++){s=s-s/n+a[i];o.push(s);}return o;};
  const strc=sm(tr),spd=sm(pdm),snd=sm(ndm);
  const dx=[];
  for(let i=0;i<strc.length;i++){
    const pdi=100*spd[i]/strc[i],ndi=100*snd[i]/strc[i];
    dx.push(pdi+ndi===0?0:100*Math.abs(pdi-ndi)/(pdi+ndi));
  }
  if(dx.length<n)return null;
  let adx=dx.slice(0,n).reduce((x,y)=>x+y,0)/n;
  for(let i=n;i<dx.length;i++)adx=(adx*(n-1)+dx[i])/n;
  return adx;
}
const trSMAat=(a,n)=>a.length<n?null:a.slice(-n).reduce((x,y)=>x+y,0)/n;
const trClamp=(x,lo,hi)=>Math.max(lo,Math.min(hi,x));

/* --------- بوابة السوق (الطبقة 0) --------- */
const GATE_CFG={
  SA:{idx:"^TASI.SR",extra:"BZ=F",extraKey:"brent",
      basket:["1120.SR","1180.SR","1010.SR","1060.SR","2222.SR","2010.SR","2082.SR","2280.SR","7010.SR","1211.SR","2020.SR","1150.SR","4030.SR","8210.SR","4190.SR"]},
  US:{idx:"^GSPC",extra:"^IXIC",extraKey:"brentUS",
      basket:["AAPL","MSFT","NVDA","GOOGL","AMZN","META","TSLA","JPM","V","XOM","UNH","HD","PG","KO","LLY"]},
};
let GATE={SA:null,US:null};
async function trChart(sym,range){
  const j=await (await fetch(`${API}/api/chart?symbol=${encodeURIComponent(sym)}&range=${range}&interval=1d`)).json();
  const r=j.chart&&j.chart.result&&j.chart.result[0];
  if(!r)throw new Error(sym);
  return (r.indicators.quote[0].close||[]).filter(x=>x!=null);
}
function gateNewsOK(){return localStorage.getItem("fv_gate_news")!=="0";}
async function computeGate(market,force){
  const key="fv_gate_"+market;
  if(!force){
    try{const c=JSON.parse(localStorage.getItem(key));
      if(c&&Date.now()-c.ts<4*3600*1000){GATE[market]=c;return c;}}catch(e){}
  }
  const cfg=GATE_CFG[market];
  const [idxR,extraR,...basketR]=await Promise.allSettled([
    trChart(cfg.idx,"2y"),trChart(cfg.extra,"6mo"),
    ...cfg.basket.map(s=>trChart(s,"6mo")),
  ]);
  if(idxR.status!=="fulfilled")throw new Error("index");
  const idx=idxR.value,last=idx[idx.length-1];
  const ma200=trSMAat(idx,200),ma50=trSMAat(idx,50);
  const parts={};
  parts.ma200=ma200!=null&&last>ma200;
  parts.ma50=ma50!=null&&last>ma50;
  parts.golden=ma50!=null&&ma200!=null&&ma50>ma200;
  let above=0,valid=0;
  basketR.forEach(r=>{
    if(r.status!=="fulfilled")return;
    const cl=r.value,m=trSMAat(cl,50);
    if(m!=null){valid++;if(cl[cl.length-1]>m)above++;}
  });
  parts.breadth=valid>=8&&above/valid>0.5;
  parts.breadthPct=valid?Math.round(above/valid*100):null;
  let extraOk=false;
  if(extraR.status==="fulfilled"){const e=extraR.value,m=trSMAat(e,50);extraOk=m!=null&&e[e.length-1]>m;}
  parts.extra=extraOk;
  parts.news=gateNewsOK();
  const score=(parts.ma200?2:0)+(parts.ma50?1:0)+(parts.golden?1:0)+(parts.breadth?1:0)+(parts.extra?1:0)+(parts.news?1:0);
  const regime=score>=6?3:score>=4?2:score>=2?1:0;
  const g=[0,0.3,0.6,1.0][regime];
  const exposure=[0,30,60,100][regime];
  const out={ts:Date.now(),score,regime,g,exposure,parts,extraKey:cfg.extraKey};
  localStorage.setItem(key,JSON.stringify(out));
  GATE[market]=out;
  return out;
}

/* --------- تفضيلات المستخدم --------- */
function trPrefs(){
  try{return Object.assign({horizon:"m",capital:100000,sentStock:0,sentSector:0,veto:"",cat:""},JSON.parse(localStorage.getItem("fv_trade_prefs")||"{}"));}
  catch(e){return {horizon:"m",capital:100000,sentStock:0,sentSector:0,veto:"",cat:""};}
}
function trSavePrefs(p){localStorage.setItem("fv_trade_prefs",JSON.stringify(p));}
function trReadPrefs(){
  const p=trPrefs();
  const g=id=>document.getElementById(id);
  if(g("tr_horizon"))p.horizon=g("tr_horizon").value;
  if(g("tr_capital"))p.capital=Math.max(1000,parseFloat(g("tr_capital").value)||100000);
  if(g("tr_sent_stock"))p.sentStock=trClamp(parseFloat(g("tr_sent_stock").value)||0,-1,1);
  if(g("tr_sent_sector"))p.sentSector=trClamp(parseFloat(g("tr_sent_sector").value)||0,-1,1);
  if(g("tr_veto"))p.veto=g("tr_veto").value;
  if(g("tr_cat"))p.cat=g("tr_cat").value;
  trSavePrefs(p);
  return p;
}

/* --------- الدرجة المركّبة وخطة الصفقة --------- */
const TR_WEIGHTS={m:{F:.30,V:.30,M:.15,N:.15,L:.10},q:{F:.20,V:.40,M:.20,N:.15,L:.05}};
function buildTrade(c,pkg,gate,p){
  const T=trs();
  const cl=c.price_history,h=c.highs||cl,l=c.lows||cl,v=c.vols||cl.map(()=>0);
  const price=c.price;
  const atrS=trATRseries(h,l,cl),atr=atrS?atrS[atrS.length-1]:price*0.02;
  const adx=trADX(h,l,cl);
  const s200=sma(cl,200),e50s=emaSeries(cl,50),e200s=emaSeries(cl,200);
  const e50=e50s?e50s[e50s.length-1]:null,e200=e200s?e200s[e200s.length-1]:null;
  const r=rsiW(cl),macd=macdHist(cl);
  // VCP مبسّط: ATR الحالي < 85٪ من متوسطه قبل 40–60 جلسة + نطاق 60 جلسة < 25٪
  let vcp=false;
  if(atrS&&atrS.length>60){
    const recent=atrS.slice(-10).reduce((x,y)=>x+y,0)/10;
    const older=atrS.slice(-60,-40).reduce((x,y)=>x+y,0)/20;
    const rng=(Math.max(...cl.slice(-60))-Math.min(...cl.slice(-60)))/price;
    vcp=recent<0.85*older&&rng<0.25;
  }
  // VWAP-20 تقريبي (بيانات يومية)
  let vwap20=null;
  if(cl.length>=20&&v.some(x=>x>0)){
    let pv=0,vv=0;
    for(let i=cl.length-20;i<cl.length;i++){const tp=(h[i]+l[i]+cl[i])/3;pv+=tp*v[i];vv+=v[i];}
    vwap20=vv>0?pv/vv:null;
  }
  const fc=[
    s200!=null&&price>s200,
    e50!=null&&e200!=null&&e50>e200,
    adx!=null&&adx>25,
    r!=null&&r>=50&&r<=70,
    macd!=null&&macd>0,
    vcp,
    vwap20!=null?price>vwap20:price>(sma(cl,20)||price),
  ];
  const F=fc.filter(Boolean).length/7;
  const V=trClamp(pkg.upside,0,0.40)/0.40;
  const mom=mom121(cl);
  const m1=mom!=null?trClamp((mom+0.10)/0.60,0,1):0.5;
  let m2=0.5;
  if(c.bench_closes&&c.bench_closes.length>63&&cl.length>63){
    const b=c.bench_closes;
    const rsSpread=(cl[cl.length-1]/cl[cl.length-63]-1)-(b[b.length-1]/b[b.length-63]-1);
    m2=trClamp((rsSpread+0.15)/0.30,0,1);
  }
  const M=(m1+m2)/2;
  let N=(p.sentStock*0.6+p.sentSector*0.4+1)/2;
  if(p.cat)N=trClamp(N+0.15,0,1);
  // RVOL: حجم آخر جلسة / متوسط 20 (باستثنائها)
  let rvol=null,L=0.3;
  if(v.length>21&&v[v.length-1]>0){
    const avg=v.slice(-21,-1).reduce((x,y)=>x+y,0)/20;
    if(avg>0){rvol=v[v.length-1]/avg;L=trClamp((rvol-1)/2,0,1);}
  }
  const w=TR_WEIGHTS[p.horizon]||TR_WEIGHTS.m;
  const g=gate?gate.g:0.6;
  const vetoed=!!p.veto;
  const raw=w.F*F+w.V*V+w.M*M+w.N*N+w.L*L;
  const score=vetoed?0:raw*g;
  let sig,cls;
  if(vetoed){sig=T.sigs.vetoed;cls="sell";}
  else if(gate&&gate.regime===0){sig=T.sigs.cash;cls="sell";}
  else if(score>=0.70){sig=T.sigs.strong;cls="buy";}
  else if(score>=0.55){sig=T.sigs.buy;cls="buy";}
  else if(score>=0.40){sig=T.sigs.watch;cls="hold";}
  else{sig=T.sigs.avoid;cls="sell";}
  // خطة الصفقة
  const don20h=Math.max(...h.slice(-20)),don20l=Math.min(...l.slice(-20));
  const don55h=Math.max(...h.slice(-55));
  let entry,stop;
  if(p.horizon==="q"){
    entry=Math.max(price,don55h);
    stop=Math.min(don20l,entry-2*atr);
  }else{
    entry=Math.max(price,don20h);
    stop=Math.max(don20l-0.5*atr,entry*0.92);
  }
  if(stop>=entry)stop=entry*0.95;
  const risk=entry-stop;
  const target=entry+2*risk;
  let shares=Math.floor(p.capital*0.015/risk);
  const half=score<0.70&&score>=0.55;
  if(half)shares=Math.floor(shares/2);
  if(shares*entry>0.15*p.capital)shares=Math.floor(0.15*p.capital/entry);
  return {F,V,M,N,L,fc,score,raw,g,sig,cls,vetoed,half,
          atr,adx,rvol,don20h,don20l,don55h,vwap20,
          entry,stop,target,risk,shares,posVal:shares*entry,riskAmt:shares*risk,
          brokeOut:price>= (p.horizon==="q"?don55h:don20h)};
}

/* --------- العرض --------- */
function trEnsureSection(){
  if(document.getElementById("sec-trade"))return;
  const st=document.createElement("style");
  st.textContent=`
  #sec-trade .tgrid{display:grid;grid-template-columns:1fr 1fr;gap:18px}
  @media(max-width:900px){#sec-trade .tgrid{grid-template-columns:1fr}}
  .tbox{background:var(--surface2);border:1px solid var(--border);border-radius:12px;padding:16px}
  .tgate-score{font-family:var(--mono);font-size:38px;font-weight:700;direction:ltr}
  .tcond{display:flex;gap:8px;align-items:center;font-size:12.5px;margin:5px 0;color:var(--muted)}
  .tcond.ok{color:var(--green)}
  .tbar-row{display:flex;align-items:center;gap:10px;margin:7px 0;font-size:12.5px}
  .tbar-row .lbl{width:170px;color:var(--muted);flex-shrink:0}
  .tbar{flex:1;height:10px;background:#0d1526;border-radius:5px;overflow:hidden;direction:ltr}
  .tbar i{display:block;height:100%;border-radius:5px;background:var(--blue)}
  .tbar-row .val{font-family:var(--mono);width:42px;direction:ltr}
  .tgauge{position:relative;height:16px;background:linear-gradient(90deg,rgba(225,73,83,.35),rgba(216,169,61,.35) 47%,rgba(39,168,118,.35) 66%);border-radius:8px;direction:ltr;margin:8px 0 4px}
  .tgauge .needle{position:absolute;top:-4px;width:4px;height:24px;background:var(--text);border-radius:2px}
  .tgauge .th{position:absolute;top:0;bottom:0;width:1.5px;background:rgba(232,237,247,.4)}
  .tlv{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-top:10px}
  .tlv .cell{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:10px;text-align:center}
  .tlv .cell .k{font-size:11px;color:var(--muted)}
  .tlv .cell .v{font-family:var(--mono);font-size:19px;font-weight:700;margin-top:3px;direction:ltr}
  .tctl{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;margin-top:12px}
  .tctl label{display:block;font-size:11px;color:var(--muted);margin-bottom:4px}
  .tctl input,.tctl select{width:100%;font-family:var(--mono);font-size:13px;direction:ltr}
  .tctl select{font-family:var(--font);direction:inherit}
  .tsig{font-size:17px;font-weight:800;padding:8px 22px;border-radius:10px;display:inline-block}
  .tmeta{font-size:12px;color:var(--muted);margin-top:8px;line-height:1.9}
  `;
  document.head.appendChild(st);
  const sec=document.createElement("section");
  sec.id="sec-trade";
  const anchor=document.getElementById("trAnchor")||document.getElementById("sec-fc");
  if(anchor.id==="trAnchor")anchor.appendChild(sec);
  else anchor.insertAdjacentElement("afterend",sec);
}
function trGateHtml(gate,market){
  const T=trs();
  if(!gate)return `<div class="tbox"><b>${T.gateTitle}</b><div style="margin-top:8px;color:var(--muted);font-size:13px">${T.gateLoading}</div></div>`;
  const P=gate.parts;
  const cond=(ok,label)=>`<div class="tcond ${ok?"ok":""}">${ok?"✓":"✗"} ${label}</div>`;
  const extraLbl=T.conds[gate.extraKey]||T.conds.brent;
  return `<div class="tbox">
    <div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:8px">
      <b>${T.gateTitle} — ${S.markets[market]}</b>
      <button class="btn-ghost" style="padding:4px 12px;font-size:12px" onclick="trRefreshGate()">${T.refresh} ⟳</button>
    </div>
    <div style="display:flex;gap:20px;align-items:center;flex-wrap:wrap;margin-top:6px">
      <div><span class="tgate-score" style="color:${["var(--red)","var(--gold)","var(--gold)","var(--green)"][gate.regime]}">${gate.score}</span> <span style="color:var(--muted);font-size:12px">${T.gateOf}</span></div>
      <div style="flex:1;min-width:180px">
        <div style="font-weight:700;font-size:14px">${T.regimes[gate.regime]}</div>
        <div style="font-size:12px;color:var(--muted)">${T.exposure}: <b class="num">${gate.exposure}%</b> · ${T.gMult}: <b class="num">${gate.g.toFixed(1)}</b></div>
      </div>
    </div>
    <div style="margin-top:8px">
      ${cond(P.ma200,T.conds.ma200)}${cond(P.ma50,T.conds.ma50)}${cond(P.golden,T.conds.golden)}
      ${cond(P.breadth,T.conds.breadth+(P.breadthPct!=null?` — <span class="num">${P.breadthPct}%</span>`:""))}
      ${cond(P.extra,extraLbl)}${cond(P.news,T.conds.news)}
    </div>
    <label style="display:flex;gap:8px;align-items:center;font-size:11.5px;color:var(--muted);margin-top:8px;cursor:pointer">
      <input type="checkbox" ${gateNewsOK()?"checked":""} onchange="trToggleNews(this.checked)" style="width:auto">
      ${T.newsToggle}
    </label>
    <div style="font-size:11px;color:var(--faint);margin-top:6px">${T.gateUpd}${new Date(gate.ts).toLocaleString(LANG==="ar"?"ar-SA-u-nu-latn":"en-GB")}</div>
  </div>`;
}
function trToggleNews(ok){
  localStorage.setItem("fv_gate_news",ok?"1":"0");
  ["SA","US"].forEach(m=>{
    const key="fv_gate_"+m;
    try{const c=JSON.parse(localStorage.getItem(key));if(c){localStorage.removeItem(key);}}catch(e){}
  });
  if(CUR)trRefreshGate();
}
async function trRefreshGate(){
  if(!CUR)return;
  const market=CUR.c.market;
  GATE[market]=null;
  localStorage.removeItem("fv_gate_"+market);
  const gb=document.getElementById("trGate");
  if(gb)gb.innerHTML=trGateHtml(null,market);
  try{await computeGate(market,true);}catch(e){
    if(gb)gb.innerHTML=`<div class="tbox"><b>${trs().gateTitle}</b><div style="color:var(--red);font-size:13px;margin-top:8px">${trs().gateFail}</div></div>`;
    return;
  }
  renderTrading();
}
function trBar(label,val,weight,color){
  return `<div class="tbar-row"><span class="lbl">${label} <span class="w-badge">${Math.round(weight*100)}%</span></span>
    <div class="tbar"><i style="width:${Math.round(val*100)}%;background:${color||"var(--blue)"}"></i></div>
    <span class="val">${val.toFixed(2)}</span></div>`;
}
function renderTrading(){
  if(!CUR)return;
  trEnsureSection();
  const T=trs(),c=CUR.c,pkg=CUR.pkg,p=trPrefs();
  const market=c.market,gate=GATE[market];
  const tr=buildTrade(c,pkg,gate,p);
  const sec=document.getElementById("sec-trade");
  const optSel=(id,opts,none,val)=>`<select id="${id}" onchange="trApply()"><option value="">${none}</option>${Object.entries(opts).map(([k,l])=>`<option value="${k}" ${val===k?"selected":""}>${l}</option>`).join("")}</select>`;
  const premium=isPremium();
  const sigCls=tr.cls==="buy"?"tag-buy":tr.cls==="sell"?"tag-sell":"tag-hold";
  const lock=!premium?`<div class="lock-overlay"><div class="lk">🔒</div><p>${T.lockP}</p><button class="btn-run" onclick="openSub()">${T.lockBtn}</button></div>`:"";
  sec.innerHTML=`
  <div class="sec-head"><h2>${T.sec}<span class="n">${T.n}</span></h2><div class="sub">${T.sub}</div></div>
  <div id="trGate">${trGateHtml(gate,market)}</div>
  <div class="tctl">
    <div><label>${T.horizon}</label><select id="tr_horizon" onchange="trApply()">
      <option value="m" ${p.horizon==="m"?"selected":""}>${T.hm}</option>
      <option value="q" ${p.horizon==="q"?"selected":""}>${T.hq}</option>
      <option value="d" disabled>${T.hd}</option></select></div>
    <div><label>${T.capital}</label><input id="tr_capital" type="number" step="1000" value="${p.capital}" onchange="trApply()"></div>
    <div><label>${T.sentStock}</label><input id="tr_sent_stock" type="number" step="0.1" min="-1" max="1" value="${p.sentStock}" onchange="trApply()"></div>
    <div><label>${T.sentSector}</label><input id="tr_sent_sector" type="number" step="0.1" min="-1" max="1" value="${p.sentSector}" onchange="trApply()"></div>
    <div><label>${T.veto}</label>${optSel("tr_veto",T.vetoOpts,T.vetoNone,p.veto)}</div>
    <div><label>${T.cat}</label>${optSel("tr_cat",T.catOpts,T.catNone,p.cat)}</div>
  </div>
  <div class="tgrid" style="margin-top:14px">
    <div class="tbox">
      <b>${T.score}</b>
      <div style="display:flex;gap:14px;align-items:baseline;margin-top:4px">
        <span class="tgate-score" style="font-size:32px">${tr.score.toFixed(2)}</span>
        <span style="font-size:12px;color:var(--muted)">${T.conf}: <b class="num">${tr.fc.filter(Boolean).length}/7</b> · G=${tr.g.toFixed(1)}</span>
      </div>
      <div class="tgauge"><span class="th" style="left:40%"></span><span class="th" style="left:55%"></span><span class="th" style="left:70%"></span>
        <span class="needle" style="left:calc(${Math.round(trClamp(tr.score,0,1)*100)}% - 2px)"></span></div>
      ${trBar(T.comps.F,tr.F,TR_WEIGHTS[p.horizon==="q"?"q":"m"].F,"#5B8DEF")}
      ${trBar(T.comps.V,tr.V,TR_WEIGHTS[p.horizon==="q"?"q":"m"].V,"#B98328")}
      ${trBar(T.comps.M,tr.M,TR_WEIGHTS[p.horizon==="q"?"q":"m"].M,"#9B7BE8")}
      ${trBar(T.comps.N,tr.N,TR_WEIGHTS[p.horizon==="q"?"q":"m"].N,"#27A876")}
      ${trBar(T.comps.L,tr.L,TR_WEIGHTS[p.horizon==="q"?"q":"m"].L,"#E14953")}
      <div class="tmeta">${T.fconds.map((f,i)=>`<span style="color:${tr.fc[i]?"var(--green)":"var(--faint)"}">${tr.fc[i]?"✓":"✗"} ${f}</span>`).join(" · ")}</div>
      <div class="tmeta">${T.atr}: <b class="num">${fmt(tr.atr)}</b> · ${T.adx}: <b class="num">${tr.adx!=null?tr.adx.toFixed(1):"—"}</b> · ${T.rvol}: <b class="num">${tr.rvol!=null?tr.rvol.toFixed(2):"—"}</b> · ${T.don20}: <span class="num">${fmt(tr.don20h)} / ${fmt(tr.don20l)}</span> · ${T.don55}: <span class="num">${fmt(tr.don55h)}</span></div>
    </div>
    <div class="tbox" style="position:relative;overflow:hidden">
      <b>${T.signal} — ${T.levels}</b>
      <div style="margin:10px 0"><span class="tsig ${sigCls}">${tr.sig}</span></div>
      <div class="tlv">
        <div class="cell"><div class="k">${T.entry}</div><div class="v" style="color:var(--blue)">${fmt(tr.entry)}</div></div>
        <div class="cell"><div class="k">${T.stop}</div><div class="v" style="color:var(--red)">${fmt(tr.stop)}</div></div>
        <div class="cell"><div class="k">${T.target}</div><div class="v" style="color:var(--green)">${fmt(tr.target)}</div></div>
        <div class="cell"><div class="k">${T.size}</div><div class="v" style="color:var(--gold)">${tr.shares.toLocaleString("en-US")}</div><div class="k">${T.shares}</div></div>
        <div class="cell"><div class="k">${T.posVal}</div><div class="v">${fmt(tr.posVal,0)}</div></div>
        <div class="cell"><div class="k">${T.riskAmt}</div><div class="v">${fmt(tr.riskAmt,0)}</div></div>
      </div>
      <div class="tmeta">
        ${tr.brokeOut?("• "+T.brokeOut+"<br>"):""}
        • ${T.entry}: ${T.entryNote(p.horizon)}<br>
        • ${T.stop}: ${T.stopNote(p.horizon)} — <span class="num">${fmtPct(tr.stop/tr.entry-1)}</span><br>
        • ${T.target}: ${T.targetNote}<br>
        • ${T.timeStop}<br>
        • ${T.rules}
      </div>
      ${lock}
    </div>
  </div>
  <div class="warn" style="margin-top:12px">${T.disc}</div>`;
  if(!gate)computeGate(market).then(()=>renderTrading()).catch(()=>{
    const gb=document.getElementById("trGate");
    if(gb)gb.innerHTML=`<div class="tbox"><b>${T.gateTitle}</b><div style="color:var(--red);font-size:13px;margin-top:8px">${T.gateFail}</div></div>`;
  });
}
function trApply(){trReadPrefs();renderTrading();}
