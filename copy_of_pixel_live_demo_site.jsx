import React, { useMemo, useState, useEffect } from "react";

/**
 * PIXEL CREATIVE STUDIO — Internal Projection Console (JSX only)
 * --------------------------------------------------------------
 * INTERNAL-ONLY live calculator for prospect calls.
 * No forms, no CTAs, no calendar — just math you control.
 *
 * Default: Metro-linked ACV
 * - Each metro carries an average home value.
 * - ACV is always derived from metroAvgPrice × Commission Rate (default 2.5%).
 * - Manual override removed for simplicity.
 *
 * Panels:
 * - Pixel vs Competitor Calculator (city multipliers, funded cap, efficiency, appointment rate)
 * - ROI Snapshot (Appointments -&gt; Closed -&gt; Revenue, Cost of Waiting)
 * - Screen-share Summary (read-only JSON)
 * - Glossary legend
 * - Test harness (console.assert)
 *
 * Notes:
 * - Plain React (no TypeScript). ASCII quotes only. Any '>' in text is escaped as &gt;.
 * - Funded media (PMC+GPC) default cap = $1,300, editable.
 */

// ---------------- City table ----------------
// mult = relative CPL multiplier; avg = rough metro average home value (USD)
const CITY_TABLE = [
  { city: "New York, NY", mult: 1.35, avg: 700000 },
  { city: "San Francisco, CA", mult: 1.35, avg: 1200000 },
  { city: "Los Angeles, CA", mult: 1.3, avg: 900000 },
  { city: "Miami, FL", mult: 1.3, avg: 600000 },
  { city: "Boston, MA", mult: 1.3, avg: 800000 },
  { city: "Washington, DC", mult: 1.3, avg: 750000 },
  { city: "San Jose, CA", mult: 1.3, avg: 1300000 },
  { city: "Seattle, WA", mult: 1.25, avg: 850000 },
  { city: "San Diego, CA", mult: 1.25, avg: 900000 },
  { city: "Austin, TX", mult: 1.2, avg: 480000 },
  { city: "Denver, CO", mult: 1.2, avg: 550000 },
  { city: "Chicago, IL", mult: 1.2, avg: 360000 },
  { city: "Philadelphia, PA", mult: 1.2, avg: 350000 },
  { city: "Portland, OR", mult: 1.2, avg: 525000 },
  { city: "Phoenix, AZ", mult: 1.2, avg: 450000 },
  { city: "Dallas, TX", mult: 1.15, avg: 420000 },
  { city: "Atlanta, GA", mult: 1.15, avg: 400000 },
  { city: "Tampa, FL", mult: 1.15, avg: 380000 },
  { city: "Charlotte, NC", mult: 1.15, avg: 380000 },
  { city: "Nashville, TN", mult: 1.15, avg: 475000 },
  { city: "Orlando, FL", mult: 1.15, avg: 380000 },
  { city: "Houston, TX", mult: 1.0, avg: 330000 },
  { city: "Minneapolis, MN", mult: 1.0, avg: 370000 },
  { city: "Raleigh, NC", mult: 1.0, avg: 420000 },
  { city: "Salt Lake City, UT", mult: 1.0, avg: 500000 },
  { city: "Las Vegas, NV", mult: 1.0, avg: 430000 },
  { city: "San Antonio, TX", mult: 1.0, avg: 320000 },
  { city: "Columbus, OH", mult: 1.0, avg: 300000 },
  { city: "Indianapolis, IN", mult: 1.0, avg: 290000 },
  { city: "Cincinnati, OH", mult: 1.0, avg: 285000 },
  { city: "Kansas City, MO", mult: 1.0, avg: 310000 },
  { city: "St. Louis, MO", mult: 1.0, avg: 280000 },
  { city: "Oklahoma City, OK", mult: 0.9, avg: 260000 },
  { city: "Jacksonville, FL", mult: 0.9, avg: 325000 },
  { city: "Cleveland, OH", mult: 0.9, avg: 220000 },
  { city: "Pittsburgh, PA", mult: 0.9, avg: 275000 },
  { city: "Milwaukee, WI", mult: 0.9, avg: 285000 },
  { city: "San Juan, PR", mult: 0.85, avg: 300000 },
];

const money = (x) => `$${Number.isFinite(x) ? (Math.round(x * 100) / 100).toLocaleString() : "0.00"}`;

// ---------------- Calculator logic ----------------
function useCalculator() {
  const [city, setCity] = useState(CITY_TABLE[0].city);
  const [channel, setChannel] = useState("meta"); // 'meta' | 'google'
  const [spend, setSpend] = useState(1000);
  const [pmc, setPmc] = useState(500); // Pixel Media Credit
  const [gpc, setGpc] = useState(0); // Growth Partner Credit
  const [apptRate, setApptRate] = useState(0.2); // appointment rate (leads -> appts)
  const [uplift, setUplift] = useState(0.15); // 15% lower CPL vs competitor
  const [baseMeta, setBaseMeta] = useState(16);
  const [baseGoogle, setBaseGoogle] = useState(85);

  // --- ACV / Revenue params ---
  const [commissionRate, setCommissionRate] = useState(0.025); // 2.5%

  const [closeRate, setCloseRate] = useState(0.25); // % appointments that close
  const [fundedCap, setFundedCap] = useState(1300);

  // Compute metro average price for selected city
  const metro = useMemo(() => CITY_TABLE.find((c) => c.city === city) || { mult: 1, avg: 350000 }, [city]);

  // Derived ACV (always linked)
  const acv = useMemo(() => metro.avg * commissionRate, [metro.avg, commissionRate]);

  const out = useMemo(() => {
    const baseCpl = (channel === "meta" ? baseMeta : baseGoogle) * metro.mult;
    const competitorCpl = baseCpl;
    const pixelCpl = competitorCpl * (1 - uplift);
    const funded = Math.min(fundedCap, Math.max(0, pmc) + Math.max(0, gpc));
    const pixelBudget = Math.max(0, spend) + funded;

    const competitorLeads = spend > 0 && competitorCpl > 0 ? spend / competitorCpl : 0;
    const pixelLeads = pixelBudget > 0 && pixelCpl > 0 ? pixelBudget / pixelCpl : 0;

    const competitorAppts = competitorLeads * apptRate;
    const pixelAppts = pixelLeads * apptRate;

    const competitorCpa = competitorAppts > 0 ? spend / competitorAppts : 0;
    const pixelCpa = pixelAppts > 0 ? pixelBudget / pixelAppts : 0;

    const competitorClosed = competitorAppts * closeRate;
    const pixelClosed = pixelAppts * closeRate;
    const competitorRevenue = competitorClosed * acv;
    const pixelRevenue = pixelClosed * acv;

    const costOfWaiting = pixelRevenue; // opportunity cost of delaying 30 days

    return {
      competitorCpl,
      pixelCpl,
      funded,
      pixelBudget,
      competitorLeads,
      pixelLeads,
      competitorAppts,
      pixelAppts,
      competitorCpa,
      pixelCpa,
      competitorClosed,
      pixelClosed,
      competitorRevenue,
      pixelRevenue,
      costOfWaiting,
      deltaAppts: pixelAppts - competitorAppts,
      deltaRevenue: pixelRevenue - competitorRevenue,
      acv,
    };
  }, [metro.mult, channel, spend, pmc, gpc, apptRate, uplift, baseMeta, baseGoogle, acv, closeRate, fundedCap]);

  return {
    state: { city, channel, spend, pmc, gpc, apptRate, uplift, baseMeta, baseGoogle, commissionRate, closeRate, fundedCap },
    derived: { acv, metroAvg: metro.avg, metroMult: metro.mult },
    set: { setCity, setChannel, setSpend, setPmc, setGpc, setApptRate, setUplift, setBaseMeta, setBaseGoogle, setCommissionRate, setCloseRate, setFundedCap },
    out,
  };
}

// ---------------- UI atoms ----------------
function Field({ label, children, hint }) {
  return (
    <label className="block text-sm font-medium text-zinc-700 mb-1">
      {label}
      <div className="mt-1">{children}</div>
      {hint && <div className="text-xs text-zinc-500 mt-1">{hint}</div>}
    </label>
  );
}

function Stat({ label, value, highlight = false }) {
  return (
    <div className={`p-4 rounded-2xl border ${highlight ? "bg-zinc-50" : "bg-white"}`}>
      <div className="text-xs uppercase tracking-wide text-zinc-500">{label}</div>
      <div className="text-xl font-semibold mt-1">{value}</div>
    </div>
  );
}

// ---------------- Calculator panel ----------------
function Calculator() {
  const {
    state: { city, channel, spend, pmc, gpc, apptRate, uplift, baseMeta, baseGoogle, commissionRate, closeRate, fundedCap },
    set: { setCity, setChannel, setSpend, setPmc, setGpc, setApptRate, setUplift, setBaseMeta, setBaseGoogle, setCommissionRate, setCloseRate, setFundedCap },
    derived: { acv, metroAvg, metroMult },
    out,
  } = useCalculator();

  return (
    <section id="calculator" className="relative w-full">
      <div className="grid xl:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="p-6 rounded-2xl border bg-white shadow-sm xl:col-span-2">
          <h3 className="text-xl font-semibold mb-4">Pixel vs Competitor Calculator (Internal)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Metro" hint="Market where ads run; affects CPL via multiplier and ACV via home price.">
              <select className="w-full rounded-xl border px-3 py-2" value={city} onChange={(e) => setCity(e.target.value)}>
                {CITY_TABLE.map((c) => (
                  <option key={c.city} value={c.city}>{c.city}</option>
                ))}
              </select>
              <div className="mt-2 text-xs text-zinc-500">Metro avg price: {money(metroAvg)}; CPL mult: ×{metroMult.toFixed(2)}</div>
            </Field>
            <Field label="Channel" hint="Meta (FB/IG) or Google Search.">
              <select className="w-full rounded-xl border px-3 py-2" value={channel} onChange={(e) => setChannel(e.target.value)}>
                <option value="meta">Meta (FB/IG)</option>
                <option value="google">Google Search</option>
              </select>
            </Field>
            <Field label="Monthly Client Spend ($)" hint="Client-paid ad spend per month.">
              <input type="number" className="w-full rounded-xl border px-3 py-2" value={spend} min={0} onChange={(e) => setSpend(parseFloat(e.target.value) || 0)} />
            </Field>
            <Field label="Pixel Media Credit (PMC) ($)" hint="Pixel-funded ad spend applied to campaigns.">
              <input type="number" className="w-full rounded-xl border px-3 py-2" value={pmc} min={0} onChange={(e) => setPmc(parseFloat(e.target.value) || 0)} />
            </Field>
            <Field label="Growth Partner Credit (GPC) ($)" hint="Additional funded media from partners.">
              <input type="number" className="w-full rounded-xl border px-3 py-2" value={gpc} min={0} onChange={(e) => setGpc(parseFloat(e.target.value) || 0)} />
            </Field>
            <Field label="Lead -&gt; Appointment Rate" hint="% of leads that schedule an appointment.">
              <select className="w-full rounded-xl border px-3 py-2" value={apptRate} onChange={(e) => setApptRate(parseFloat(e.target.value))}>
                <option value={0.1}>Conservative (10%)</option>
                <option value={0.2}>Typical (20%)</option>
                <option value={0.27}>Dialed-in (27%)</option>
              </select>
            </Field>
            <Field label="Pixel Efficiency vs Competitor" hint="CPL improvement vs generic vendor.">
              <select className="w-full rounded-xl border px-3 py-2" value={uplift} onChange={(e) => setUplift(parseFloat(e.target.value))}>
                <option value={0}>No improvement</option>
                <option value={0.15}>15% lower CPL</option>
                <option value={0.3}>30% lower CPL</option>
              </select>
            </Field>
            <Field label="Meta Baseline CPL ($)" hint="Typical CPL on Meta before multipliers.">
              <input type="number" className="w-full rounded-xl border px-3 py-2" value={baseMeta} min={1} onChange={(e) => setBaseMeta(parseFloat(e.target.value) || 1)} />
            </Field>
            <Field label="Google Baseline CPL ($)" hint="Typical CPL on Google before multipliers.">
              <input type="number" className="w-full rounded-xl border px-3 py-2" value={baseGoogle} min={1} onChange={(e) => setBaseGoogle(parseFloat(e.target.value) || 1)} />
            </Field>

            <Field label="Commission Rate" hint="Commission applied to metro avg price to compute ACV.">
              <div className="flex items-center gap-2">
                <input type="number" step="0.001" min={0} max={1} className="w-full rounded-xl border px-3 py-2" value={commissionRate} onChange={(e) => setCommissionRate(parseFloat(e.target.value) || 0)} />
                <span className="text-sm text-zinc-600">({(commissionRate*100).toFixed(2)}%)</span>
              </div>
            </Field>
            <Field label="Avg Client Value (ACV) ($)" hint="Derived from metro price × commission (read-only).">
              <input type="number" className="w-full rounded-xl border px-3 py-2" value={Math.round(acv)} disabled />
              <div className="mt-1 text-xs text-zinc-500">{money(metroAvg)} × {(commissionRate*100).toFixed(2)}% = {money(acv)}</div>
            </Field>

            <Field label="% appointments that close" hint="Share of booked appointments that become clients.">
              <input type="number" step="0.01" className="w-full rounded-xl border px-3 py-2" value={closeRate} min={0} max={1} onChange={(e) => setCloseRate(parseFloat(e.target.value) || 0)} />
            </Field>
            <Field label="Funded Cap ($)" hint="Max PMC+GPC used in projections.">
              <input type="number" className="w-full rounded-xl border px-3 py-2" value={fundedCap} min={0} onChange={(e) => setFundedCap(parseFloat(e.target.value) || 0)} />
            </Field>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-5">
            <Stat label="Competitor CPL (est.)" value={money(out.competitorCpl)} />
            <Stat label="Pixel CPL (est.)" value={money(out.pixelCpl)} highlight />
            <Stat label="Funded Media (PMC+GPC)" value={money(out.funded)} />
            <Stat label="Pixel Budget" value={money(out.pixelBudget)} />
            <Stat label="Competitor Leads" value={out.competitorLeads.toFixed(1)} />
            <Stat label="Pixel Leads" value={out.pixelLeads.toFixed(1)} highlight />
            <Stat label={`Appointments @ ${(apptRate * 100).toFixed(0)}% (Competitor)`} value={out.competitorAppts.toFixed(1)} />
            <Stat label={`Appointments @ ${(apptRate * 100).toFixed(0)}% (Pixel)`} value={`${out.pixelAppts.toFixed(1)} (${out.deltaAppts >= 0 ? "+" : ""}${out.deltaAppts.toFixed(1)})`} highlight />
            <Stat label="Competitor Cost / Appt" value={out.competitorCpa ? money(out.competitorCpa) : "—"} />
            <Stat label="Pixel Cost / Appt" value={out.pixelCpa ? money(out.pixelCpa) : "—"} highlight />
          </div>
        </div>

        {/* ROI Snapshot */}
        <div className="p-6 rounded-2xl border bg-white shadow-sm">
          <h3 className="text-xl font-semibold mb-2">ROI Snapshot</h3>
          <p className="text-sm text-zinc-600 mb-4">Revenue math based on Appointments -&gt; Closed -&gt; ACV (average client value).</p>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Closed (Competitor)" value={out.competitorClosed.toFixed(2)} />
            <Stat label="Closed (Pixel)" value={out.pixelClosed.toFixed(2)} highlight />
            <Stat label="Monthly Revenue (Competitor)" value={money(out.competitorRevenue)} />
            <Stat label="Monthly Revenue (Pixel)" value={money(out.pixelRevenue)} highlight />
            <Stat label="Cost of Waiting 30 Days" value={money(out.costOfWaiting)} />
            <Stat label="Delta Revenue (Pixel - Competitor)" value={money(out.deltaRevenue)} highlight />
          </div>
          <p className="text-xs text-zinc-500 mt-4">Adjust commission and close-rate to your niche. ACV is linked to metro average price × commission.</p>
        </div>
      </div>

      {/* Read-only summary card for screen share */}
      <div className="mt-6 p-6 rounded-2xl border bg-white shadow-sm">
        <h3 className="text-lg font-semibold mb-2">Prospect Summary (Display Only)</h3>
        <pre className="text-sm bg-zinc-50 p-3 rounded-xl overflow-x-auto"><code>{JSON.stringify({
          city,
          channel,
          spend,
          funded_media: out.funded,
          competitor: { cpl: out.competitorCpl, leads: out.competitorLeads, appts: out.competitorAppts, cpa: out.competitorCpa, revenue: out.competitorRevenue },
          pixel: { cpl: out.pixelCpl, leads: out.pixelLeads, appts: out.pixelAppts, cpa: out.pixelCpa, revenue: out.pixelRevenue },
          assumptions: { appt_rate: apptRate, acv: out.acv, commission_rate: commissionRate, metro_avg_price: metroAvg, close_rate: closeRate, base_meta_cpl: baseMeta, base_google_cpl: baseGoogle, funded_cap: fundedCap }
        }, null, 2)}</code></pre>
        <p className="text-xs text-zinc-500 mt-2">This block is read-only for screen share. No data is collected from the prospect.</p>
      </div>

      {/* Glossary / Legend */}
      <div className="mt-6 p-6 rounded-2xl border bg-white shadow-sm">
        <h3 className="text-lg font-semibold mb-2">Glossary</h3>
        <ul className="grid md:grid-cols-2 gap-3 text-sm text-zinc-700">
          <li><strong>CPL</strong> — Cost Per Lead. Dollars spent to generate one lead.</li>
          <li><strong>Appointment Rate</strong> — % of leads that book an appointment (Lead -&gt; Appointment).</li>
          <li><strong>CPA</strong> — Cost Per Appointment. Total spend divided by appointments.</li>
          <li><strong>ACV</strong> — Average Client Value. ACV = Metro Avg Price × Commission Rate.</li>
          <li><strong>Close Rate</strong> — % appointments that close into clients (Appointment -&gt; Closed).</li>
          <li><strong>PMC</strong> — Pixel Media Credit. Extra paid media Pixel contributes.</li>
          <li><strong>GPC</strong> — Growth Partner Credit. Additional funded media from partners.</li>
          <li><strong>Funded Cap</strong> — The maximum PMC+GPC allowed in projections.</li>
          <li><strong>Pixel Budget</strong> — Client spend plus funded media used in Pixel projections.</li>
          <li><strong>Efficiency</strong> — Pixel CPL improvement vs competitor (e.g., 15% lower CPL).</li>
          <li><strong>Cost of Waiting</strong> — Estimated monthly revenue forfeited if launch is delayed 30 days.</li>
          <li><strong>Delta Revenue</strong> — Pixel revenue minus competitor revenue for the same period.</li>
        </ul>
      </div>
    </section>
  );
}

// ---------------- Shared section wrapper ----------------
function Section({ id, title, children, kicker }) {
  return (
    <section id={id} className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-10">
      {kicker && <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2">{kicker}</div>}
      <h2 className="text-2xl md:text-3xl font-bold mb-6">{title}</h2>
      {children}
    </section>
  );
}

// ---------------- Root component ----------------
export default function PixelInternalConsole() {
  // Lightweight test harness
  useEffect(() => {
    const approx = (a, b, eps = 1e-6) => Math.abs(a - b) < eps;

    // Test Case 1: Meta, NYC, $1000 spend, 20% rate, 15% uplift, baseMeta=10
    (function () {
      const spend = 1000, rate = 0.2, uplift = 0.15, baseMeta = 10, mult = 1.35;
      const competitorCpl = baseMeta * mult; // 13.5
      const pixelCpl = competitorCpl * (1 - uplift); // 11.475
      const competitorLeads = spend / competitorCpl; // 74.074...
      const pixelLeads = spend / pixelCpl; // 87.167...
      const competitorAppts = competitorLeads * rate; // ~14.8148
      const pixelAppts = pixelLeads * rate; // ~17.4335
      console.assert(approx(Math.round(competitorCpl * 1000) / 1000, 13.5), "TC1 competitorCpl");
      console.assert(approx(Math.round(pixelCpl * 1000) / 1000, 11.475), "TC1 pixelCpl");
      console.assert(approx(Math.round(competitorAppts * 1000) / 1000, 14.815), "TC1 competitorAppts");
      console.assert(approx(Math.round(pixelAppts * 1000) / 1000, 17.434), "TC1 pixelAppts");
    })();

    // Test Case 2: Google baseline city, spend 1500, funded 500, 27% rate, 30% uplift, baseGoogle 100
    (function () {
      const spend = 1500, funded = 500, rate = 0.27, uplift = 0.3, baseGoogle = 100, mult = 1.0;
      const competitorCpl = baseGoogle * mult; // 100
      const pixelCpl = competitorCpl * (1 - uplift); // 70
      const competitorLeads = spend / competitorCpl; // 15
      const pixelLeads = (spend + funded) / pixelCpl; // 28.5714
      const competitorAppts = competitorLeads * rate; // 4.05
      const pixelAppts = pixelLeads * rate; // 7.7143
      console.assert(approx(competitorLeads, 15), "TC2 competitorLeads");
      console.assert(approx(Math.round(pixelLeads * 10000) / 10000, 28.5714), "TC2 pixelLeads");
      console.assert(approx(Math.round(competitorAppts * 100) / 100, 4.05), "TC2 competitorAppts");
      console.assert(approx(Math.round(pixelAppts * 10000) / 10000, 7.7143), "TC2 pixelAppts");
    })();

    // Test Case 3: Zero spend edge case
    (function () {
      const spend = 0, cpl = 50, rate = 0.2;
      const leads = spend / cpl; const appts = leads * rate; const cpa = appts > 0 ? spend / appts : 0;
      console.assert(approx(leads, 0), "TC3 leads");
      console.assert(approx(appts, 0), "TC3 appts");
      console.assert(approx(cpa, 0), "TC3 cpa");
    })();

    // Test Case 4: Funded cap enforcement
    (function () {
      const pmc = 1000, gpc = 800, cap = 1300; // pmc+gpc=1800 but cap=1300
      const effectiveFunded = Math.min(cap, pmc + gpc);
      console.assert(effectiveFunded === 1300, "TC4 funded cap");
    })();

    // Test Case 5: Pixel advantage increases appts vs competitor
    (function () {
      const spend = 1000, baseCpl = 20, mult = 1.0, uplift = 0.3, rate = 0.2;
      const competitorCpl = baseCpl * mult; // 20
      const pixelCpl = competitorCpl * (1 - uplift); // 14
      const competitorAppts = (spend / competitorCpl) * rate; // 10
      const pixelAppts = (spend / pixelCpl) * rate; // 14.2857
      console.assert(pixelAppts > competitorAppts, "TC5 pixel appts > competitor appts");
    })();

    // Test Case 6: Negative funded inputs should clamp to 0
    (function () {
      const pmc = -200, gpc = -50, cap = 1300;
      const funded = Math.min(cap, Math.max(0, pmc) + Math.max(0, gpc));
      console.assert(funded === 0, "TC6 funded clamps non-negative");
    })();

    // Test Case 7: Cost of waiting equals Pixel revenue (by definition here)
    (function () {
      const appts = 10, close = 0.3, acv = 2500;
      const pixelRevenue = appts * close * acv;
      const costOfWaiting = pixelRevenue;
      console.assert(costOfWaiting === pixelRevenue, "TC7 waiting == pixel revenue");
    })();

    // Test Case 8: Metro-linked ACV math
    (function () {
      const metroAvg = 400000, commission = 0.025; // 2.5%
      const acv = metroAvg * commission; // 10,000
      console.assert(acv === 10000, "TC8 ACV link metro × commission");
    })();

    // Test Case 9: Commission tweak changes ACV proportionally
    (function () {
      const metroAvg = 500000, commission = 0.03; // 3%
      const acv = metroAvg * commission; // 15,000
      console.assert(acv === 15000, "TC9 ACV reflects commission change");
    })();

    console.log("Pixel Internal Console: tests executed. If any assertion failed, check math or recent edits.");
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-zinc-50 text-zinc-900">
      <header className="sticky top-0 z-40 backdrop-blur bg-white/75 border-b">
        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="font-bold">PIXEL <span className="text-zinc-400 font-medium">INTERNAL CONSOLE</span></div>
          <div className="text-xs text-zinc-500">No forms. No CTAs. Screen-share only.</div>
        </div>
      </header>

      <Section id="projection" title="Live Projection Calculator" kicker="Internal Use Only">
        <Calculator />
      </Section>

      <footer className="border-t">
        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-8 text-xs text-zinc-500">
          For internal demonstration only. Media credits apply to paid media only and do not reduce service fees. Client retains ownership of ad accounts, creatives, data, and dashboards.
        </div>
      </footer>
    </div>
  );
}
