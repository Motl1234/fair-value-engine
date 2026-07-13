// Fair Value Engine — Yahoo Finance proxy (no API keys)
// Routes:
//   /api/summary?symbol=2222.SR   → quoteSummary (price, keyStats, financialData, profile, earningsTrend, summaryDetail)
//   /api/chart?symbol=2222.SR&range=2y&interval=1d
//   /api/fundamentals?symbol=2222.SR → annual EBIT/EBITDA/FCF/OCF/Capex/D&A/Revenue/NetIncome timeseries

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

let auth = { cookie: null, crumb: null, ts: 0 };

async function getAuth(force) {
  if (!force && auth.crumb && Date.now() - auth.ts < 25 * 60 * 1000) return auth;
  const r1 = await fetch("https://fc.yahoo.com/", { headers: { "User-Agent": UA }, redirect: "manual" });
  const setCookie = r1.headers.get("set-cookie") || "";
  const cookie = setCookie.split(";")[0];
  const r2 = await fetch("https://query1.finance.yahoo.com/v1/test/getcrumb", {
    headers: { "User-Agent": UA, Cookie: cookie },
  });
  const crumb = (await r2.text()).trim();
  auth = { cookie, crumb, ts: Date.now() };
  return auth;
}

async function yahooJson(url, useAuth) {
  const headers = { "User-Agent": UA, Accept: "application/json" };
  let target = url;
  if (useAuth) {
    const a = await getAuth(false);
    headers.Cookie = a.cookie;
    target = url + (url.includes("?") ? "&" : "?") + "crumb=" + encodeURIComponent(a.crumb);
  }
  let r = await fetch(target, { headers });
  for (let i = 0; i < 2 && useAuth && (r.status === 401 || r.status === 403); i++) {
    if (i) await new Promise(res => setTimeout(res, 350));
    const a = await getAuth(true); // تحديث الكوكي والـ crumb
    headers.Cookie = a.cookie;
    target = url + (url.includes("?") ? "&" : "?") + "crumb=" + encodeURIComponent(a.crumb);
    r = await fetch(target, { headers });
  }
  const body = await r.text();
  return new Response(body, {
    status: r.status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=600", ...CORS },
  });
}

const FUND_TYPES = [
  "annualEBIT", "annualEBITDA", "annualFreeCashFlow", "annualOperatingCashFlow",
  "annualCapitalExpenditure", "annualDepreciationAndAmortization", "annualReconciledDepreciation",
  "annualTotalRevenue", "annualNetIncome", "annualDilutedEPS", "annualStockholdersEquity",
  "annualTotalDebt", "annualCashAndCashEquivalents", "annualInterestExpense",
  "annualOrdinarySharesNumber", "annualShareIssued", "annualBasicAverageShares", "annualDilutedAverageShares",
].join(",");

const JSON_HDRS = { "Content-Type": "application/json; charset=utf-8", ...CORS };

async function hmacHex(secret, msg) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(msg));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, "0")).join("");
}
// صيغة الشفرة: FV-<أيام الانتهاء base36>-<عشوائي 5>-<توقيع 10>
async function makeCode(env, months) {
  const expDays = Math.floor(Date.now() / 86400000) + Math.round(months * 30);
  const nonce = [...crypto.getRandomValues(new Uint8Array(3))].map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 5).toUpperCase();
  const sig = (await hmacHex(env.CODE_SECRET, expDays + "|" + nonce)).slice(0, 10).toUpperCase();
  return { code: `FV-${expDays.toString(36).toUpperCase()}-${nonce}-${sig}`, expires: new Date(expDays * 86400000).toISOString().slice(0, 10) };
}
async function verifyCode(env, code) {
  const m = /^FV-([0-9A-Z]+)-([0-9A-F]{5})-([0-9A-F]{10})$/i.exec((code || "").trim());
  if (!m) return { ok: false, reason: "صيغة غير صحيحة" };
  const expDays = parseInt(m[1], 36);
  if (!isFinite(expDays)) return { ok: false, reason: "صيغة غير صحيحة" };
  const sig = (await hmacHex(env.CODE_SECRET, expDays + "|" + m[2].toUpperCase())).slice(0, 10).toUpperCase();
  if (sig !== m[3].toUpperCase()) return { ok: false, reason: "شفرة غير صالحة" };
  if (Date.now() > expDays * 86400000) return { ok: false, reason: "شفرة منتهية" };
  return { ok: true, expires: new Date(expDays * 86400000).toISOString().slice(0, 10) };
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

    // الاشتراكات
    if (url.pathname === "/api/activate") {
      const res = await verifyCode(env, url.searchParams.get("code"));
      return new Response(JSON.stringify(res), { status: res.ok ? 200 : 400, headers: JSON_HDRS });
    }
    if (url.pathname === "/api/gencode") {
      if (url.searchParams.get("admin") !== env.ADMIN_KEY || !env.ADMIN_KEY) {
        return new Response(JSON.stringify({ error: "غير مصرح" }), { status: 403, headers: JSON_HDRS });
      }
      const months = Math.min(Math.max(parseFloat(url.searchParams.get("months") || "1"), 0.1), 24);
      const out = await makeCode(env, months);
      return new Response(JSON.stringify(out), { headers: JSON_HDRS });
    }

    const symbol = (url.searchParams.get("symbol") || "").trim().toUpperCase();
    if (!symbol || !/^[A-Z0-9.\-^=]{1,12}$/.test(symbol)) {
      return new Response(JSON.stringify({ error: "symbol مطلوب" }), { status: 400, headers: { "Content-Type": "application/json", ...CORS } });
    }
    const enc = encodeURIComponent(symbol);

    try {
      if (url.pathname === "/api/summary") {
        const modules = "price,summaryDetail,defaultKeyStatistics,financialData,summaryProfile,earningsTrend";
        return await yahooJson(
          `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${enc}?modules=${modules}&formatted=false`,
          true
        );
      }
      if (url.pathname === "/api/chart") {
        const range = url.searchParams.get("range") || "2y";
        const interval = url.searchParams.get("interval") || "1d";
        return await yahooJson(
          `https://query1.finance.yahoo.com/v8/finance/chart/${enc}?range=${encodeURIComponent(range)}&interval=${encodeURIComponent(interval)}&events=div`,
          false
        );
      }
      if (url.pathname === "/api/fundamentals") {
        const now = Math.floor(Date.now() / 1000);
        const p1 = now - 6 * 365 * 24 * 3600;
        return await yahooJson(
          `https://query2.finance.yahoo.com/ws/fundamentals-timeseries/v1/finance/timeseries/${enc}?type=${FUND_TYPES}&period1=${p1}&period2=${now}&merge=false`,
          false
        );
      }
      return new Response(JSON.stringify({ ok: true, service: "fair-value-proxy" }), { headers: { "Content-Type": "application/json", ...CORS } });
    } catch (e) {
      return new Response(JSON.stringify({ error: String(e && e.message || e) }), { status: 502, headers: { "Content-Type": "application/json", ...CORS } });
    }
  },
};
