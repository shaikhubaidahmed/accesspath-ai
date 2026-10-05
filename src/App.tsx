import { useEffect, useMemo, useRef, useState } from "react";
import {
  Accessibility,
  AlertTriangle,
  ArrowRight,
  AudioLines,
  BadgeCheck,
  BrainCircuit,
  Check,
  ChevronDown,
  CircleAlert,
  Clock3,
  Cloud,
  Code2,
  Database,
  Download,
  ExternalLink,
  FileCheck2,
  Gauge,
  GitBranch,
  Landmark,
  LocateFixed,
  Map,
  MapPin,
  Menu,
  Moon,
  Network,
  RefreshCw,
  Route,
  Search,
  Server,
  ShieldCheck,
  Sparkles,
  Sun,
  TimerReset,
  TrainFront,
  Volume2,
  Waypoints,
  X
} from "lucide-react";
import type {
  AccessibilityProfile,
  BootstrapResponse,
  DataMode,
  Evidence,
  IntegrationStatus,
  JourneyRoute,
  JourneyStop,
  PlanResponse,
  Station
} from "../shared/types";

type PlanWithPersistence = PlanResponse & { persistence?: string };
type Theme = "light" | "dark";

const defaultProfile: AccessibilityProfile = {
  stepFree: true,
  avoidLongWalks: true,
  avoidCrowds: false,
  needsAccessibleToilet: false,
  maximumWalkMinutes: 12,
  notes: "I use a wheelchair and need a reliable, step-free transfer."
};

const lineColors: Record<string, string> = {
  "1": "#EE352E",
  "2": "#EE352E",
  "3": "#EE352E",
  "4": "#00933C",
  "5": "#00933C",
  "6": "#00933C",
  "7": "#B933AD",
  "7X": "#B933AD",
  A: "#0039A6",
  C: "#0039A6",
  E: "#0039A6",
  B: "#FF6319",
  D: "#FF6319",
  F: "#FF6319",
  M: "#FF6319",
  G: "#6CBE45",
  J: "#996633",
  Z: "#996633",
  L: "#A7A9AC",
  N: "#FCCC0A",
  Q: "#FCCC0A",
  R: "#FCCC0A",
  W: "#FCCC0A"
};

function compactStops(stops: JourneyStop[]): JourneyStop[] {
  const important = stops.filter((stop) => stop.action !== "ride");
  return important.filter((stop, index) => index === 0 || stop.station.name !== important[index - 1].station.name);
}

function formatObservedAt(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short"
      }).format(date);
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function LineBadges({ lines }: { lines: string[] }) {
  return (
    <span className="line-badges" aria-label={`Subway lines ${lines.join(", ")}`}>
      {lines.map((line) => (
        <span
          className="line-badge"
          key={line}
          style={{
            background: lineColors[line] ?? "#475569",
            color: ["N", "Q", "R", "W"].includes(line) ? "#111827" : "#fff"
          }}
          aria-hidden="true"
        >
          {line}
        </span>
      ))}
    </span>
  );
}

function ModeSelector({ value, onChange }: { value: DataMode; onChange: (mode: DataMode) => void }) {
  const modes: Array<{ id: DataMode; label: string; detail: string }> = [
    { id: "scenario", label: "Outage demo", detail: "Inject a labelled lift failure" },
    { id: "live", label: "Live", detail: "Check MTA now" },
    { id: "replay", label: "Replay", detail: "Use a stable snapshot" }
  ];
  return (
    <fieldset className="mode-fieldset">
      <legend>Evidence mode</legend>
      <div className="segmented-control">
        {modes.map((mode) => (
          <label className={value === mode.id ? "selected" : ""} key={mode.id} title={mode.detail}>
            <input type="radio" name="data-mode" value={mode.id} checked={value === mode.id} onChange={() => onChange(mode.id)} />
            <span>{mode.label}</span>
          </label>
        ))}
      </div>
      <p className="field-help">
        {modes.find((mode) => mode.id === value)?.detail}. Simulations are always labelled.
      </p>
    </fieldset>
  );
}

function Toggle({
  checked,
  onChange,
  title,
  description,
  icon
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <label className={`preference-toggle ${checked ? "checked" : ""}`}>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span className="preference-icon" aria-hidden="true">
        {icon}
      </span>
      <span className="preference-copy">
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
      <span className="switch" aria-hidden="true">
        <span />
      </span>
    </label>
  );
}

function RouteCanvas({ plan }: { plan: PlanWithPersistence }) {
  const routes = plan.disrupted && plan.mode === "scenario" ? [plan.disrupted, plan.recommended] : [plan.recommended];
  const allStops = routes.flatMap((route) => route.stops);
  const longitudes = allStops.map((stop) => stop.station.lon);
  const latitudes = allStops.map((stop) => stop.station.lat);
  const minLon = Math.min(...longitudes);
  const maxLon = Math.max(...longitudes);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const width = 760;
  const height = 390;
  const pad = 52;
  const project = (station: Station) => ({
    x: pad + ((station.lon - minLon) / Math.max(0.001, maxLon - minLon)) * (width - pad * 2),
    y: height - pad - ((station.lat - minLat) / Math.max(0.001, maxLat - minLat)) * (height - pad * 2)
  });
  const points = (route: JourneyRoute) => route.stops.map((stop) => {
    const point = project(stop.station);
    return `${point.x},${point.y}`;
  }).join(" ");
  const important = compactStops(plan.recommended.stops);

  return (
    <div className="route-canvas-wrap">
      <div className="map-topbar">
        <div>
          <span className="eyebrow dark-eyebrow"><LocateFixed size={14} aria-hidden="true" /> NYC accessibility graph</span>
          <h2>Your route changed. Your requirements didn’t.</h2>
        </div>
        <div className="map-legend" aria-label="Map legend">
          {plan.disrupted && <span><i className="legend-line disrupted" /> Original</span>}
          <span><i className="legend-line recommended" /> Verified plan</span>
        </div>
      </div>
      <svg className="route-canvas" viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby="route-map-title route-map-desc">
        <title id="route-map-title">Accessible journey from {plan.recommended.stops[0].station.name} to {plan.recommended.stops.at(-1)?.station.name}</title>
        <desc id="route-map-desc">
          {plan.mode === "scenario"
            ? "The original route transfers at Queensboro Plaza. A simulated lift outage causes AccessPath to reroute through Times Square."
            : `The selected route uses ${plan.recommended.routeLines.join(", ")}.`}
        </desc>
        <defs>
          <linearGradient id="routeGlow" x1="0" x2="1">
            <stop offset="0" stopColor="#0f766e" />
            <stop offset="1" stopColor="#14b8a6" />
          </linearGradient>
          <pattern id="grid" width="38" height="38" patternUnits="userSpaceOnUse">
            <path d="M 38 0 L 0 0 0 38" fill="none" stroke="#d8e4df" strokeWidth="1" />
          </pattern>
          <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#0f766e" floodOpacity="0.22" />
          </filter>
        </defs>
        <rect width={width} height={height} rx="22" fill="#f7faf8" />
        <rect width={width} height={height} rx="22" fill="url(#grid)" opacity="0.72" />
        <path d="M505 -10 C470 70 495 115 455 190 C425 248 455 310 415 410" stroke="#cae8ee" strokeWidth="78" fill="none" opacity="0.78" />
        <text x="468" y="200" fill="#5b7f87" fontSize="12" fontWeight="700" transform="rotate(-66 468 200)">EAST RIVER</text>
        {plan.disrupted && (
          <polyline
            points={points(plan.disrupted)}
            fill="none"
            stroke="#e26b49"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="9 13"
            opacity="0.8"
          />
        )}
        <polyline
          points={points(plan.recommended)}
          fill="none"
          stroke="#ffffff"
          strokeWidth="16"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.95"
        />
        <polyline
          points={points(plan.recommended)}
          fill="none"
          stroke="url(#routeGlow)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#softGlow)"
        />
        {plan.recommended.stops.map((stop, index) => {
          const point = project(stop.station);
          const isKey = stop.action !== "ride";
          return (
            <g key={`${stop.station.id}-${index}`}>
              <circle cx={point.x} cy={point.y} r={isKey ? 9 : 4} fill={isKey ? "#fff" : "#0f766e"} stroke="#0f766e" strokeWidth={isKey ? 5 : 2} />
            </g>
          );
        })}
        {important.map((stop, index) => {
          const point = project(stop.station);
          const offsetY = index % 2 === 0 ? -18 : 28;
          return (
            <g key={`label-${stop.station.id}-${index}`}>
              <rect x={Math.max(8, point.x - 69)} y={point.y + offsetY - 15} width="138" height="30" rx="15" fill="#ffffff" stroke="#cfddd8" />
              <text x={point.x} y={point.y + offsetY + 4} textAnchor="middle" fontSize="12" fontWeight="700" fill="#173631">
                {stop.station.name.length > 21 ? `${stop.station.name.slice(0, 19)}…` : stop.station.name}
              </text>
            </g>
          );
        })}
        {plan.mode === "scenario" && (() => {
          const transferStop = plan.disrupted?.stops.find((stop) => stop.station.name === "Queensboro Plaza");
          if (!transferStop) return null;
          const point = project(transferStop.station);
          return (
            <g transform={`translate(${point.x},${point.y})`}>
              <circle r="24" fill="#fff2ed" stroke="#d84f2b" strokeWidth="2" />
              <path d="M-8-8 8 8M8-8-8 8" stroke="#d84f2b" strokeWidth="4" strokeLinecap="round" />
            </g>
          );
        })()}
      </svg>
      <div className="map-outcome-bar">
        <div className="route-outcome-icon"><ShieldCheck size={22} aria-hidden="true" /></div>
        <div>
          <strong>{plan.recommended.label}</strong>
          <span>{plan.recommended.summary}</span>
        </div>
        <div className="outcome-metrics">
          <span><Clock3 size={16} aria-hidden="true" /> {plan.recommended.durationMinutes} min</span>
          <span><Gauge size={16} aria-hidden="true" /> {formatPercent(plan.recommended.confidence)} confidence</span>
        </div>
      </div>
    </div>
  );
}

function JourneyCard({ route, tone }: { route: JourneyRoute; tone: "muted" | "strong" }) {
  const compact = compactStops(route.stops);
  return (
    <article className={`journey-card ${tone}`}>
      <div className="journey-card-header">
        <div>
          <span className={`route-status ${route.status}`}>
            {route.status === "unavailable" ? <CircleAlert size={14} aria-hidden="true" /> : <BadgeCheck size={14} aria-hidden="true" />}
            {route.status === "unavailable" ? "Interrupted" : "Verified route"}
          </span>
          <h3>{route.label}</h3>
        </div>
        <LineBadges lines={route.routeLines} />
      </div>
      <p className="journey-summary">{route.summary}</p>
      <ol className="journey-timeline">
        {compact.map((stop, index) => (
          <li key={`${stop.station.id}-${index}`}>
            <span className="timeline-marker" aria-hidden="true">{index + 1}</span>
            <div>
              <strong>{stop.station.name}</strong>
              <span>{stop.note}</span>
            </div>
          </li>
        ))}
      </ol>
      {route.warnings.length > 0 && (
        <div className="warning-box">
          <AlertTriangle size={18} aria-hidden="true" />
          <div>
            <strong>{route.warnings.length} route {route.warnings.length === 1 ? "notice" : "notices"}</strong>
            <span>{route.warnings[0]}</span>
          </div>
        </div>
      )}
    </article>
  );
}

function EvidenceCard({ evidence }: { evidence: Evidence }) {
  const labels: Record<Evidence["sourceType"], string> = {
    "official-live": "Official · live",
    "official-static": "Official · static",
    "open-map": "Open map",
    community: "Community",
    model: "Model estimate",
    simulation: "Simulation"
  };
  return (
    <article className="evidence-card">
      <div className="evidence-card-top">
        <span className={`source-pill source-${evidence.sourceType}`}>{labels[evidence.sourceType]}</span>
        <span className={`confidence confidence-${evidence.confidence}`}><Check size={13} aria-hidden="true" /> {evidence.confidence}</span>
      </div>
      <p>{evidence.claim}</p>
      <div className="evidence-meta">
        <a href={evidence.sourceUrl} target="_blank" rel="noreferrer">
          {evidence.sourceName}<ExternalLink size={13} aria-hidden="true" />
        </a>
        <time dateTime={evidence.observedAt}>{formatObservedAt(evidence.observedAt)}</time>
      </div>
    </article>
  );
}

function IntegrationGrid({ integrations }: { integrations: IntegrationStatus[] }) {
  const icons: Record<string, React.ReactNode> = {
    gemma: <BrainCircuit size={19} />,
    tabpfn: <Gauge size={19} />,
    render: <Server size={19} />,
    digitalocean: <Cloud size={19} />,
    mastra: <GitBranch size={19} />,
    elevenlabs: <AudioLines size={19} />,
    serpapi: <Search size={19} />,
    mongodb: <Database size={19} />,
    sentry: <ShieldCheck size={19} />,
    temporal: <TimerReset size={19} />,
    tigerdata: <Database size={19} />,
    backboard: <Network size={19} />,
    tinker: <Sparkles size={19} />,
    mta: <TrainFront size={19} />
  };
  return (
    <div className="integration-grid">
      {integrations.map((integration) => (
        <article className="integration-card" key={integration.id}>
          <div className="integration-icon" aria-hidden="true">{icons[integration.id] ?? <Code2 size={19} />}</div>
          <div>
            <strong>{integration.name}</strong>
            <p>{integration.role}</p>
          </div>
          <span className={`integration-state state-${integration.state}`}>
            <i /> {integration.state}
          </span>
        </article>
      ))}
    </div>
  );
}

function App() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "light";
    const savedTheme = window.localStorage.getItem("accesspath-theme");
    if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });
  const [bootstrap, setBootstrap] = useState<BootstrapResponse | null>(null);
  const [originId, setOriginId] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [mode, setMode] = useState<DataMode>("scenario");
  const [profile, setProfile] = useState<AccessibilityProfile>(defaultProfile);
  const [plan, setPlan] = useState<PlanWithPersistence | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const resultRef = useRef<HTMLElement>(null);
  const autoRan = useRef(false);

  const stationOptions = useMemo(() => bootstrap?.stations ?? [], [bootstrap]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem("accesspath-theme", theme);
  }, [theme]);

  async function runPlan(overrides?: {
    originId?: string;
    destinationId?: string;
    mode?: DataMode;
    profile?: AccessibilityProfile;
    revealResults?: boolean;
  }) {
    const selectedOrigin = overrides?.originId ?? originId;
    const selectedDestination = overrides?.destinationId ?? destinationId;
    const selectedMode = overrides?.mode ?? mode;
    const selectedProfile = overrides?.profile ?? profile;
    if (!selectedOrigin || !selectedDestination) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/plan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ originId: selectedOrigin, destinationId: selectedDestination, mode: selectedMode, profile: selectedProfile })
      });
      const payload = await response.json() as PlanWithPersistence & { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Unable to plan this journey.");
      setPlan(payload);
      window.setTimeout(() => {
        resultRef.current?.focus({ preventScroll: true });
        if (overrides?.revealResults) {
          const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          resultRef.current?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" });
        }
      }, 120);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to plan this journey.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetch("/api/bootstrap")
      .then(async (response) => {
        if (!response.ok) throw new Error("The AccessPath data service is unavailable.");
        return response.json() as Promise<BootstrapResponse>;
      })
      .then((payload) => {
        setBootstrap(payload);
        setOriginId(payload.demo.originId);
        setDestinationId(payload.demo.destinationId);
      })
      .catch((loadError: Error) => setError(loadError.message));
  }, []);

  useEffect(() => {
    if (!bootstrap || autoRan.current) return;
    autoRan.current = true;
    void runPlan({ originId: bootstrap.demo.originId, destinationId: bootstrap.demo.destinationId, mode: "scenario" });
  }, [bootstrap]);

  function runOutageDemo() {
    if (!bootstrap) return;
    const demoProfile = { ...profile, stepFree: true, avoidLongWalks: true };
    setOriginId(bootstrap.demo.originId);
    setDestinationId(bootstrap.demo.destinationId);
    setMode("scenario");
    setProfile(demoProfile);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("planner")?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
    void runPlan({
      originId: bootstrap.demo.originId,
      destinationId: bootstrap.demo.destinationId,
      mode: "scenario",
      profile: demoProfile,
      revealResults: true
    });
  }

  async function playBriefing() {
    if (!plan) return;
    setSpeaking(true);
    const text = `${plan.narrative} ${plan.recommended.warnings.length ? `Please note: ${plan.recommended.warnings[0]}` : ""}`;
    try {
      const response = await fetch("/api/voice", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text })
      });
      if (response.ok && response.status !== 204) {
        const audio = new Audio(URL.createObjectURL(await response.blob()));
        audio.addEventListener("ended", () => setSpeaking(false), { once: true });
        await audio.play();
        return;
      }
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95;
        utterance.onend = () => setSpeaking(false);
        utterance.onerror = () => setSpeaking(false);
        window.speechSynthesis.speak(utterance);
        return;
      }
    } catch {
      // Browser speech is a privacy-safe fallback when the optional partner API is unavailable.
    }
    setSpeaking(false);
  }

  function downloadPlan() {
    if (!plan) return;
    const blob = new Blob([JSON.stringify(plan, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `accesspath-${plan.requestId}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  const dataState = mode === "live" ? "Live MTA" : mode === "scenario" ? "Replay + simulation" : "Verified replay";

  return (
    <div className="app-shell">
      <header className="site-header">
        <a href="#top" className="brand" aria-label="AccessPath home">
          <span className="brand-mark" aria-hidden="true"><Waypoints size={24} /></span>
          <span>Access<span>Path</span></span>
        </a>
        <nav className={mobileOpen ? "open" : ""} aria-label="Primary navigation">
          <a href="#planner" onClick={() => setMobileOpen(false)}>Plan a journey</a>
          <a href="#evidence" onClick={() => setMobileOpen(false)}>Evidence</a>
          <a href="#technology" onClick={() => setMobileOpen(false)}>How it works</a>
          <a href="#story" onClick={() => setMobileOpen(false)}>Why we built it</a>
        </nav>
        <div className="header-actions">
          <span className="network-status"><i /> {dataState}</span>
          <button
            className="theme-toggle"
            type="button"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            aria-pressed={theme === "dark"}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            onClick={() => setTheme((currentTheme) => currentTheme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun size={19} aria-hidden="true" /> : <Moon size={19} aria-hidden="true" />}
          </button>
          <a className="header-cta" href="#planner">Open planner <ArrowRight size={16} aria-hidden="true" /></a>
          <button className="mobile-menu" aria-label={mobileOpen ? "Close navigation" : "Open navigation"} aria-expanded={mobileOpen} onClick={() => setMobileOpen((open) => !open)}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      <main id="main-content">
        <section className="hero" id="top">
          <div className="hero-copy">
            <span className="eyebrow"><ShieldCheck size={15} aria-hidden="true" /> Evidence-first accessible journeys</span>
            <h1>Know before<br />you <em>go.</em></h1>
            <p>
              AccessPath finds routes that respect your real access needs, checks the infrastructure they depend on,
              and builds a backup before something goes wrong.
            </p>
            <div className="hero-actions">
              <a className="button primary" href="#planner"><Route size={18} aria-hidden="true" /> Plan my route</a>
              <button className="button secondary" onClick={runOutageDemo} disabled={!bootstrap || loading}>
                <RefreshCw className={loading ? "spin" : undefined} size={18} aria-hidden="true" />
                {loading ? "Running demo…" : "Run the outage demo"}
              </button>
            </div>
            <div className="trust-row" aria-label="AccessPath principles">
              <span><Check size={16} aria-hidden="true" /> Open-weight AI</span>
              <span><Check size={16} aria-hidden="true" /> Sources on every claim</span>
              <span><Check size={16} aria-hidden="true" /> Unknown stays unknown</span>
            </div>
          </div>
          <div className="hero-visual" aria-hidden="true">
            <div className="visual-orbit orbit-one" />
            <div className="visual-orbit orbit-two" />
            <div className="hero-phone">
              <div className="phone-top"><span>AccessPath</span><i /></div>
              <div className="phone-map">
                <svg viewBox="0 0 280 330">
                  <path d="M35 280 C80 238 45 182 100 153 C154 124 125 58 207 28" fill="none" stroke="#e2ece8" strokeWidth="52" strokeLinecap="round" />
                  <path d="M30 286 C84 240 45 184 102 153 C153 126 129 64 213 29" fill="none" stroke="#0f766e" strokeWidth="9" strokeLinecap="round" />
                  <path d="M102 153 C155 162 198 145 246 104" fill="none" stroke="#e26b49" strokeWidth="7" strokeLinecap="round" strokeDasharray="8 10" />
                  {[{x:30,y:286},{x:102,y:153},{x:213,y:29}].map((point, index) => <circle key={index} cx={point.x} cy={point.y} r="9" fill="#fff" stroke="#0f766e" strokeWidth="5" />)}
                  <circle cx="199" cy="143" r="18" fill="#fff2ed" stroke="#d84f2b" strokeWidth="3" />
                  <path d="M192 136 206 150M206 136 192 150" stroke="#d84f2b" strokeWidth="4" strokeLinecap="round" />
                </svg>
                <span className="phone-alert"><AlertTriangle size={14} /> Lift outage detected</span>
              </div>
              <div className="phone-route-card">
                <span>Backup ready</span>
                <strong>Times Sq transfer</strong>
                <small>60 min · 97% confidence</small>
              </div>
            </div>
            <div className="floating-note note-one"><BadgeCheck size={18} /><span><strong>Verified</strong>MTA access data</span></div>
            <div className="floating-note note-two"><TimerReset size={18} /><span><strong>Replanned</strong>before departure</span></div>
          </div>
        </section>

        <section className="story-strip" id="story">
          <div>
            <span className="story-number">01</span>
            <p>Built for a friend whose “accessible” route can become impossible when one lift fails.</p>
          </div>
          <div>
            <span className="story-number">02</span>
            <p>Open-source AI keeps personal access needs portable and explainable.</p>
          </div>
          <div>
            <span className="story-number">03</span>
            <p>Hard constraints and public evidence decide the route—not an LLM guess.</p>
          </div>
        </section>

        <section className="planner-section" id="planner">
          <div className="section-heading narrow-heading">
            <span className="eyebrow"><MapPin size={14} aria-hidden="true" /> Journey lab</span>
            <h2>Plan around the barriers,<br /><em>not through them.</em></h2>
            <p>Start with what you need. AccessPath will show what it knows, what changed, and what remains uncertain.</p>
          </div>

          <div className="planner-layout">
            <form className="planner-panel" onSubmit={(event) => { event.preventDefault(); void runPlan(); }}>
              <div className="panel-heading">
                <div><span>01</span><h3>Where are you going?</h3></div>
                <Map size={22} aria-hidden="true" />
              </div>
              <label className="field-label" htmlFor="origin">Starting station</label>
              <div className="select-wrap">
                <MapPin size={18} aria-hidden="true" />
                <select id="origin" value={originId} onChange={(event) => setOriginId(event.target.value)} disabled={!bootstrap}>
                  {stationOptions.map((station) => <option key={station.id} value={station.id}>{station.name} · {station.daytimeRoutes.join(" ")}</option>)}
                </select>
                <ChevronDown size={18} aria-hidden="true" />
              </div>
              <div className="route-connector" aria-hidden="true"><span /><i /><span /></div>
              <label className="field-label" htmlFor="destination">Destination station</label>
              <div className="select-wrap">
                <MapPin size={18} aria-hidden="true" />
                <select id="destination" value={destinationId} onChange={(event) => setDestinationId(event.target.value)} disabled={!bootstrap}>
                  {stationOptions.map((station) => <option key={station.id} value={station.id}>{station.name} · {station.daytimeRoutes.join(" ")}</option>)}
                </select>
                <ChevronDown size={18} aria-hidden="true" />
              </div>

              <div className="panel-heading preferences-heading">
                <div><span>02</span><h3>What do you need?</h3></div>
                <Accessibility size={23} aria-hidden="true" />
              </div>
              <div className="preferences-grid">
                <Toggle checked={profile.stepFree} onChange={(stepFree) => setProfile({ ...profile, stepFree })} title="Step-free" description="No stairs on critical paths" icon={<Accessibility size={19} />} />
                <Toggle checked={profile.avoidLongWalks} onChange={(avoidLongWalks) => setProfile({ ...profile, avoidLongWalks })} title="Short transfers" description="Penalize long station changes" icon={<Waypoints size={19} />} />
                <Toggle checked={profile.avoidCrowds} onChange={(avoidCrowds) => setProfile({ ...profile, avoidCrowds })} title="Lower crowds" description="Prefer calmer alternatives" icon={<Network size={19} />} />
                <Toggle checked={profile.needsAccessibleToilet} onChange={(needsAccessibleToilet) => setProfile({ ...profile, needsAccessibleToilet })} title="Accessible toilet" description="Include nearby facilities" icon={<Landmark size={19} />} />
              </div>
              <label className="field-label" htmlFor="notes">Tell AccessPath anything else</label>
              <textarea id="notes" value={profile.notes} onChange={(event) => setProfile({ ...profile, notes: event.target.value })} rows={3} />
              <ModeSelector value={mode} onChange={setMode} />
              {error && <div className="form-error" role="alert"><CircleAlert size={18} aria-hidden="true" />{error}</div>}
              <button className="plan-button" type="submit" disabled={loading || !bootstrap}>
                {loading ? <RefreshCw className="spin" size={19} aria-hidden="true" /> : <Route size={19} aria-hidden="true" />}
                {loading ? "Checking evidence…" : "Build my access plan"}
                {!loading && <ArrowRight size={18} aria-hidden="true" />}
              </button>
              <p className="privacy-note"><ShieldCheck size={15} aria-hidden="true" /> Personal notes are interpreted locally when Gemma is configured.</p>
            </form>

            <section className="result-panel" ref={resultRef} tabIndex={-1} aria-live="polite" aria-busy={loading}>
              {plan ? (
                <>
                  <RouteCanvas plan={plan} />
                  <div className="narrative-card">
                    <div className="narrative-icon"><BrainCircuit size={23} aria-hidden="true" /></div>
                    <div>
                      <span>AccessPath briefing</span>
                      <p>{plan.narrative}</p>
                    </div>
                    <button onClick={() => void playBriefing()} disabled={speaking} aria-label="Play spoken journey briefing">
                      {speaking ? <AudioLines className="pulse" size={20} aria-hidden="true" /> : <Volume2 size={20} aria-hidden="true" />}
                      {speaking ? "Speaking" : "Listen"}
                    </button>
                  </div>
                </>
              ) : (
                <div className="result-empty">
                  <Map size={42} aria-hidden="true" />
                  <h3>Your evidence-backed route will appear here.</h3>
                  <p>Select two stations and tell AccessPath what the journey must accommodate.</p>
                </div>
              )}
            </section>
          </div>
        </section>

        {plan && (
          <>
            <section className="comparison-section">
              <div className="section-heading comparison-heading">
                <span className="eyebrow"><RefreshCw size={14} aria-hidden="true" /> Disruption-aware planning</span>
                <h2>Plan A failed.<br /><em>Plan B was already waiting.</em></h2>
                <p>The simulation changes one infrastructure fact. AccessPath reruns the same hard constraints instead of quietly relaxing them.</p>
              </div>
              <div className="journey-comparison">
                {plan.disrupted && <JourneyCard route={plan.disrupted} tone="muted" />}
                <div className="comparison-arrow" aria-hidden="true"><ArrowRight size={24} /></div>
                <JourneyCard route={plan.recommended} tone="strong" />
              </div>
            </section>

            <section className="evidence-section" id="evidence">
              <div className="evidence-intro">
                <span className="eyebrow light-eyebrow"><FileCheck2 size={14} aria-hidden="true" /> Evidence ledger</span>
                <h2>Every claim<br />earns its place.</h2>
                <p>Source, timestamp, and confidence travel with the recommendation. Simulations and predictions cannot masquerade as live facts.</p>
                <button className="button light-outline" onClick={downloadPlan}><Download size={17} aria-hidden="true" /> Export the audit trail</button>
              </div>
              <div className="evidence-list">
                {plan.evidence.map((evidence) => <EvidenceCard evidence={evidence} key={evidence.id} />)}
              </div>
            </section>

            <section className="technology-section" id="technology">
              <div className="section-heading technology-heading">
                <span className="eyebrow"><Network size={14} aria-hidden="true" /> Open system, observable decisions</span>
                <h2>AI interprets.<br /><em>Evidence decides.</em></h2>
                <p>Each partner owns a real system responsibility. The app degrades visibly when a service is not configured.</p>
              </div>
              <div className="architecture-flow" aria-label="AccessPath processing architecture">
                <div><Accessibility size={22} /><strong>Access needs</strong><span>Private rider constraints</span></div>
                <ArrowRight size={20} aria-hidden="true" />
                <div><BrainCircuit size={22} /><strong>Gemma + Mastra</strong><span>Interpret and orchestrate</span></div>
                <ArrowRight size={20} aria-hidden="true" />
                <div><TrainFront size={22} /><strong>MTA + TabPFN</strong><span>Verify and score risk</span></div>
                <ArrowRight size={20} aria-hidden="true" />
                <div><Route size={22} /><strong>Route engine</strong><span>Enforce hard constraints</span></div>
              </div>
              <IntegrationGrid integrations={plan.integrations} />
              <details className="trace-panel">
                <summary><Code2 size={18} aria-hidden="true" /> How this plan was built <span>{plan.trace.length} checks</span></summary>
                <p className="trace-help">
                  Each check completed. A built-in fallback means an optional service was unavailable, so AccessPath used local rules or bundled official sources instead.
                </p>
                <ol>
                  {plan.trace.map((step, index) => (
                    <li key={`${step.step}-${index}`}>
                      <span className={`trace-state ${step.status}`}><Check size={14} aria-hidden="true" /></span>
                      <div className="trace-copy">
                        <div className="trace-heading">
                          <strong>{step.step}</strong>
                          <span className={`trace-label ${step.status}`}>{step.status === "complete" ? "Completed" : "Built-in fallback"}</span>
                        </div>
                        <p>{step.detail}</p>
                      </div>
                      <time aria-label={step.durationMs === 0 ? "Less than one millisecond" : `${step.durationMs} milliseconds`}>
                        {step.durationMs === 0 ? "<1 ms" : `${step.durationMs} ms`}
                      </time>
                    </li>
                  ))}
                </ol>
              </details>
            </section>

            <section className="closing-section">
              <div>
                <span className="eyebrow"><Accessibility size={14} aria-hidden="true" /> Build for a friend</span>
                <h2>A route is only useful<br />if your friend can <em>actually take it.</em></h2>
              </div>
              <a href="#planner" className="closing-cta">Plan another journey <ArrowRight size={18} aria-hidden="true" /></a>
            </section>
          </>
        )}
      </main>

      <footer>
        <div className="brand footer-brand"><span className="brand-mark" aria-hidden="true"><Waypoints size={22} /></span><span>Access<span>Path</span></span></div>
        <p>Open-source AI for journeys that respect the whole person.</p>
        <div><span>Data: MTA Open Data</span><span>Built for Hacktoberfest 2026</span></div>
      </footer>
    </div>
  );
}

export default App;
