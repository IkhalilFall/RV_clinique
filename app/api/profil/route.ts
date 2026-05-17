import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ message: "userId requis" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: {
        id: true, nom: true, prenom: true, email: true,
        role: true, createdAt: true,
        lieuNaissance: true, dateNaissance: true,
        situationMatrimoniale: true, genre: true, adresse: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { userId, lieuNaissance, dateNaissance, situationMatrimoniale, genre, adresse } = await req.json();

    if (!userId) {
      return NextResponse.json({ message: "userId requis" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { lieuNaissance, dateNaissance: new Date(dateNaissance), situationMatrimoniale, genre, adresse },
    });

    return NextResponse.json({ message: "Profil mis à jour", user });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}