import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; 

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description } = body;

    if (!name?.trim()) {
      return new NextResponse("Name is required", { status: 400 });
    }

    // Check for duplicate name
    const existing = await prisma.role.findUnique({
      where: { name: name.trim() },
    });
    if (existing) {
      return new NextResponse(`Role "${name}" already exists`, { status: 409 });
    }

    const role = await prisma.role.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        isSystem: false,
      },
    });

    return NextResponse.json(role, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/admin/roles]", error);
    return new NextResponse(error?.message || "Internal server error", { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, description, isActive } = body as {
      id?: string;
      name?: string;
      description?: string | null;
      isActive?: boolean;
    };

    if (!id?.trim()) {
      return new NextResponse("Role id is required", { status: 400 });
    }

    const role = await prisma.role.findUnique({
      where: { id: id.trim() },
      select: {
        id: true,
        name: true,
      },
    });

    if (!role) {
      return new NextResponse("Role not found", { status: 404 });
    }

    const data: {
      name?: string;
      description?: string | null;
      isActive?: boolean;
    } = {};

    if (typeof name === "string") {
      const normalizedName = name.trim();
      if (!normalizedName) {
        return new NextResponse("Name is required", { status: 400 });
      }

      const existing = await prisma.role.findUnique({
        where: { name: normalizedName },
        select: { id: true },
      });

      if (existing && existing.id !== role.id) {
        return new NextResponse(`Role "${normalizedName}" already exists`, { status: 409 });
      }

      data.name = normalizedName;
      data.description = typeof description === "string" ? description.trim() || null : null;
    } else if (description !== undefined) {
      data.description = typeof description === "string" ? description.trim() || null : null;
    }

    if (typeof isActive === "boolean") {
      data.isActive = isActive;
    }

    if (Object.keys(data).length === 0) {
      return new NextResponse("No role changes were provided", { status: 400 });
    }

    const updatedRole = await prisma.role.update({
      where: { id: role.id },
      data,
    });

    return NextResponse.json(updatedRole);
  } catch (error: any) {
    console.error("[PATCH /api/admin/roles]", error);
    return new NextResponse(error?.message || "Internal server error", { status: 500 });
  }
}

export async function GET() {
  try {
    const roles = await prisma.role.findMany({
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
      include: {
        _count: { select: { users: true, permissions: true } },
      },
    });
    return NextResponse.json(roles);
  } catch (error: any) {
    console.error("[GET /api/admin/roles]", error);
    return new NextResponse(error?.message || "Internal server error", { status: 500 });
  }
}
