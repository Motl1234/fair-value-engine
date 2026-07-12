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
  if (useAuth && (r.status === 401 || r.status === 403)) {
    const a = await getAuth(true); // refresh crumb once
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
].join(",");

export default {
  async fetch(req) {
    const url = new URL(req.url);
    if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

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
