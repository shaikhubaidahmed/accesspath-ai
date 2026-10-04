import type { DataMode, MtaOutage } from "../../shared/types.js";
import type { DataStore } from "../data-store.js";

const outageUrl = "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fnyct_ene.json";

export type OutageResult = {
  records: MtaOutage[];
  state: "live" | "replay" | "fallback" | "scenario";
  observedAt: string;
  detail: string;
};

function current(records: MtaOutage[]): MtaOutage[] {
  return records.filter((record) => record.isupcomingoutage !== "Y");
}

export async function getOutages(mode: DataMode, store: DataStore): Promise<OutageResult> {
  if (mode === "scenario") {
    return {
      records: [store.scenario.record, ...current(store.outages.records)],
      state: "scenario",
      observedAt: store.scenario.capturedAt,
      detail: "A labelled transfer-lift failure is injected into the official replay snapshot."
    };
  }
  if (mode === "replay") {
    return {
      records: current(store.outages.records),
      state: "replay",
      observedAt: store.outages.capturedAt,
      detail: "Timestamped MTA response bundled for a deterministic demonstration."
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4_500);
  try {
    const response = await fetch(outageUrl, {
      headers: { "user-agent": "AccessPath/0.1" },
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`MTA returned ${response.status}`);
    const records = current((await response.json()) as MtaOutage[]);
    return {
      records,
      state: "live",
      observedAt: new Date().toISOString(),
      detail: "Current MTA elevator and escalator outage feed."
    };
  } catch {
    return {
      records: current(store.outages.records),
      state: "fallback",
      observedAt: store.outages.capturedAt,
      detail: "Live MTA request failed; AccessPath used its timestamped snapshot."
    };
  } finally {
    clearTimeout(timeout);
  }
}

export const mtaOutageUrl = outageUrl;
