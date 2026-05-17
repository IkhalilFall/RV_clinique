import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { email, mdp } = await req.json();

    if (!email || !mdp) {
      return NextResponse.json(
        { message: "Email et mot de passe requis" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json(
        { message: "Utilisateur introuvable" },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(mdp, user.mdp);

    if (!valid) {
      return NextResponse.json(
        { message: "Mot de passe incorrect" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      message: "Connexion réussie",
      userId: user.id,
      role: user.role,
      nom: user.nom,
      prenom: user.prenom,
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Erreur serveur" },
      { status: 500 }
    );
  }
}