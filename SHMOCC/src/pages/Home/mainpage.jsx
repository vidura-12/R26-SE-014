import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TOKEN_KEY, DASHBOARD_PATH, LOGIN_PATH } from "../../App";
import GradeMarketAuth from "../Nimesha/GradeMarketAuth";

const COMPONENTS = [
  {
    id: "labor",
    index: "01",
    name: "Peeler Dispatch",
    tag: "Labor optimization",
    summary:
      "Genetic-algorithm route planning that matches Kalliya peeler groups to harvest-ready farms.",
    plain:
      "Finds which peeling team should go to which farm next, so a ready field never waits and a team is never idle.",
  },
  {
    id: "wrr-advisory",
    index: "02",
    name: "Root Rot Advisory",
    tag: "IoT + RAG",
    summary:
      "Soil sensors and a retrieval-augmented knowledge base flag White Root Rot risk before it spreads.",
    plain:
      "Sensors in the soil watch for the early signs of root disease, and the system explains — in plain language — what to check and what to do.",
  },
  {
    id: "plantation-health",
    index: "03",
    name: "Canopy Watch",
    tag: "Satellite monitoring",
    summary:
      "Sentinel-2 NDVI and NDMI time series map stressed plantation zones across Karandeniya.",
    plain:
      "Uses satellite photos taken every few days to show which parts of a plantation are healthy and which need a closer look — without walking the whole field.",
  },
  {
    id: "grade-market",
    index: "04",
    name: "Grade & Market",
    tag: "CNN + XGBoost",
    summary:
      "AR bundle capture, mixed-grade detection, and GPS-based profit routing to the best buyer.",
    plain:
      "Photograph a bundle of cinnamon quills to get its grade instantly, then see which nearby buyer is offering the fairest price for it.",
  },
];

// ids that should leave this single-page app entirely and go to a real route,
// instead of just swapping the local "active" tab
const EXTERNAL_ROUTES = {
  "plantation-health": true,
};

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Data comes in from the field",
    body:
      "Satellites pass overhead every few days, soil sensors report continuously, and a farmer's own photos add ground-level detail. None of this needs the farmer to do anything extra.",
  },
  {
    step: "02",
    title: "The system looks for patterns",
    body:
      "Models trained on real Karandeniya plantation data compare what's happening now to years of past seasons, so a change in leaf colour or soil moisture can be understood in context, not in isolation.",
  },
  {
    step: "03",
    title: "Findings are translated into plain guidance",
    body:
      "Instead of charts and technical scores, the system produces a short, direct answer: which block needs attention, what the likely cause is, and what to do about it — in Sinhala or English.",
  },
  {
    step: "04",
    title: "The platform helps with the next step",
    body:
      "Where possible, the platform goes one step further — dispatching a peeling team, routing a harvest to the buyer paying the fairest price, or pointing to a treatment before a problem spreads.",
  },
];

const FAQS = [
  {
    q: "Do I need a smartphone or fast internet to use this?",
    a: "The satellite and sensor systems run in the background regardless of what device a farmer has. Findings are written to be readable on a basic phone screen and, where a component supports it, in Sinhala as well as English.",
  },
  {
    q: "Is this replacing a farmer's own judgement?",
    a: "No. Every recommendation is meant to support a decision a farmer or estate manager already makes — when to harvest, when to treat a section of the plantation, who to sell to — not to make that decision for them.",
  },
  {
    q: "Where does the underlying data come from?",
    a: "Plantation health readings are drawn from public Sentinel-2 satellite imagery combined with on-the-ground sensor and farm-visit data collected in Karandeniya as part of this research project.",
  },
  {
    q: "Is this only for large estates?",
    a: "The four systems are built to work at the scale of a single family plot as well as a large estate. A smallholder gets the same disease advisory and market routing that a larger operation does.",
  },
];

const INK = "#2B2620";
const INK_SOFT = "#726A5C";
const INK_FAINT = "#A79C89";
const PAPER = "#FBF9F5";
const SAND = "#F2EAD9";
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

// Thin wrapper so every long-form section shares the same rhythm of
// padding and max-width, and can alternate background bands as the
// page scrolls — this is what makes a long page feel organized
// instead of just tall.
function Section({ tone = "paper", children, style }) {
  return (
    <section style={{ background: tone === "sand" ? SAND : PAPER, ...style }}>
      <div className="mx-auto max-w-[1280px] px-8 py-20 sm:px-12">{children}</div>
    </section>
  );
}

function Eyebrow({ children }) {
  return (
    <p className="mb-4 text-xs font-medium uppercase tracking-[0.2em]" style={{ color: RUST_SOFT }}>
      {children}
    </p>
  );
}

function Hero() {
  return (
    <Section>
      <div className="max-w-2xl">
        <Eyebrow>A research initiative for Sri Lanka's cinnamon sector</Eyebrow>
        <h1 className="font-serif text-5xl leading-[1.15]" style={{ color: INK }}>
          One platform, built with growers in Karandeniya, for every decision a cinnamon farm has to make.
        </h1>
        <p className="mt-6 text-lg leading-relaxed" style={{ color: INK_SOFT }}>
          Four systems — labor, disease, plantation health, and market pricing — share one goal: turn
          satellite data, sensors, and years of field knowledge into guidance a farmer can actually act on,
          whether that farmer manages a large estate or a single family plot.
        </p>
      </div>

      <div
        className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-2xl sm:grid-cols-4"
        style={{ background: LINE }}
      >
        {[
          ["4", "independent systems, one shared platform"],
          ["2", "languages — Sinhala and English"],
          ["Karandeniya", "field data behind every model"],
          ["Ongoing", "research, validated against real harvests"],
        ].map(([stat, label]) => (
          <div key={label} className="p-6" style={{ background: CARD }}>
            <p className="font-serif text-2xl" style={{ color: RUST }}>
              {stat}
            </p>
            <p className="mt-1 text-sm leading-snug" style={{ color: INK_SOFT }}>
              {label}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}

function WhyThisExists() {
  return (
    <Section tone="sand">
      <div className="grid gap-12 md:grid-cols-2">
        <div>
          <Eyebrow>Why this exists</Eyebrow>
          <h2 className="font-serif text-3xl" style={{ color: INK }}>
            Good cinnamon depends on hundreds of small decisions — most of them made with too little information.
          </h2>
        </div>
        <div className="space-y-5 text-[15px] leading-relaxed" style={{ color: INK_SOFT }}>
          <p>
            A peeling team may travel to a farm that isn't ready. A section of plantation can lose vigour for
            weeks before anyone walks past it. Root disease often shows on the surface only after it has
            already spread underground. And a fair harvest can still earn a poor price if it reaches the wrong
            buyer at the wrong time.
          </p>
          <p>
            None of these problems come from a lack of effort — they come from information arriving too late,
            or not in a form that's easy to act on. This platform exists to close that gap, using data sources
            — satellites, soil sensors, and photographs — that were previously out of reach for most growers.
          </p>
        </div>
      </div>
    </Section>
  );
}

function SystemsGrid({ onNavigate }) {
  return (
    <Section>
      <Eyebrow>The four systems</Eyebrow>
      <h2 className="max-w-xl font-serif text-3xl" style={{ color: INK }}>
        Each one solves a single problem well, and shares data with the others.
      </h2>

      <div className="mt-12 grid gap-5 sm:grid-cols-2">
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
              <h3 className="font-serif text-2xl" style={{ color: INK }}>
                {c.name}
              </h3>
              <p className="mt-3 text-[15px] leading-relaxed" style={{ color: INK_SOFT }}>
                {c.summary}
              </p>

              <div className="mt-5 rounded-xl p-4" style={{ background: RUST_BG }}>
                <p className="text-[11px] font-medium uppercase tracking-wide" style={{ color: RUST }}>
                  In plain words
                </p>
                <p className="mt-1.5 text-sm leading-relaxed" style={{ color: INK }}>
                  {c.plain}
                </p>
              </div>
            </div>
            <span className="mt-6 text-sm font-medium transition-colors" style={{ color: RUST }}>
              Open workspace &rarr;
            </span>
          </button>
        ))}
      </div>
    </Section>
  );
}

function HowItWorks() {
  return (
    <Section tone="sand">
      <Eyebrow>How it works, start to finish</Eyebrow>
      <h2 className="max-w-xl font-serif text-3xl" style={{ color: INK }}>
        From a satellite pass to a decision on the ground.
      </h2>

      <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        {HOW_IT_WORKS.map((s, i) => (
          <div key={s.step} className="relative pl-1">
            <p className="font-serif text-4xl" style={{ color: RUST_SOFT }}>
              {s.step}
            </p>
            <h3 className="mt-4 text-base font-medium" style={{ color: INK }}>
              {s.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: INK_SOFT }}>
              {s.body}
            </p>
            {i < HOW_IT_WORKS.length - 1 && (
              <div
                className="mt-6 hidden h-px w-full lg:block"
                style={{ background: LINE }}
                aria-hidden="true"
              />
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}

function BuiltForEveryFarmer() {
  return (
    <Section>
      <Eyebrow>Who this is built for</Eyebrow>
      <h2 className="max-w-xl font-serif text-3xl" style={{ color: INK }}>
        A traditional grower and a data-driven estate manager get the same answer, in a form each can use.
      </h2>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl p-8" style={{ background: CARD, border: `1px solid ${LINE}` }}>
          <p className="text-xs font-medium uppercase tracking-wide" style={{ color: MOSS }}>
            For a family-plot grower
          </p>
          <p className="mt-3 text-[15px] leading-relaxed" style={{ color: INK_SOFT }}>
            Guidance is written as a short, direct sentence rather than a graph or a score — "this section
            needs water" instead of an NDMI value — and is available in Sinhala. No extra equipment or
            training is required; the sensing happens on the platform's side.
          </p>
        </div>
        <div className="rounded-2xl p-8" style={{ background: CARD, border: `1px solid ${LINE}` }}>
          <p className="text-xs font-medium uppercase tracking-wide" style={{ color: MOSS }}>
            For an estate or research team
          </p>
          <p className="mt-3 text-[15px] leading-relaxed" style={{ color: INK_SOFT }}>
            The same readings are available as full time series and exportable data — NDVI and NDMI trends,
            model confidence, and historical comparisons — for teams that want to plan across many hectares or
            validate results against their own records.
          </p>
        </div>
      </div>
    </Section>
  );
}

function Faq() {
  return (
    <Section tone="sand">
      <Eyebrow>Common questions</Eyebrow>
      <h2 className="max-w-xl font-serif text-3xl" style={{ color: INK }}>
        Answered in plain language, before you ask.
      </h2>

      <div className="mt-12 divide-y" style={{ borderColor: LINE }}>
        {FAQS.map((f) => (
          <div key={f.q} className="grid gap-2 py-7 sm:grid-cols-[minmax(0,320px)_1fr] sm:gap-10">
            <p className="font-serif text-lg" style={{ color: INK }}>
              {f.q}
            </p>
            <p className="text-[15px] leading-relaxed" style={{ color: INK_SOFT }}>
              {f.a}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}

function HomeFooter() {
  return (
    <Section>
      <div
        className="flex flex-col items-start justify-between gap-6 rounded-2xl p-10 sm:flex-row sm:items-center"
        style={{ background: INK }}
      >
        <div className="max-w-md">
          <h3 className="font-serif text-2xl text-white">Working with a plantation, a cooperative, or an agency?</h3>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: "#D8D2C4" }}>
            This platform is an active research project — we're glad to walk through methodology, data
            sources, or a pilot on your own farm.
          </p>
        </div>
        <span
          className="whitespace-nowrap rounded-full px-6 py-3 text-sm font-medium"
          style={{ background: RUST, color: "#fff" }}
        >
          Explore a workspace above
        </span>
      </div>
      <p className="mt-8 text-xs" style={{ color: INK_FAINT }}>
        A university research collaboration for Ceylon Cinnamon, developed with plantation data from
        Karandeniya, Sri Lanka.
      </p>
    </Section>
  );
}

function Home({ onNavigate }) {
  return (
    <main>
      <Hero />
      <WhyThisExists />
      <SystemsGrid onNavigate={onNavigate} />
      <HowItWorks />
      <BuiltForEveryFarmer />
      <Faq />
      <HomeFooter />
    </main>
  );
}

function ComponentPage({ component, onNavigate }) {
  if (component.id === "grade-market") {
    return <GradeMarketAuth />;
  }
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