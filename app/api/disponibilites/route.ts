import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { medecinId, date, heureDebut, heureFin } = await req.json();

    if (!medecinId || !date || !heureDebut || !heureFin) {
      return NextResponse.json(
        { message: "Tous les champs sont requis" },
        { status: 400 }
      );
    }

    const disponibilite = await prisma.disponibilite.create({
      data: {
        medecinId: parseInt(medecinId),
        date: new Date(date),
        heureDebut,
        heureFin,
        disponible: true,
      },
    });

    return NextResponse.json({ message: "Disponibilité ajoutée", disponibilite });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const medecinId = searchParams.get("medecinId");

    if (!medecinId) {
      return NextResponse.json(
        { message: "medecinId requis" },
        { status: 400 }
      );
    }

    const disponibilites = await prisma.disponibilite.findMany({
      where: { medecinId: parseInt(medecinId) },
      orderBy: { date: "asc" },
    });

    return NextResponse.json({ disponibilites });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { message: "id requis" },
        { status: 400 }
      );
    }

    await prisma.disponibilite.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: "Disponibilité supprimée" });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Erreur serveur" },
      { status: 500 }
    );
  }
}