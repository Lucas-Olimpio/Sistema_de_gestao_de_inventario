import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

type Role = "ADMIN" | "OPERADOR" | "VISUALIZADOR";

/**
 * Checks if the current user has one of the allowed roles for API route handlers.
 * Returns null if authorized, or a NextResponse 401/403 if not.
 *
 * Usage:
 *   const denied = await checkApiRole("ADMIN", "OPERADOR");
 *   if (denied) return denied;
 */
export async function checkApiRole(
  ...allowedRoles: Role[]
): Promise<NextResponse | null> {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      { error: "Não autenticado" },
      { status: 401 },
    );
  }

  const userRole = (session.user as any).role as Role;

  if (!allowedRoles.includes(userRole)) {
    return NextResponse.json(
      {
        error: `Acesso negado: seu perfil (${userRole}) não tem permissão para esta ação.`,
      },
      { status: 403 },
    );
  }

  return null; // Authorized
}
