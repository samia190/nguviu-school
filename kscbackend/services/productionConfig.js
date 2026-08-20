const isPlaceholder = (value = "") => /your-|example|changeme|change-this|password@cluster/i.test(value);
import { validateOptionalIdentityProviderConfiguration } from "./optionalIdentityProviders.js";

export function validateProductionConfiguration() {
  if (process.env.NODE_ENV !== "production") return;
  const failures = [];
  const warnings = [];
  const corsOrigins = (process.env.CORS_ORIGINS || "").split(",").map((value) => value.trim()).filter(Boolean);

  if (corsOrigins.length === 0) failures.push("CORS_ORIGINS must list the approved frontend origins.");
  if (!process.env.MONGO_URI || isPlaceholder(process.env.MONGO_URI)) failures.push("A non-placeholder MONGO_URI is required.");
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 48 || isPlaceholder(process.env.JWT_SECRET)) failures.push("JWT_SECRET must be a non-placeholder random secret of at least 48 characters.");
  if (!process.env.CLOUDINARY_CLOUD_NAME && !process.env.S3_BUCKET) failures.push("Private object storage must be configured through Cloudinary or S3; local uploads are not production storage.");
  if (!process.env.RESEND_API_KEY || !process.env.FRONTEND_URL) warnings.push("Secure bulk account imports remain unavailable until RESEND_API_KEY and FRONTEND_URL are configured for one-time password setup links.");
  failures.push(...validateOptionalIdentityProviderConfiguration());

  const providerConfigured = Boolean(process.env.GROQ_API_KEY || process.env.OPENROUTER_API_KEY || process.env.NVIDIA_API_KEY);
  if (process.env.REQUIRE_AI_PROVIDER === "true" && !providerConfigured) failures.push("At least one server-side AI provider credential is required when REQUIRE_AI_PROVIDER=true.");
  if (!providerConfigured) warnings.push("No external AI provider is configured; the assistant will fall back to the local knowledge response path.");

  if (process.env.ENABLE_LIVE_INVIGILATION === "true") {
    if (!process.env.STUN_TURN_SERVERS || !process.env.STUN_TURN_SERVERS.includes("turn:")) failures.push("Live invigilation requires a configured TURN server in STUN_TURN_SERVERS.");
    if (!process.env.TURN_USERNAME || !process.env.TURN_PASSWORD) failures.push("Live invigilation requires TURN_USERNAME and TURN_PASSWORD.");
    if (!process.env.RECORDING_STORAGE_BUCKET) warnings.push("Recording remains unavailable until RECORDING_STORAGE_BUCKET is configured.");
  }

  if (warnings.length) console.warn("[Production configuration warnings]", warnings.join(" "));
  if (failures.length) throw new Error(`Unsafe production configuration: ${failures.join(" ")}`);
}
