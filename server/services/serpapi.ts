import type { Evidence, PlanResponse } from "../../shared/types.js";
import { config } from "../config.js";

type SerpPayload = {
  organic_results?: Array<{ title?: string; link?: string; snippet?: string; source?: string }>;
};

export async function findOfficialAccessEvidence(plan: PlanResponse): Promise<Evidence | undefined> {
  if (!config.serpApiKey) return undefined;
  const destination = plan.recommended.stops.at(-1)?.station.name;
  if (!destination) return undefined;
  const params = new URLSearchParams({
    engine: "google",
    q: `${destination} subway accessibility site:mta.info OR site:data.ny.gov`,
    api_key: config.serpApiKey,
    num: "5"
  });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);
  try {
    const response = await fetch(`https://serpapi.com/search.json?${params}`, { signal: controller.signal });
    if (!response.ok) return undefined;
    const payload = (await response.json()) as SerpPayload;
    const result = payload.organic_results?.find((entry) => {
      try {
        const host = new URL(entry.link ?? "").hostname;
        return host.endsWith("mta.info") || host.endsWith("data.ny.gov");
      } catch {
        return false;
      }
    });
    if (!result?.link) return undefined;
    return {
      id: "serpapi-official",
      claim: result.snippet || `Official accessibility information for ${destination}.`,
      sourceName: result.title || "Official destination evidence",
      sourceUrl: result.link,
      sourceType: "official-live",
      observedAt: new Date().toISOString(),
      freshness: "Discovered live through SerpApi; restricted to official domains",
      confidence: "high"
    };
  } catch {
    return undefined;
  } finally {
    clearTimeout(timeout);
  }
}
