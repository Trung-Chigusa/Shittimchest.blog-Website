import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getClientIp, getUserAgent, safeMetadata } from "@/lib/security";

export async function auditLog(params: {
  request?: NextRequest;
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: unknown;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: params.actorId ?? null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId ?? null,
        metadata: params.metadata ? safeMetadata(params.metadata) : undefined,
        ipAddress: params.request ? getClientIp(params.request) : undefined,
        userAgent: params.request ? getUserAgent(params.request) : undefined,
      },
    });
  } catch (error) {
    console.error("[audit-log-failed]", error instanceof Error ? error.message : "unknown");
  }
}
