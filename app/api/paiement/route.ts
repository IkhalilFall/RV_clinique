import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  try {
    const { rdvId } = await req.json();

    if (!rdvId) {
      return NextResponse.json(
        { message: "rdvId requis" },
        { status: 400 }
      );
    }

    const rdv = await prisma.rDV.findUnique({
      where: { id: parseInt(rdvId) },
    });

    if (!rdv) {
      return NextResponse.json(
        { message: "RDV introuvable" },
        { status: 404 }
      );
    }

    if (rdv.statut !== "CONFIRME") {
      return NextResponse.json(
        { message: "Le RDV doit être confirmé avant le paiement" },
        { status: 400 }
      );
    }

    if (rdv.paiement) {
      return NextResponse.json(
        { message: "Ce RDV est déjà payé" },
        { status: 400 }
      );
    }

    const maintenant = new Date();
    const dateRdv = new Date(rdv.date);
    const diffHeures = (dateRdv.getTime() - maintenant.getTime()) / (1000 * 60 * 60);

    if (diffHeures < 48) {
      return NextResponse.json(
        { message: "Le paiement doit être effectué au moins 48h avant le RDV" },
        { status: 400 }
      );
    }

    await prisma.rDV.update({
      where: { id: parseInt(rdvId) },
      data: { paiement: true },
    });

    return NextResponse.json({ message: "Paiement effectué avec succès !" });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Erreur serveur" },
      { status: 500 }
    );
  }
}