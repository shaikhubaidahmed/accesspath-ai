export type DataMode = "live" | "replay" | "scenario";

export type AccessibilityProfile = {
  stepFree: boolean;
  avoidLongWalks: boolean;
  avoidCrowds: boolean;
  needsAccessibleToilet: boolean;
  maximumWalkMinutes: number;
  notes: string;
};

export type Station = {
  id: string;
  complexId: string;
  name: string;
  borough: string;
  lat: number;
  lon: number;
  ada: 0 | 1 | 2;
  adaNorthbound: 0 | 1;
  adaSouthbound: 0 | 1;
  adaNotes: string | null;
  daytimeRoutes: string[];
};

export type RouteEdge = {
  to: string;
  routes: string[];
  minutes: number;
};

export type SubwayGraph = {
  generatedAt: string;
  sources: Array<{ name: string; url: string }>;
  stations: Record<string, Station>;
  adjacency: Record<string, RouteEdge[]>;
  routes: Record<string, { id: string; name: string; color: string }>;
};

export type MtaOutage = {
  station: string;
  trainno: string;
  equipment: string;
  equipmenttype: string;
  serving: string;
  ADA: string;
  outagedate: string;
  estimatedreturntoservice: string;
  reason: string;
  isupcomingoutage: string;
  ismaintenanceoutage: string;
};

export type MtaEquipment = {
  station: string;
  trainno: string;
  equipmentno: string;
  equipmenttype: string;
  serving: string;
  ADA: string;
  shortdescription: string;
  linesservedbyelevator: string;
  elevatorsgtfsstopid: string;
  stationcomplexid: string;
  redundant: string;
  alternativeroute: string;
  isactive: string;
};

export type ReliabilityProfile = {
  complexId: string;
  stationName: string;
  historicalAvailability: number;
  meanMonthlyUnscheduledOutages: number;
  risk: "low" | "moderate" | "elevated";
  model: "historical-baseline" | "tabpfn";
  riskProbability?: number;
  asOf: string;
};

export type JourneyStop = {
  station: Station;
  route: string | null;
  action: "start" | "ride" | "transfer" | "arrive";
  note: string;
};

export type JourneyRoute = {
  id: string;
  label: string;
  status: "recommended" | "unavailable" | "alternative";
  durationMinutes: number;
  transferCount: number;
  confidence: number;
  risk: "low" | "moderate" | "elevated";
  summary: string;
  stops: JourneyStop[];
  routeLines: string[];
  warnings: string[];
};

export type Evidence = {
  id: string;
  claim: string;
  sourceName: string;
  sourceUrl: string;
  sourceType: "official-live" | "official-static" | "open-map" | "community" | "model" | "simulation";
  observedAt: string;
  freshness: string;
  confidence: "verified" | "high" | "medium" | "unknown";
};

export type IntegrationStatus = {
  id: string;
  name: string;
  role: string;
  state: "live" | "configured" | "fallback" | "unavailable";
  category: "featured" | "partner" | "open-source";
};

export type PlanRequest = {
  originId: string;
  destinationId: string;
  mode: DataMode;
  profile: AccessibilityProfile;
};

export type PlanResponse = {
  requestId: string;
  generatedAt: string;
  mode: DataMode;
  profile: AccessibilityProfile;
  narrative: string;
  recommended: JourneyRoute;
  disrupted?: JourneyRoute;
  alternative?: JourneyRoute;
  activeOutages: MtaOutage[];
  evidence: Evidence[];
  integrations: IntegrationStatus[];
  trace: Array<{ step: string; status: "complete" | "fallback"; durationMs: number; detail: string }>;
  disclaimer: string;
};

export type BootstrapResponse = {
  stations: Station[];
  demo: {
    originId: string;
    destinationId: string;
    title: string;
    description: string;
  };
  integrations: IntegrationStatus[];
  dataUpdatedAt: string;
};
