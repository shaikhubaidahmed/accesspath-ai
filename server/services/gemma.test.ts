import { afterEach, describe, expect, it, vi } from "vitest";

const baseProfile = {
  stepFree: false,
  avoidLongWalks: false,
  avoidCrowds: false,
  needsAccessibleToilet: false,
  maximumWalkMinutes: 12,
  notes: "I use a wheelchair and need a quiet route."
};

const originalEnvironment = {
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL,
  tinkerInferenceUrl: process.env.TINKER_INFERENCE_URL,
  tinkerModel: process.env.TINKER_MODEL
};

function restore(name: string, value: string | undefined) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
  restore("OLLAMA_BASE_URL", originalEnvironment.ollamaBaseUrl);
  restore("TINKER_INFERENCE_URL", originalEnvironment.tinkerInferenceUrl);
  restore("TINKER_MODEL", originalEnvironment.tinkerModel);
});

describe("accessibility preference interpretation", () => {
  it("preserves hard needs with private deterministic rules when no model is configured", async () => {
    process.env.OLLAMA_BASE_URL = "";
    process.env.TINKER_INFERENCE_URL = "";
    process.env.TINKER_MODEL = "";
    const { interpretProfile } = await import("./gemma.js");
    const result = await interpretProfile(baseProfile);

    expect(result.model).toBe("rules");
    expect(result.profile.stepFree).toBe(true);
    expect(result.profile.avoidCrowds).toBe(true);
    expect(result.profile.notes).toBe(baseProfile.notes);
  });

  it("does not allow malformed model-shaped data to weaken validated constraints", async () => {
    process.env.OLLAMA_BASE_URL = "http://model.test";
    process.env.TINKER_INFERENCE_URL = "";
    process.env.TINKER_MODEL = "";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: { content: JSON.stringify({ stepFree: "sometimes", maximumWalkMinutes: 999 }) } }), {
        status: 200,
        headers: { "content-type": "application/json" }
      })
    );

    const { interpretProfile } = await import("./gemma.js");
    const result = await interpretProfile(baseProfile);
    expect(fetch).toHaveBeenCalledOnce();
    expect(result.model).toBe("rules");
    expect(result.profile.stepFree).toBe(true);
    expect(result.profile.maximumWalkMinutes).toBe(12);
  });

  it("uses a deployed Tinker adapter only after its JSON passes the profile schema", async () => {
    process.env.OLLAMA_BASE_URL = "";
    process.env.TINKER_INFERENCE_URL = "http://tinker.test";
    process.env.TINKER_MODEL = "accesspath-adapter";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  stepFree: true,
                  avoidLongWalks: true,
                  avoidCrowds: true,
                  needsAccessibleToilet: false,
                  maximumWalkMinutes: 8,
                  notes: "model must not replace this"
                })
              }
            }
          ]
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      )
    );

    const { interpretProfile } = await import("./gemma.js");
    const result = await interpretProfile(baseProfile);

    expect(result.model).toBe("tinker");
    expect(result.profile.maximumWalkMinutes).toBe(8);
    expect(result.profile.notes).toBe(baseProfile.notes);
  });
});
