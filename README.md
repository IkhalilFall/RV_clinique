# Medicare — prise de rendez-vous médicaux

Application web qui permet à des patients de réserver un rendez-vous avec un médecin, et aux médecins de gérer leurs disponibilités et leurs rendez-vous.

## Fonctionnalités

- Inscription et connexion avec deux rôles : **patient** et **médecin** (mots de passe hachés avec bcrypt)
- **Espace médecin** : publication et suppression de créneaux de disponibilité, confirmation ou annulation des rendez-vous
- **Espace patient** : liste des médecins, réservation d’un créneau, suivi du statut du rendez-vous (en attente, confirmé, annulé)
- **Paiement** : suivi du paiement des rendez-vous confirmés
- Gestion du profil utilisateur

## Technologies

- Next.js 16 (App Router) et React 19
- Tailwind CSS 4
- Prisma ORM et MySQL
- TypeScript

## API

| Méthode | Route | Rôle |
|---|---|---|
| POST | `/api/auth/register` | Créer un compte |
| POST | `/api/auth/login` | Se connecter |
| GET, PATCH | `/api/profil` | Consulter et modifier son profil |
| GET | `/api/medecins` | Lister les médecins |
| GET, POST, DELETE | `/api/disponibilites` | Gérer les créneaux |
| GET, POST | `/api/rdv` | Lister et réserver des rendez-vous |
| PATCH | `/api/rdv/[id]` | Confirmer ou annuler un rendez-vous |
| PATCH | `/api/paiement` | Enregistrer un paiement |

## Modèle de données

`User` (rôle `PATIENT` ou `MEDECIN`), `Disponibilite` et `RDV` (statut `EN_ATTENTE`, `CONFIRME` ou `ANNULE`, paiement). Le schéma est dans `prisma/schema.prisma`.

## Lancer le projet

```bash
git clone https://github.com/IkhalilFall/RV_clinique.git
cd RV_clinique
npm install
```

Modifie l’adresse de ta base MySQL dans `prisma/schema.prisma` (ou passe-la en variable d’environnement `DATABASE_URL`), puis :

```bash
npx prisma migrate dev
npm run dev
```

L’application est disponible sur http://localhost:3000.

## Auteur

Ibrahima Khalil Fall — [GitHub](https://github.com/IkhalilFall)
