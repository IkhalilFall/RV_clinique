import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { statut } = await req.json();

    if (!statut) {
      return NextResponse.json(
        { message: "Statut requis" },
        { status: 400 }
      );
    }

    const rdv = await prisma.rDV.update({
      where: { id: parseInt(id) },
      data: { statut },
    });

    if (statut === "ANNULE") {
      await prisma.disponibilite.update({
        where: { id: rdv.disponibiliteId },
        data: { disponible: true },
      });
    }

    return NextResponse.json({ message: "RDV mis à jour", rdv });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Erreur serveur" },
      { status: 500 }
    );
  }
}