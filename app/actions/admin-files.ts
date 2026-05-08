"use server";

import { auth } from "@/auth";
import { ADMIN_PERMISSION_KEYS, canAccessAdminPermission } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";
import { AuditCategory, FileScanStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

function normalizeText(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

async function requireAdminActor(permissionKey: string) {
  const session = await auth();
  const actorId = session?.user?.id ?? null;
  const actorRoles = ((session?.user as { roles?: string[] } | undefined)?.roles ?? []).map((role) => role.toLowerCase());
  const actorPermissions = (session?.user as { permissions?: string[] } | undefined)?.permissions ?? [];

  if (!actorId || !canAccessAdminPermission(actorRoles, actorPermissions, permissionKey)) {
    throw new Error("Unauthorized");
  }

  return { actorId };
}

function revalidateFileSurfaces() {
  revalidatePath("/dashboard");
  revalidatePath("/files");
  revalidatePath("/reports");
  revalidatePath("/system-jobs");
  revalidatePath("/case-review");
  revalidatePath("/verification");
}

export async function adminFileSecurityAction(formData: FormData) {
  const { actorId } = await requireAdminActor(ADMIN_PERMISSION_KEYS.FILES_MANAGE);
  const assetId = normalizeText(formData.get("assetId"));
  const intent = normalizeText(formData.get("intent"));
  const reason = normalizeText(formData.get("reason"));

  if (!assetId || !intent) {
    throw new Error("Missing file action input");
  }

  if (!reason) {
    throw new Error("A reason is required for file security actions");
  }

  const asset = await prisma.fileAsset.findUnique({
    where: { id: assetId },
    select: {
      id: true,
      originalFileName: true,
      scanStatus: true,
      isPublic: true,
      attachments: { select: { id: true } },
      caseSourceFiles: { select: { id: true } },
      verificationDocuments: { select: { id: true } },
    },
  });

  if (!asset) {
    throw new Error("File asset not found");
  }

  if (!["mark_for_rescan", "quarantine", "detach_public_linkages"].includes(intent)) {
    throw new Error("Unsupported file security action");
  }

  await prisma.$transaction(async (tx) => {
    if (intent === "mark_for_rescan") {
      await tx.fileAsset.update({
        where: { id: asset.id },
        data: {
          scanStatus: FileScanStatus.PENDING,
          scanCompletedAt: null,
          isPublic: false,
        },
      });
    } else if (intent === "quarantine") {
      await tx.fileAsset.update({
        where: { id: asset.id },
        data: {
          isPublic: false,
        },
      });
    } else if (intent === "detach_public_linkages") {
      await tx.contentAttachment.deleteMany({
        where: { assetId: asset.id },
      });
      await tx.caseSourceFile.deleteMany({
        where: { assetId: asset.id },
      });
      await tx.fileAsset.update({
        where: { id: asset.id },
        data: {
          isPublic: false,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        category: AuditCategory.SECURITY,
        action: `ADMIN_FILE_${intent.toUpperCase()}`,
        actorId,
        targetId: asset.id,
        meta: {
          assetId: asset.id,
          fileName: asset.originalFileName,
          previousScanStatus: asset.scanStatus,
          previousIsPublic: asset.isPublic,
          attachmentCount: asset.attachments.length,
          caseSourceFileCount: asset.caseSourceFiles.length,
          verificationDocumentCount: asset.verificationDocuments.length,
          reason,
        },
      },
    });
  });

  revalidateFileSurfaces();
}
