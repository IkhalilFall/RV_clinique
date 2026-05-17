import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const medecins = await prisma.user.findMany({
      where: { role: "MEDECIN" },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        disponibilites: {
          where: { disponible: true },
          orderBy: { date: "asc" },
        },
      },
    });

    return NextResponse.json({ medecins });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Erreur serveur" },
      { status: 500 }
    );
  }
}