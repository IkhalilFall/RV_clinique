import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { nom, prenom, email, mdp, role } = await req.json();

    if (!nom || !prenom || !email || !mdp || !role) {
      return NextResponse.json(
        { message: "Tous les champs sont requis" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return NextResponse.json(
        { message: "Cet email est déjà utilisé" },
        { status: 400 }
      );
    }

    const hashedMdp = await bcrypt.hash(mdp, 10);

    await prisma.user.create({
      data: { nom, prenom, email, mdp: hashedMdp, role },
    });

    return NextResponse.json({ message: "Inscription réussie" });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Erreur serveur" },
      { status: 500 }
    );
  }
}