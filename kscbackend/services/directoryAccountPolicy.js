export const SCHOOL_ROLES = new Set(["student", "teacher", "staff", "admin", "superadmin"]);

export function canActivateDirectoryIdentity(identity, invite) {
  const inviteDirectoryId = invite?.directoryIdentity?._id || invite?.directoryIdentity;
  return Boolean(
    identity && invite && inviteDirectoryId &&
    String(inviteDirectoryId) === String(identity._id || identity.id || inviteDirectoryId) &&
    identity.role === invite.role && !identity.registrationLocked &&
    !["blocked", "active"].includes(identity.accountStatus)
  );
}

export function canUseSchoolAccount(user, identity) {
  if (!user?.isActive) return false;
  if (!SCHOOL_ROLES.has(user.role)) return true;
  return Boolean(identity && identity.accountStatus === "active" && !identity.registrationLocked && String(identity.accountUser) === String(user._id || user.id));
}

export function matchesActivationIdentifier(identity, identifier) {
  const raw = String(identifier || "").trim();
  const normalized = raw.toLowerCase();
  return Boolean(raw && identity && (
    normalized === String(identity.email || "").trim().toLowerCase() ||
    raw === String(identity.admissionNumber || "").trim() ||
    raw === String(identity.staffId || "").trim()
  ));
}

export function canUseDirectoryRecovery(user, identity) {
  return Boolean(user && (!SCHOOL_ROLES.has(user.role) || canUseSchoolAccount(user, identity)));
}
