import { createServer, type Server } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { createApp } from "./app.js";

let server: Server | undefined;

async function serve() {
  const app = createApp();
  server = createServer(app);
  await new Promise<void>((resolve) => server!.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Test server did not bind.");
  return `http://127.0.0.1:${address.port}`;
}

afterEach(async () => {
  if (!server) return;
  await new Promise<void>((resolve, reject) => server!.close((error) => (error ? reject(error) : resolve())));
  server = undefined;
});

describe("HTTP API", () => {
  it("reports official data freshness and integration truthfully", async () => {
    const baseUrl = await serve();
    const response = await fetch(`${baseUrl}/api/health`);
    const body = (await response.json()) as { ok: boolean; dataUpdatedAt: string; integrations: Array<{ id: string }> };

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(Date.parse(body.dataUpdatedAt)).not.toBeNaN();
    expect(body.integrations.some((integration) => integration.id === "gemma")).toBe(true);
  });

  it("rejects malformed planning requests with useful validation details", async () => {
    const baseUrl = await serve();
    const response = await fetch(`${baseUrl}/api/plan`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ originId: "", mode: "invented" })
    });
    const body = (await response.json()) as { error: string; details: unknown[] };

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid request");
    expect(body.details.length).toBeGreaterThan(0);
  });

  it("explains how to enable durable monitoring when Temporal is absent", async () => {
    const baseUrl = await serve();
    const response = await fetch(`${baseUrl}/api/monitor`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        originId: "723",
        destinationId: "R03",
        mode: "replay",
        profile: {
          stepFree: true,
          avoidLongWalks: true,
          avoidCrowds: false,
          needsAccessibleToilet: false,
          maximumWalkMinutes: 12,
          notes: ""
        }
      })
    });

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({ error: "Temporal is not configured." });
  });

  it("serves the simulation source with an explicit non-live label", async () => {
    const baseUrl = await serve();
    const response = await fetch(`${baseUrl}/api/evidence/scenario`);
    await expect(response.json()).resolves.toMatchObject({
      label: "SIMULATION",
      simulated: true,
      description: "Local demonstration record. This is not a live MTA outage."
    });
  });
});
