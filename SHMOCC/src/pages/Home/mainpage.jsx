import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { TOKEN_KEY, DASHBOARD_PATH, LOGIN_PATH } from "../../App";
import GradeMarketAuth from "../Nimesha/GradeMarketAuth";
import Root_Rot_Advisory from "../Uthara/Landing";

// ── Farmer-friendly component names ──
const COMPONENTS = [
  {
    id: "labor",
    index: "01",
    name: "Team Scheduler",
    tag: "Labour planner",
    summary:
      "Smart route planning that matches peeling teams to farms ready for harvest.",
    plain:
      "See which peeling team should go to which farm next, so no field waits and no worker sits idle.",
  },
  {
    id: "wrr-advisory",
    index: "02",
    name: "Disease Guard",
    tag: "Soil + AI watch",
    summary:
      "Underground sensors and a knowledge base flag White Root Rot before it spreads.",
    plain:
      "Sensors in the soil catch early signs of root disease, then tell you—in plain words—what to check and what to do.",
  },
  {
    id: "plantation-health",
    index: "03",
    name: "Field Eye",
    tag: "Sky mapping",
    summary:
      "Satellite photos every few days map healthy and stressed zones across Karandeniya.",
    plain:
      "Uses satellite pictures to show which parts of your land are thriving and which need a closer look—without walking every row.",
  },
  {
    id: "grade-market",
    index: "04",
    name: "Price & Grade",
    tag: "YOLOv8 + Market",
    summary:
      "Snap a bundle photo, get its grade instantly, then find the nearby buyer paying the best price.",
    plain:
      "Photograph a bundle of cinnamon quills to know its grade right away, then see which buyer nearby is offering the fairest price.",
  },
];

// ids that leave this single-page app for real routes
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
      "Models trained on real Karandeniya plantation data compare what's happening now to years of past seasons, so a change in leaf colour or soil moisture can be understood in context.",
  },
  {
    step: "03",
    title: "Findings become plain guidance",
    body:
      "Instead of charts and scores, the system gives a short, direct answer: which block needs attention, what the likely cause is, and what to do about it—in Sinhala or English.",
  },
  {
    step: "04",
    title: "The platform helps with the next step",
    body:
      "Where possible, it goes further—dispatching a peeling team, routing a harvest to the fairest buyer, or pointing to a treatment before a problem spreads.",
  },
];

const FAQS = [
  {
    q: "Do I need a smartphone or fast internet to use this?",
    a: "The satellite and sensor systems run in the background regardless of what device a farmer has. Findings are written to be readable on a basic phone screen and, where supported, in Sinhala as well as English.",
  },
  {
    q: "Is this replacing a farmer's own judgement?",
    a: "No. Every recommendation supports a decision a farmer or estate manager already makes—when to harvest, when to treat, who to sell to—not to make that decision for them.",
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

// ── Deep Green Agrarian Palette ──
const FOREST = "#1B2E1B";        // Deep forest green (headings, dark sections)
const FOREST_SOFT = "#2D4A2D";   // Medium green (cards, hover)
const MOSS = "#3E6B3E";          // Moss green (accents)
const MOSS_LIGHT = "#6B9E6B";    // Light moss (tags, highlights)
const LEAF = "#8FBC8F";          // Soft leaf (borders, subtle accents)
const PARCHMENT = "#F5F0E8";     // Warm parchment background
const CREAM = "#FAF8F3";         // Cream white
const EARTH = "#C4A882";         // Warm earth/tan
const EARTH_DARK = "#8B7355";    // Darker earth
const BARK = "#3D3229";          // Dark bark (text)
const BARK_SOFT = "#6B5D4F";     // Soft bark (secondary text)
const GOLD = "#B8860B";          // Harvest gold (CTAs, accents)
const GOLD_SOFT = "#D4A843";     // Soft gold
const DANGER = "#8B4513";        // Rust brown (alerts)

// ── Scroll Reveal Hook ──
function useScrollReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, visible };
}

function ScrollReveal({
  children,
  direction = "left",
  delay = 0,
  className = "",
}) {
  const { ref, visible } = useScrollReveal();

  const translateX =
    direction === "left" ? "-60px" : direction === "right" ? "60px" : "0";
  const translateY =
    direction === "up" ? "60px" : direction === "down" ? "-60px" : "0";

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible
          ? "translate(0, 0)"
          : `translate(${translateX}, ${translateY})`,
        transition: `all 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${delay}s`,
        willChange: "transform, opacity",
      }}
    >
      {children}
    </div>
  );
}

function TopNav({ active, onNavigate }) {
  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: "rgba(27,46,27,0.92)",
        backdropFilter: "blur(10px)",
        borderBottom: `1px solid ${FOREST_SOFT}`,
      }}
    >
      <div className="mx-auto flex max-w-[1280px] items-center justify-between px-6 py-4 sm:px-12">
        <button
          onClick={() => onNavigate("home")}
          className="flex items-center gap-2 font-serif text-lg tracking-wide"
          style={{ color: CREAM }}
        >
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ background: MOSS_LIGHT }}
          />
          Ceylon Cinnamon <span style={{ color: GOLD_SOFT }}>· Intelligence</span>
        </button>

        <nav className="hidden gap-2 md:flex">
          {COMPONENTS.map((c) => (
            <button
              key={c.id}
              onClick={() => onNavigate(c.id)}
              className="rounded-lg px-4 py-2 text-sm transition-all duration-300"
              style={{
                color: active === c.id ? GOLD_SOFT : "#B8C4A8",
                background: active === c.id ? FOREST_SOFT : "transparent",
                border: active === c.id ? `1px solid ${MOSS}` : "1px solid transparent",
              }}
              onMouseEnter={(e) => {
                if (active !== c.id) {
                  e.currentTarget.style.background = FOREST_SOFT;
                  e.currentTarget.style.color = CREAM;
                }
              }}
              onMouseLeave={(e) => {
                if (active !== c.id) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#B8C4A8";
                }
              }}
            >
              {c.name}
            </button>
          ))}
        </nav>
      </div>

      <nav
        className="flex gap-2 overflow-x-auto px-6 pb-3 md:hidden"
        style={{ borderTop: `1px solid ${FOREST_SOFT}` }}
      >
        {COMPONENTS.map((c) => (
          <button
            key={c.id}
            onClick={() => onNavigate(c.id)}
            className="mt-3 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs transition-all"
            style={{
              color: active === c.id ? GOLD_SOFT : "#B8C4A8",
              background: active === c.id ? FOREST_SOFT : "transparent",
              border: active === c.id ? `1px solid ${MOSS}` : "1px solid transparent",
            }}
          >
            {c.name}
          </button>
        ))}
      </nav>
    </header>
  );
}

function Section({ tone = "parchment", children, style, className = "" }) {
  const bg =
    tone === "forest"
      ? FOREST
      : tone === "cream"
      ? CREAM
      : tone === "moss"
      ? "#E8F0E8"
      : PARCHMENT;
  return (
    <section style={{ background: bg, ...style }} className={className}>
      <div className="mx-auto max-w-[1280px] px-6 py-20 sm:px-12">{children}</div>
    </section>
  );
}

function Eyebrow({ children }) {
  return (
    <p
      className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em]"
      style={{ color: MOSS }}
    >
      <span className="h-px w-6" style={{ background: GOLD }} />
      {children}
    </p>
  );
}

function Hero() {
  return (
    <Section tone="forest" className="relative overflow-hidden">
      {/* Decorative background pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, ${MOSS_LIGHT} 0%, transparent 50%),
                           radial-gradient(circle at 80% 20%, ${GOLD} 0%, transparent 40%)`,
        }}
      />
      <div className="relative grid gap-12 lg:grid-cols-2 lg:items-center">
        <ScrollReveal direction="left">
          <div className="max-w-2xl">
            <Eyebrow>A research initiative for Sri Lanka's cinnamon sector</Eyebrow>
            <h1
              className="font-serif text-4xl leading-[1.15] sm:text-5xl lg:text-6xl"
              style={{ color: CREAM }}
            >
              One platform, built with growers in Karandeniya, for every decision a cinnamon farm has to make.
            </h1>
            <p className="mt-6 text-lg leading-relaxed" style={{ color: "#B8C4A8" }}>
              Four systems — labour, disease, plantation health, and market pricing — share one goal: turn
              satellite data, sensors, and years of field knowledge into guidance a farmer can actually act on.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal direction="right" delay={0.2}>
          <div className="relative">
            <img
              src="https://kimi-web-img.kimi.ai/img/elements-resized.envatousercontent.com/59293fbf0438feba2f93ca7f8cb24fc2ece68f6d.jpg"
              alt="Aerial view of cinnamon plantation"
              className="rounded-2xl object-cover shadow-2xl"
              style={{ width: "100%", height: "360px", border: `2px solid ${FOREST_SOFT}` }}
            />
            <div
              className="absolute -bottom-4 -left-4 rounded-xl p-4 shadow-lg sm:-bottom-6 sm:-left-6 sm:p-5"
              style={{ background: FOREST_SOFT, border: `1px solid ${MOSS}` }}
            >
              <p className="font-serif text-2xl" style={{ color: GOLD_SOFT }}>
                Karandeniya
              </p>
              <p className="text-xs" style={{ color: "#B8C4A8" }}>
                Field-validated research
              </p>
            </div>
          </div>
        </ScrollReveal>
      </div>

      <ScrollReveal direction="up" delay={0.3}>
        <div
          className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-2xl sm:grid-cols-4"
          style={{ background: FOREST_SOFT }}
        >
          {[
            ["4", "independent systems, one shared platform"],
            ["2", "languages — Sinhala and English"],
            ["Karandeniya", "field data behind every model"],
            ["Ongoing", "research, validated against real harvests"],
          ].map(([stat, label]) => (
            <div key={label} className="p-6" style={{ background: FOREST }}>
              <p className="font-serif text-2xl" style={{ color: GOLD_SOFT }}>
                {stat}
              </p>
              <p className="mt-1 text-sm leading-snug" style={{ color: "#B8C4A8" }}>
                {label}
              </p>
            </div>
          ))}
        </div>
      </ScrollReveal>
    </Section>
  );
}

function WhyThisExists() {
  return (
    <Section tone="parchment">
      <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <ScrollReveal direction="left">
          <div>
            <Eyebrow>Why this exists</Eyebrow>
            <h2
              className="font-serif text-3xl leading-snug sm:text-4xl"
              style={{ color: FOREST }}
            >
              Good cinnamon depends on hundreds of small decisions — most of them made with too little information.
            </h2>
          </div>
        </ScrollReveal>

        <ScrollReveal direction="right" delay={0.15}>
          <div className="relative">
            <img
              src="https://kimi-web-img.kimi.ai/img/4.bp.blogspot.com/7c12f38f8cf30802ee2da418c3645f72b1ce5ff4.jpg"
              alt="Cinnamon cultivation field"
              className="mb-6 rounded-2xl object-cover shadow-lg sm:mb-0 sm:absolute sm:right-0 sm:top-0 sm:h-full sm:w-5/12"
              style={{ border: `2px solid ${LEAF}` }}
            />
            <div className="space-y-5 text-[15px] leading-relaxed sm:pr-[45%]" style={{ color: BARK_SOFT }}>
              <p>
                A peeling team may travel to a farm that isn't ready. A section of plantation can lose vigour for
                weeks before anyone walks past it. Root disease often shows on the surface only after it has
                already spread underground.
              </p>
              <p>
                None of these problems come from a lack of effort — they come from information arriving too late,
                or not in a form that's easy to act on. This platform exists to close that gap.
              </p>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </Section>
  );
}

function SystemsGrid({ onNavigate }) {
  return (
    <Section tone="cream">
      <ScrollReveal direction="up">
        <Eyebrow>The four systems</Eyebrow>
        <h2
          className="max-w-xl font-serif text-3xl leading-snug sm:text-4xl"
          style={{ color: FOREST }}
        >
          Each one solves a single problem well, and shares data with the others.
        </h2>
      </ScrollReveal>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        {COMPONENTS.map((c, i) => (
          <ScrollReveal
            key={c.id}
            direction={i % 2 === 0 ? "left" : "right"}
            delay={i * 0.1}
          >
            <button
              onClick={() => onNavigate(c.id)}
              className="group flex h-full flex-col justify-between rounded-2xl p-7 text-left transition-all duration-500 sm:p-8"
              style={{
                background: CREAM,
                border: `1px solid ${LEAF}`,
                boxShadow: "0 2px 8px rgba(27,46,27,0.06)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 12px 32px rgba(27,46,27,0.14)";
                e.currentTarget.style.borderColor = MOSS;
                e.currentTarget.style.transform = "translateY(-4px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(27,46,27,0.06)";
                e.currentTarget.style.borderColor = LEAF;
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div>
                <div className="mb-5 flex items-center justify-between">
                  <span
                    className="rounded-full px-3 py-1 text-xs font-medium"
                    style={{ background: "#E8F0E8", color: MOSS }}
                  >
                    {c.tag}
                  </span>
                  <span className="font-serif text-sm" style={{ color: BARK_SOFT }}>
                    {c.index}
                  </span>
                </div>
                <h3 className="font-serif text-2xl" style={{ color: FOREST }}>
                  {c.name}
                </h3>
                <p className="mt-3 text-[15px] leading-relaxed" style={{ color: BARK_SOFT }}>
                  {c.summary}
                </p>

                <div
                  className="mt-5 rounded-xl p-4"
                  style={{ background: "#F5F0E8", borderLeft: `3px solid ${GOLD}` }}
                >
                  <p className="text-[11px] font-medium uppercase tracking-wide" style={{ color: EARTH_DARK }}>
                    In plain words
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed" style={{ color: BARK }}>
                    {c.plain}
                  </p>
                </div>
              </div>
              <span
                className="mt-6 flex items-center gap-2 text-sm font-medium transition-colors"
                style={{ color: MOSS }}
              >
                Open workspace
                <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </span>
            </button>
          </ScrollReveal>
        ))}
      </div>
    </Section>
  );
}

function HowItWorks() {
  return (
    <Section tone="moss">
      <ScrollReveal direction="up">
        <Eyebrow>How it works, start to finish</Eyebrow>
        <h2
          className="max-w-xl font-serif text-3xl leading-snug sm:text-4xl"
          style={{ color: FOREST }}
        >
          From a satellite pass to a decision on the ground.
        </h2>
      </ScrollReveal>

      <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        {HOW_IT_WORKS.map((s, i) => (
          <ScrollReveal key={s.step} direction="up" delay={i * 0.12}>
            <div className="relative">
              <div
                className="mb-4 flex h-12 w-12 items-center justify-center rounded-full font-serif text-xl"
                style={{ background: FOREST, color: GOLD_SOFT }}
              >
                {s.step}
              </div>
              <h3 className="text-base font-medium" style={{ color: FOREST }}>
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: BARK_SOFT }}>
                {s.body}
              </p>
              {i < HOW_IT_WORKS.length - 1 && (
                <div
                  className="absolute -right-5 top-6 hidden h-px w-10 lg:block"
                  style={{ background: MOSS }}
                />
              )}
            </div>
          </ScrollReveal>
        ))}
      </div>

      <ScrollReveal direction="up" delay={0.4}>
        <div className="mt-16 overflow-hidden rounded-2xl shadow-xl">
          <img
            src="https://kimi-web-img.kimi.ai/img/static.wixstatic.com/94db2618e37819258b7c13a0ce62a572c5168ee8.jpg"
            alt="NDVI satellite agriculture monitoring"
            className="h-64 w-full object-cover sm:h-80"
          />
          <div className="p-5 sm:p-6" style={{ background: FOREST }}>
            <p className="text-sm font-medium" style={{ color: GOLD_SOFT }}>
              Satellite imagery analysed for plantation health
            </p>
            <p className="mt-1 text-xs" style={{ color: "#B8C4A8" }}>
              NDVI and NDMI time series from Sentinel-2, interpreted for cinnamon growers
            </p>
          </div>
        </div>
      </ScrollReveal>
    </Section>
  );
}

function BuiltForEveryFarmer() {
  return (
    <Section tone="parchment">
      <ScrollReveal direction="up">
        <Eyebrow>Who this is built for</Eyebrow>
        <h2
          className="max-w-xl font-serif text-3xl leading-snug sm:text-4xl"
          style={{ color: FOREST }}
        >
          A traditional grower and a data-driven estate manager get the same answer, in a form each can use.
        </h2>
      </ScrollReveal>

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        <ScrollReveal direction="left">
          <div
            className="rounded-2xl p-8 transition-all duration-500 hover:shadow-lg"
            style={{ background: CREAM, border: `1px solid ${LEAF}` }}
          >
            <div className="mb-4 flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{ background: "#E8F0E8" }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={MOSS} strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: MOSS }}>
                For a family-plot grower
              </p>
            </div>
            <p className="text-[15px] leading-relaxed" style={{ color: BARK_SOFT }}>
              Guidance is written as a short, direct sentence rather than a graph — "this section
              needs water" instead of an NDMI value — and is available in Sinhala. No extra equipment or
              training is required; the sensing happens on the platform's side.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal direction="right" delay={0.15}>
          <div
            className="rounded-2xl p-8 transition-all duration-500 hover:shadow-lg"
            style={{ background: CREAM, border: `1px solid ${LEAF}` }}
          >
            <div className="mb-4 flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{ background: "#E8F0E8" }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={MOSS} strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
              </div>
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: MOSS }}>
                For an estate or research team
              </p>
            </div>
            <p className="text-[15px] leading-relaxed" style={{ color: BARK_SOFT }}>
              The same readings are available as full time series and exportable data — NDVI and NDMI trends,
              model confidence, and historical comparisons — for teams that want to plan across many hectares or
              validate results against their own records.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </Section>
  );
}

function Faq() {
  return (
    <Section tone="cream">
      <ScrollReveal direction="up">
        <Eyebrow>Common questions</Eyebrow>
        <h2
          className="max-w-xl font-serif text-3xl leading-snug sm:text-4xl"
          style={{ color: FOREST }}
        >
          Answered in plain language, before you ask.
        </h2>
      </ScrollReveal>

      <div className="mt-12 divide-y" style={{ borderColor: LEAF }}>
        {FAQS.map((f, i) => (
          <ScrollReveal key={f.q} direction="up" delay={i * 0.08}>
            <div className="grid gap-2 py-7 sm:grid-cols-[minmax(0,320px)_1fr] sm:gap-10">
              <p className="font-serif text-lg" style={{ color: FOREST }}>
                {f.q}
              </p>
              <p className="text-[15px] leading-relaxed" style={{ color: BARK_SOFT }}>
                {f.a}
              </p>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </Section>
  );
}

function HomeFooter() {
  return (
    <Section tone="forest" className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle at 70% 80%, ${MOSS_LIGHT} 0%, transparent 50%)`,
        }}
      />
      <ScrollReveal direction="up">
        <div
          className="relative flex flex-col items-start justify-between gap-6 rounded-2xl p-10 sm:flex-row sm:items-center"
          style={{ background: FOREST_SOFT, border: `1px solid ${MOSS}` }}
        >
          <div className="max-w-md">
            <h3 className="font-serif text-2xl" style={{ color: CREAM }}>
              Working with a plantation, a cooperative, or an agency?
            </h3>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: "#B8C4A8" }}>
              This platform is an active research project — we're glad to walk through methodology, data
              sources, or a pilot on your own farm.
            </p>
          </div>
          <span
            className="whitespace-nowrap rounded-full px-6 py-3 text-sm font-medium transition-all duration-300 hover:scale-105"
            style={{ background: GOLD, color: FOREST }}
          >
            Explore a workspace above
          </span>
        </div>
        <p className="relative mt-8 text-xs" style={{ color: "#6B8F6B" }}>
          A university research collaboration for Ceylon Cinnamon, developed with plantation data from
          Karandeniya, Sri Lanka.
        </p>
      </ScrollReveal>
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
  } else if (component.id === "wrr-advisory") {
    return <Root_Rot_Advisory />;
  }
  return (
    <main className="mx-auto max-w-[1280px] px-6 py-24 sm:px-12">
      <button
        onClick={() => onNavigate("home")}
        className="mb-12 flex items-center gap-2 text-sm transition-colors hover:underline"
        style={{ color: BARK_SOFT }}
      >
        ← Back to overview
      </button>

      <span
        className="mb-4 inline-block rounded-full px-3 py-1 text-xs font-medium"
        style={{ background: "#E8F0E8", color: MOSS }}
      >
        {component.tag}
      </span>
      <h1 className="font-serif text-4xl" style={{ color: FOREST }}>
        {component.name}
      </h1>
      <p className="mt-4 max-w-xl text-lg leading-relaxed" style={{ color: BARK_SOFT }}>
        {component.summary}
      </p>

      <div
        className="mt-16 flex h-72 items-center justify-center rounded-2xl text-sm"
        style={{ border: `1px dashed ${LEAF}`, color: BARK_SOFT, background: CREAM }}
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

  const handleNavigate = (id) => {
    if (EXTERNAL_ROUTES[id]) {
      const token = localStorage.getItem(TOKEN_KEY);
      navigate(token ? DASHBOARD_PATH : LOGIN_PATH);
      return;
    }
    setActive(id);
  };

  return (
    <div
      className="min-h-screen"
      style={{ background: PARCHMENT, fontFamily: "Inter, system-ui, sans-serif" }}
    >
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