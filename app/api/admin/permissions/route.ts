import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; 

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { key, description } = body;

    if (!key?.trim()) {
      return new NextResponse("Key is required", { status: 400 });
    }

    // Check for duplicate key
    const existing = await prisma.permission.findUnique({
      where: { key: key.trim() },
    });
    if (existing) {
      return new NextResponse(`Permission "${key}" already exists`, { status: 409 });
    }

    const permission = await prisma.permission.create({
      data: {
        key: key.trim(),
        description: description?.trim() || null,
      },
    });

    return NextResponse.json(permission, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/admin/permissions]", error);
    return new NextResponse(error?.message || "Internal server error", { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, key, description, isActive } = body as {
      id?: string;
      key?: string;
      description?: string | null;
      isActive?: boolean;
    };

    if (!id?.trim()) {
      return new NextResponse("Permission id is required", { status: 400 });
    }

    const permission = await prisma.permission.findUnique({
      where: { id: id.trim() },
      select: {
        id: true,
        key: true,
      },
    });

    if (!permission) {
      return new NextResponse("Permission not found", { status: 404 });
    }

    const data: {
      key?: string;
      description?: string | null;
      isActive?: boolean;
    } = {};

    if (typeof key === "string") {
      const normalizedKey = key.trim();
      if (!normalizedKey) {
        return new NextResponse("Key is required", { status: 400 });
      }

      const existing = await prisma.permission.findUnique({
        where: { key: normalizedKey },
        select: { id: true },
      });

      if (existing && existing.id !== permission.id) {
        return new NextResponse(`Permission "${normalizedKey}" already exists`, { status: 409 });
      }

      data.key = normalizedKey;
      data.description = typeof description === "string" ? description.trim() || null : null;
    } else if (description !== undefined) {
      data.description = typeof description === "string" ? description.trim() || null : null;
    }

    if (typeof isActive === "boolean") {
      data.isActive = isActive;
    }

    if (Object.keys(data).length === 0) {
      return new NextResponse("No permission changes were provided", { status: 400 });
    }

    const updatedPermission = await prisma.permission.update({
      where: { id: permission.id },
      data,
    });

    return NextResponse.json(updatedPermission);
  } catch (error: any) {
    console.error("[PATCH /api/admin/permissions]", error);
    return new NextResponse(error?.message || "Internal server error", { status: 500 });
  }
}

export async function GET() {
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
    });
    return NextResponse.json(permissions);
  } catch (error: any) {
    console.error("[GET /api/admin/permissions]", error);
    return new NextResponse(error?.message || "Internal server error", { status: 500 });
  }
}
