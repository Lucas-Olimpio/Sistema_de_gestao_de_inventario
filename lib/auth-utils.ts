import { auth } from "@/lib/auth";
import type { Session } from "next-auth";

type Role = "ADMIN" | "OPERADOR" | "VISUALIZADOR";

/**
 * Get the current authenticated user session (server-side).
 */
export async function getCurrentUser(): Promise<Session["user"] | null> {
  const session = await auth();
  return session?.user || null;
}

/**
 * Require a specific role. Throws if user doesn't have it.
 */
export async function requireRole(...roles: Role[]) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHENTICATED");
  }
  if (!roles.includes((user as any).role)) {
    throw new Error("FORBIDDEN");
  }
  return user;
}

/**
 * Check if the current user can perform destructive actions (delete).
 */
export function canDelete(role: Role): boolean {
  return role === "ADMIN";
}

/**
 * Check if the current user can create/edit resources.
 */
export function canEdit(role: Role): boolean {
  return role === "ADMIN" || role === "OPERADOR";
}

/**
 * Check if user can manage other users.
 */
export function canManageUsers(role: Role): boolean {
  return role === "ADMIN";
}
