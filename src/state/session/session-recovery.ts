import {
  sessionSchema,
  metaSectionSchema,
  transportSectionSchema,
  mixerSectionSchema,
  createDefaultSession,
  SESSION_VERSION,
  type SessionSchema,
} from "./session-schema";
import { z } from "zod/v4";

export type RecoveryResult = {
  session: SessionSchema;
  warnings: string[];
};

export function recoverSession(raw: string): RecoveryResult {
  const warnings: string[] = [];
  const defaults = createDefaultSession();

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      session: defaults,
      warnings: ["Malformed JSON - using default session"],
    };
  }

  // Try full schema parse first
  const fullResult = sessionSchema.safeParse(parsed);
  if (fullResult.success) {
    return { session: fullResult.data, warnings: [] };
  }

  // Guard against non-object JSON values (null, number, string, array)
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return {
      session: defaults,
      warnings: ["Session data is not an object - using default session"],
    };
  }

  // Partial recovery: parse each section independently
  const obj = parsed as Record<string, unknown>;

  const metaResult = metaSectionSchema.safeParse(obj["meta"]);
  const meta = metaResult.success ? metaResult.data : defaults.meta;
  if (!metaResult.success) {
    warnings.push("Invalid meta section - using defaults");
  }

  const transportResult = transportSectionSchema.safeParse(obj["transport"]);
  const transport = transportResult.success
    ? transportResult.data
    : defaults.transport;
  if (!transportResult.success) {
    warnings.push("Invalid transport section - using defaults");
  }

  const tracksResult = z.array(z.unknown()).safeParse(obj["tracks"]);
  const tracks = tracksResult.success ? tracksResult.data : defaults.tracks;
  if (!tracksResult.success) {
    warnings.push("Invalid tracks section - using defaults");
  }

  const mixerResult = mixerSectionSchema.safeParse(obj["mixer"]);
  const mixer = mixerResult.success ? mixerResult.data : defaults.mixer;
  if (!mixerResult.success) {
    warnings.push("Invalid mixer section - using defaults");
  }

  const version =
    typeof obj["version"] === "number" ? obj["version"] : SESSION_VERSION;
  if (typeof obj["version"] !== "number") {
    warnings.push("Missing or invalid version - using current version");
  }

  return {
    session: { version, meta, transport, tracks, mixer },
    warnings,
  };
}
