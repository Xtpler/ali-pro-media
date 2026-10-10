export const MASTER_ADMIN_EMAIL = "ha1900612@gmail.com";
export const APP_ORIGIN = "https://alipromedia4.com";
export const APP_NAME = "Ali Pro Media";

type AdminUserLike = { email?: string | null } | null | undefined;
type AdminProfileLike = { email?: string | null; role?: string | null } | null | undefined;

export function isMasterAdminEmail(email?: string | null): boolean {
  return (email ?? "").trim().toLowerCase() === MASTER_ADMIN_EMAIL;
}

export function hasAdminAccess(user?: AdminUserLike, profile?: AdminProfileLike): boolean {
  if (isMasterAdminEmail(user?.email ?? profile?.email)) return true;
  const role = (profile?.role ?? "").trim().toLowerCase();
  return role === "super_admin" || role === "admin";
}
