import { MongoClient } from "mongodb";
import pg from "pg";
import type { PlanResponse } from "../shared/types.js";
import { config } from "./config.js";

const memoryPlans: PlanResponse[] = [];
let mongoClient: MongoClient | undefined;
let tigerPool: pg.Pool | undefined;

export async function persistPlan(plan: PlanResponse): Promise<"mongodb+tiger" | "mongodb" | "tiger" | "memory"> {
  let usedMongo = false;
  let usedTiger = false;

  if (config.mongodbUri) {
    try {
      mongoClient ??= new MongoClient(config.mongodbUri);
      await mongoClient.connect();
      await mongoClient.db(config.mongodbDatabase).collection("journey_plans").insertOne({
        ...plan,
        generatedAt: new Date(plan.generatedAt),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
      usedMongo = true;
    } catch {
      usedMongo = false;
    }
  }

  if (config.tigerDatabaseUrl) {
    try {
      tigerPool ??= new pg.Pool({ connectionString: config.tigerDatabaseUrl, max: 2 });
      await tigerPool.query(`
        CREATE TABLE IF NOT EXISTS accesspath_evidence_events (
          id BIGSERIAL PRIMARY KEY,
          request_id TEXT NOT NULL,
          observed_at TIMESTAMPTZ NOT NULL,
          source_type TEXT NOT NULL,
          claim TEXT NOT NULL,
          source_url TEXT NOT NULL
        )
      `);
      for (const evidence of plan.evidence) {
        await tigerPool.query(
          "INSERT INTO accesspath_evidence_events (request_id, observed_at, source_type, claim, source_url) VALUES ($1, $2, $3, $4, $5)",
          [plan.requestId, evidence.observedAt, evidence.sourceType, evidence.claim, evidence.sourceUrl]
        );
      }
      usedTiger = true;
    } catch {
      usedTiger = false;
    }
  }

  if (!usedMongo && !usedTiger) {
    memoryPlans.unshift(plan);
    memoryPlans.splice(25);
    return "memory";
  }
  if (usedMongo && usedTiger) return "mongodb+tiger";
  return usedMongo ? "mongodb" : "tiger";
}

export function recentMemoryPlans(): PlanResponse[] {
  return memoryPlans;
}
