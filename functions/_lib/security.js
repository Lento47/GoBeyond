import { defaultContent } from "../../src/data/defaultContent";
import { parseJsonOrNull } from "./util";

const defaultSecuritySettings = {
  allowAdminPasswordChange: defaultContent.securitySettings?.allowAdminPasswordChange ?? true,
  allowAdminResetNotification: defaultContent.securitySettings?.allowAdminResetNotification ?? true,
  allowAdminVerificationNotification: defaultContent.securitySettings?.allowAdminVerificationNotification ?? true,
  passwordExpirationEnabled: defaultContent.securitySettings?.passwordExpirationEnabled ?? false,
  passwordExpirationDays: Number(defaultContent.securitySettings?.passwordExpirationDays ?? 90),
  requireEmailVerification: defaultContent.securitySettings?.requireEmailVerification ?? true,
  supportEmail: String(defaultContent.securitySettings?.supportEmail ?? "it@gobeyondcr.org").trim(),
};

export function normalizeSecuritySettings(value = {}) {
  const passwordExpirationDays = Number.parseInt(String(value.passwordExpirationDays ?? defaultSecuritySettings.passwordExpirationDays), 10);

  return {
    allowAdminPasswordChange: value.allowAdminPasswordChange !== false,
    allowAdminResetNotification: value.allowAdminResetNotification !== false,
    allowAdminVerificationNotification: value.allowAdminVerificationNotification !== false,
    passwordExpirationEnabled: Boolean(value.passwordExpirationEnabled),
    passwordExpirationDays:
      Number.isInteger(passwordExpirationDays) && passwordExpirationDays >= 1 && passwordExpirationDays <= 3650
        ? passwordExpirationDays
        : defaultSecuritySettings.passwordExpirationDays,
    requireEmailVerification: value.requireEmailVerification !== false,
    supportEmail: String(value.supportEmail ?? defaultSecuritySettings.supportEmail).trim() || defaultSecuritySettings.supportEmail,
  };
}

export async function getSecuritySettings(env) {
  const row = await env.DB.prepare(
    "SELECT value_json FROM content_blocks WHERE block_key = 'securitySettings' LIMIT 1"
  ).first();

  if (!row?.value_json) {
    return normalizeSecuritySettings(defaultSecuritySettings);
  }

  return normalizeSecuritySettings(parseJsonOrNull(row.value_json) ?? defaultSecuritySettings);
}

export function getPasswordExpiresAt(passwordChangedAt, settings) {
  if (!settings?.passwordExpirationEnabled) {
    return null;
  }

  const baseDate = new Date(passwordChangedAt || Date.now());
  if (Number.isNaN(baseDate.getTime())) {
    return null;
  }

  return new Date(baseDate.getTime() + settings.passwordExpirationDays * 24 * 60 * 60 * 1000).toISOString();
}

export function isPasswordExpired(passwordChangedAt, settings) {
  const expiresAt = getPasswordExpiresAt(passwordChangedAt, settings);
  if (!expiresAt) {
    return false;
  }

  return new Date(expiresAt).getTime() <= Date.now();
}
