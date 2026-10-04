import type { AccessibilityProfile, JourneyRoute } from "../../shared/types.js";
import { config } from "../config.js";
import { accessibilityProfileSchema } from "../schemas.js";

type InterpreterModel = "tinker" | "gemma" | "rules";

function profileFallback(profile: AccessibilityProfile): AccessibilityProfile {
  const notes = profile.notes.toLowerCase();
  return {
    ...profile,
    stepFree: profile.stepFree || /wheelchair|step[- ]?free|no stairs|walker/.test(notes),
    avoidLongWalks: profile.avoidLongWalks || /short walk|fatigue|limited walking|pain/.test(notes),
    avoidCrowds: profile.avoidCrowds || /quiet|crowd|sensory|anxious/.test(notes),
    needsAccessibleToilet: profile.needsAccessibleToilet || /toilet|restroom/.test(notes)
  };
}

async function ollamaJson<T>(prompt: string): Promise<T | undefined> {
  if (!config.ollamaBaseUrl) return undefined;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(`${config.ollamaBaseUrl}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model: config.ollamaModel,
        stream: false,
        format: "json",
        messages: [
          {
            role: "system",
            content: "You are AccessPath's local accessibility interpreter. Return only valid JSON. Never invent infrastructure facts."
          },
          { role: "user", content: prompt }
        ]
      }),
      signal: controller.signal
    });
    if (!response.ok) return undefined;
    const payload = (await response.json()) as { message?: { content?: string } };
    if (!payload.message?.content) return undefined;
    return JSON.parse(payload.message.content) as T;
  } catch {
    return undefined;
  } finally {
    clearTimeout(timeout);
  }
}

async function tinkerJson<T>(prompt: string): Promise<T | undefined> {
  if (!config.tinkerInferenceUrl || !config.tinkerModel) return undefined;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(`${config.tinkerInferenceUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(config.tinkerInferenceToken ? { authorization: `Bearer ${config.tinkerInferenceToken}` } : {})
      },
      body: JSON.stringify({
        model: config.tinkerModel,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Convert the rider note to JSON with stepFree, avoidLongWalks, avoidCrowds, needsAccessibleToilet, maximumWalkMinutes, and notes. Preserve explicit values. Return JSON only."
          },
          { role: "user", content: prompt }
        ]
      }),
      signal: controller.signal
    });
    if (!response.ok) return undefined;
    const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = payload.choices?.[0]?.message?.content;
    return content ? (JSON.parse(content) as T) : undefined;
  } catch {
    return undefined;
  } finally {
    clearTimeout(timeout);
  }
}

function validatedProfile(candidate: unknown, fallback: AccessibilityProfile): AccessibilityProfile | undefined {
  if (!candidate || typeof candidate !== "object") return undefined;
  const parsed = accessibilityProfileSchema.safeParse({
    ...fallback,
    ...candidate,
    notes: fallback.notes
  });
  return parsed.success ? parsed.data : undefined;
}

export async function interpretProfile(profile: AccessibilityProfile): Promise<{ profile: AccessibilityProfile; model: InterpreterModel }> {
  const fallback = profileFallback(profile);
  const prompt = `Rider preferences and note:\n${JSON.stringify(fallback)}`;

  const tuned = validatedProfile(await tinkerJson<Partial<AccessibilityProfile>>(prompt), fallback);
  if (tuned) return { profile: tuned, model: "tinker" };

  const gemma = validatedProfile(
    await ollamaJson<Partial<AccessibilityProfile>>(
      `Interpret this preference object and free-text note into accessibility constraints. Preserve explicit values.\n${JSON.stringify(fallback)}\nReturn the same six keys.`
    ),
    fallback
  );
  if (gemma) return { profile: gemma, model: "gemma" };
  return { profile: fallback, model: "rules" };
}

export async function explainRoute(route: JourneyRoute, profile: AccessibilityProfile): Promise<{ text: string; model: "gemma" | "template" }> {
  const response = await ollamaJson<{ explanation: string }>(
    `Explain this route in two concise sentences for a rider. Mention the transfer count, evidence confidence, and relevant preference. Do not add facts.\nProfile: ${JSON.stringify(profile)}\nRoute: ${JSON.stringify(route)}`
  );
  if (response?.explanation) return { text: response.explanation, model: "gemma" };
  const preference = profile.avoidLongWalks ? "keeps station changes limited" : "prioritizes verified step-free transfers";
  return {
    text: `${route.label} takes about ${route.durationMinutes} minutes with ${route.transferCount} ${route.transferCount === 1 ? "transfer" : "transfers"}. It ${preference}, and every boarding or transfer point is checked against MTA accessibility records.`,
    model: "template"
  };
}
