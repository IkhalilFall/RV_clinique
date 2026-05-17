import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { patientId, medecinId, disponibiliteId, date, heure } = await req.json();

    if (!patientId || !medecinId || !disponibiliteId || !date || !heure) {
      return NextResponse.json(
        { message: "Tous les champs sont requis" },
        { status: 400 }
      );
    }

    // Créer le RDV
    const rdv = await prisma.rDV.create({
      data: {
        patientId: parseInt(patientId),
        medecinId: parseInt(medecinId),
        disponibiliteId: parseInt(disponibiliteId),
        date: new Date(date),
        heure,
        statut: "EN_ATTENTE",
        paiement: false,
      },
    });

    // Marquer la disponibilité comme réservée
    await prisma.disponibilite.update({
      where: { id: parseInt(disponibiliteId) },
      data: { disponible: false },
    });

    return NextResponse.json({ message: "RDV créé avec succès", rdv });

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
    const patientId = searchParams.get("patientId");
    const medecinId = searchParams.get("medecinId");

    const where = patientId
      ? { patientId: parseInt(patientId) }
      : medecinId
      ? { medecinId: parseInt(medecinId) }
      : {};

    const rdvs = await prisma.rDV.findMany({
      where,
      include: {
        patient: { select: { nom: true, prenom: true, email: true } },
        medecin: { select: { nom: true, prenom: true } },
      },
      orderBy: { date: "asc" },
    });

    return NextResponse.json({ rdvs });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Erreur serveur" },
      { status: 500 }
    );
  }
}