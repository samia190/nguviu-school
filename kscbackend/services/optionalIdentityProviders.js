const enabled = (key) => process.env[key] === "true";
const configured = (keys) => keys.every((key) => Boolean(process.env[key]?.trim()));

export function getOptionalIdentityProviderStatus() {
  const googleConfigured = configured(["GOOGLE_OAUTH_CLIENT_ID", "GOOGLE_OAUTH_CLIENT_SECRET", "GOOGLE_OAUTH_REDIRECT_URI"]);
  const phoneOtpConfigured = configured(["SMS_OTP_PROVIDER", "SMS_API_URL", "SMS_API_KEY", "SMS_FROM"]);
  return {
    google: { enabled: enabled("ENABLE_GOOGLE_SIGN_IN") && googleConfigured, configured: googleConfigured },
    phoneOtp: { enabled: enabled("ENABLE_PHONE_OTP") && phoneOtpConfigured, configured: phoneOtpConfigured },
  };
}

export function validateOptionalIdentityProviderConfiguration() {
  const failures = [];
  const status = getOptionalIdentityProviderStatus();
  if (enabled("ENABLE_GOOGLE_SIGN_IN") && !status.google.configured) failures.push("ENABLE_GOOGLE_SIGN_IN requires GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, and GOOGLE_OAUTH_REDIRECT_URI.");
  if (enabled("ENABLE_PHONE_OTP") && !status.phoneOtp.configured) failures.push("ENABLE_PHONE_OTP requires SMS_OTP_PROVIDER, SMS_API_URL, SMS_API_KEY, and SMS_FROM.");
  return failures;
}
