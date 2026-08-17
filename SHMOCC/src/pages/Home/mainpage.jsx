import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TOKEN_KEY, DASHBOARD_PATH, LOGIN_PATH } from "../../App";

const COMPONENTS = [
  {
    id: "labor",
    index: "01",
    name: "Peeler Dispatch",
    tag: "Labor optimization",
    summary:
      "Genetic-algorithm route planning that matches Kalliya peeler groups to harvest-ready farms.",
  },
  {
    id: "wrr-advisory",
    index: "02",
    name: "Root Rot Advisory",
    tag: "IoT + RAG",
    summary:
      "Soil sensors and a retrieval-augmented knowledge base flag White Root Rot risk before it spreads.",
  },
  {
    id: "plantation-health",
    index: "03",
    name: "Canopy Watch",
    tag: "Satellite monitoring",
    summary:
      "Sentinel-2 NDVI and NDMI time series map stressed plantation zones across Karandeniya.",
  },
  {
    id: "grade-market",
    index: "04",
    name: "Grade & Market",
    tag: "CNN + XGBoost",
    summary:
      "AR bundle capture, mixed-grade detection, and GPS-based profit routing to the best buyer.",
  },
];

// ids that should leave this single-page app entirely and go to a real route,
// instead of just swapping the local "active" tab
const EXTERNAL_ROUTES = {
  "plantation-health": true,
};

const INK = "#2B2620";
const INK_SOFT = "#726A5C";
const PAPER = "#FBF9F5";
const CARD = "#FFFFFF";
const LINE = "#E9E2D6";
const RUST = "#A8571F";
const RUST_SOFT = "#C97A3F";
const MOSS = "#54724F";
const MOSS_BG = "#EEF2E9";
const RUST_BG = "#FBEEE3";

function TopNav({ active, onNavigate }) {
  return (
    <header
      className="sticky top-0 z-10"
      style={{ background: "rgba(251,249,245,0.9)", backdropFilter: "blur(6px)", borderBottom: `1px solid ${LINE}` }}
    >
      <div className="mx-auto flex max-w-[1280px] items-center justify-between px-8 py-5 sm:px-12">
        <button
          onClick={() => onNavigate("home")}
          className="font-serif text-lg tracking-wide"
          style={{ color: INK }}
        >
          Ceylon Cinnamon <span style={{ color: RUST }}>· Intelligence</span>
        </button>

        <nav className="hidden gap-1 md:flex">
          {COMPONENTS.map((c) => (
            <button
              key={c.id}
              onClick={() => onNavigate(c.id)}
              className="rounded-md px-4 py-2 text-sm transition-colors"
              style={{
                color: active === c.id ? RUST : INK_SOFT,
                background: active === c.id ? RUST_BG : "transparent",
              }}
            >
              {c.name}
            </button>
          ))}
        </nav>
      </div>

      <nav className="flex gap-1 overflow-x-auto px-6 pb-3 md:hidden" style={{ borderTop: `1px solid ${LINE}` }}>
        {COMPONENTS.map((c) => (
          <button
            key={c.id}
            onClick={() => onNavigate(c.id)}
            className="mt-3 whitespace-nowrap rounded-md px-3 py-1.5 text-xs"
            style={{
              color: active === c.id ? RUST : INK_SOFT,
              background: active === c.id ? RUST_BG : "transparent",
            }}
          >
            {c.name}
          </button>
        ))}
      </nav>
    </header>
  );
}

function Home({ onNavigate }) {
  return (
    <main className="mx-auto max-w-[1280px] px-8 pb-28 sm:px-12">
      <section className="max-w-2xl py-24">
        <p
          className="mb-5 text-xs font-medium uppercase tracking-[0.2em]"
          style={{ color: RUST_SOFT }}
        >
          Four systems, one value chain
        </p>
        <h1 className="font-serif text-5xl leading-[1.15]" style={{ color: INK }}>
          Coordinating labor, disease risk, and market decisions across Ceylon's cinnamon estates.
        </h1>
        <p className="mt-6 text-lg leading-relaxed" style={{ color: INK_SOFT }}>
          Pick a component below to open its workspace. Each one is being built out
          independently — labor scheduling, disease advisory, canopy monitoring, and grading.
        </p>
      </section>

      <section className="grid gap-5 sm:grid-cols-2">
        {COMPONENTS.map((c) => (
          <button
            key={c.id}
            onClick={() => onNavigate(c.id)}
            className="group flex flex-col justify-between rounded-2xl p-8 text-left transition-all"
            style={{
              background: CARD,
              border: `1px solid ${LINE}`,
              boxShadow: "0 1px 2px rgba(43,38,32,0.04)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(43,38,32,0.08)";
              e.currentTarget.style.borderColor = RUST_SOFT;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "0 1px 2px rgba(43,38,32,0.04)";
              e.currentTarget.style.borderColor = LINE;
            }}
          >
            <div>
              <div className="mb-5 flex items-center justify-between">
                <span
                  className="rounded-full px-3 py-1 text-xs font-medium"
                  style={{ background: MOSS_BG, color: MOSS }}
                >
                  {c.tag}
                </span>
                <span className="font-serif text-sm" style={{ color: INK_SOFT }}>
                  {c.index}
                </span>
              </div>
              <h2 className="font-serif text-2xl" style={{ color: INK }}>
                {c.name}
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed" style={{ color: INK_SOFT }}>
                {c.summary}
              </p>
            </div>
            <span
              className="mt-8 text-sm font-medium transition-colors"
              style={{ color: RUST }}
            >
              Open workspace &rarr;
            </span>
          </button>
        ))}
      </section>
    </main>
  );
}

function ComponentPage({ component, onNavigate }) {
  return (
    <main className="mx-auto max-w-[1280px] px-8 py-24 sm:px-12">
      <button
        onClick={() => onNavigate("home")}
        className="mb-12 text-sm transition-colors"
        style={{ color: INK_SOFT }}
      >
        &larr; Back to overview
      </button>

      <span
        className="mb-4 inline-block rounded-full px-3 py-1 text-xs font-medium"
        style={{ background: MOSS_BG, color: MOSS }}
      >
        {component.tag}
      </span>
      <h1 className="font-serif text-4xl" style={{ color: INK }}>
        {component.name}
      </h1>
      <p className="mt-4 max-w-xl text-lg leading-relaxed" style={{ color: INK_SOFT }}>
        {component.summary}
      </p>

      <div
        className="mt-16 flex h-72 items-center justify-center rounded-2xl text-sm"
        style={{ border: `1px dashed ${LINE}`, color: INK_SOFT, background: CARD }}
      >
        Workspace coming soon
      </div>
    </main>
  );
}

export default function App() {
  const [active, setActive] = useState("home");
  const navigate = useNavigate();
  const activeComponent = COMPONENTS.find((c) => c.id === active);

  // Single entry point for every card / nav click in this page.
  // Most ids just switch the local tab. "plantation-health" instead
  // leaves this page entirely and goes to the real dashboard route,
  // routing through login first if there's no token.
  const handleNavigate = (id) => {
    if (EXTERNAL_ROUTES[id]) {
      const token = localStorage.getItem(TOKEN_KEY);
      navigate(token ? DASHBOARD_PATH : LOGIN_PATH);
      return;
    }
    setActive(id);
  };

  return (
    <div className="min-h-screen" style={{ background: PAPER, fontFamily: "Inter, system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500&family=Inter:wght@400;500&display=swap');
        .font-serif { font-family: 'Fraunces', serif; }
      `}</style>

      <TopNav active={active} onNavigate={handleNavigate} />

      {active === "home" || !activeComponent ? (
        <Home onNavigate={handleNavigate} />
      ) : (
        <ComponentPage component={activeComponent} onNavigate={handleNavigate} />
      )}
    </div>
  );
}