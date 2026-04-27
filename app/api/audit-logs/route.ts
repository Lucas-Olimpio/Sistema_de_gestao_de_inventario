import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await auth();
    // Apenas ADMIN deve conseguir ver logs de auditoria
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const action = searchParams.get("action") || "";
    const entity = searchParams.get("entity") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "50"));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (action) where.action = action;
    if (entity) where.entity = entity;
    
    if (search) {
      where.OR = [
        { userId: { contains: search, mode: "insensitive" } },
        { entityId: { contains: search, mode: "insensitive" } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    // Opcional: Se tivéssemos User Relation no Schema do AuditLog, faríamos include.
    // Como userId é string, vamos buscar os donos ativamente.
    const userIds = Array.from(new Set(logs.map(l => l.userId).filter(Boolean))) as string[];
    const usersInfo = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true, role: true }
    });
    
    const userMap = new Map(usersInfo.map(u => [u.id, u]));

    const enrichedLogs = logs.map(log => ({
      ...log,
      user: log.userId ? userMap.get(log.userId) || { name: 'Sistema' } : { name: 'Sistema' }
    }));

    return NextResponse.json({
      data: enrichedLogs,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json(
      { error: "Erro ao buscar logs de auditoria" },
      { status: 500 },
    );
  }
}
