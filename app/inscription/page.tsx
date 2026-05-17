"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function InscriptionPage() {
  const router = useRouter();
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [mdp, setMdp] = useState("");
  const [role, setRole] = useState<"PATIENT" | "MEDECIN">("PATIENT");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom, prenom, email, mdp, role }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess("Inscription réussie ! Redirection...");
        setTimeout(() => router.push("/"), 1500);
      } else {
        setError(data.message || "Erreur lors de l'inscription");
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight: "100vh", display: "flex", fontFamily: "system-ui, sans-serif" }}>

      {/* Panneau gauche */}
      <div style={{
        flex: 1,
        background: "linear-gradient(160deg, #0a3d62 0%, #1a6fa8 50%, #0a3d62 100%)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "48px", position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%",
          border: "1px solid rgba(255,255,255,0.08)", top: -100, left: -100 }} />
        <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%",
          border: "1px solid rgba(255,255,255,0.08)", bottom: -80, right: -80 }} />

        <div style={{ position: "relative", zIndex: 1, textAlign: "center", marginBottom: 48 }}>
          <div style={{
            width: 80, height: 80, borderRadius: "50%",
            background: "rgba(255,255,255,0.12)",
            border: "2px solid rgba(255,255,255,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px",
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
              stroke="white" strokeWidth="1.5" strokeLinecap="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          </div>
          <h1 style={{ color: "#fff", fontSize: 32, fontWeight: 600, marginBottom: 8 }}>
            MediCare
          </h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 15 }}>
            Clinique de santé moderne
          </p>
        </div>

        {/* Rôles */}
        <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 320 }}>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 12, textAlign: "center" }}>
            Rejoignez-nous en tant que
          </p>
          {[
            { role: "PATIENT", icon: "🧑‍🦯", desc: "Prenez vos RDV facilement" },
            { role: "MEDECIN", icon: "👨‍⚕️", desc: "Gérez vos disponibilités" },
          ].map(({ role: r, icon, desc }) => (
            <div key={r} style={{
              display: "flex", alignItems: "center", gap: 14,
              background: role === r ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.07)",
              border: `1px solid ${role === r ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.12)"}`,
              borderRadius: 12, padding: "14px 20px", marginBottom: 10,
              cursor: "pointer", transition: "all 0.2s",
            }} onClick={() => setRole(r as "PATIENT" | "MEDECIN")}>
              <span style={{ fontSize: 24 }}>{icon}</span>
              <div>
                <p style={{ color: "#fff", fontSize: 14, fontWeight: 500, margin: 0 }}>{r}</p>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, margin: 0 }}>{desc}</p>
              </div>
              {role === r && (
                <span style={{ marginLeft: "auto", color: "#5aa8ff", fontSize: 18 }}>✓</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Panneau droit */}
      <div style={{
        width: 480, background: "#f8fafc",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "48px 40px",
      }}>
        <div style={{ width: "100%", maxWidth: 360 }}>
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 26, fontWeight: 600, color: "#0a3d62", marginBottom: 6 }}>
              Créer un compte
            </h2>
            <p style={{ fontSize: 14, color: "#64748b" }}>
              Rejoignez MediCare dès aujourdhui
            </p>
          </div>

          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca",
              color: "#dc2626", padding: "12px 16px", borderRadius: 10,
              fontSize: 13, marginBottom: 16 }}>
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0",
              color: "#16a34a", padding: "12px 16px", borderRadius: 10,
              fontSize: 13, marginBottom: 16 }}>
              ✅ {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Nom & Prénom */}
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500,
                  color: "#374151", marginBottom: 6 }}>Nom</label>
                <input type="text" value={nom} onChange={e => setNom(e.target.value)}
                  placeholder="Diallo" required
                  style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #e2e8f0",
                    borderRadius: 10, fontSize: 14, color: "#1e293b", outline: "none",
                    background: "#fff", boxSizing: "border-box" }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500,
                  color: "#374151", marginBottom: 6 }}>Prénom</label>
                <input type="text" value={prenom} onChange={e => setPrenom(e.target.value)}
                  placeholder="Mamadou" required
                  style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #e2e8f0",
                    borderRadius: 10, fontSize: 14, color: "#1e293b", outline: "none",
                    background: "#fff", boxSizing: "border-box" }} />
              </div>
            </div>

            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500,
                color: "#374151", marginBottom: 6 }}>Adresse email</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 12, top: "50%",
                  transform: "translateY(-50%)", fontSize: 16 }}>📧</span>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="votre@email.com" required
                  style={{ width: "100%", padding: "11px 14px 11px 38px",
                    border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: 14,
                    color: "#1e293b", outline: "none", background: "#fff",
                    boxSizing: "border-box" }} />
              </div>
            </div>

            {/* Mot de passe */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500,
                color: "#374151", marginBottom: 6 }}>Mot de passe</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 12, top: "50%",
                  transform: "translateY(-50%)", fontSize: 16 }}>🔒</span>
                <input type="password" value={mdp} onChange={e => setMdp(e.target.value)}
                  placeholder="••••••••" required
                  style={{ width: "100%", padding: "11px 14px 11px 38px",
                    border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: 14,
                    color: "#1e293b", outline: "none", background: "#fff",
                    boxSizing: "border-box" }} />
              </div>
            </div>

            {/* Rôle sélectionné */}
            <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe",
              borderRadius: 10, padding: "10px 14px", marginBottom: 20,
              display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>{role === "PATIENT" ? "🧑‍🦯" : "👨‍⚕️"}</span>
              <span style={{ fontSize: 13, color: "#1a6fa8", fontWeight: 500 }}>
                Vous vous inscrivez en tant que {role}
              </span>
            </div>

            {/* Boutons */}
            <div style={{ display: "flex", gap: 10 }}>
              <button type="submit" disabled={loading} style={{
                flex: 2, padding: "12px",
                background: loading ? "#93c5fd" : "#1a6fa8",
                border: "none", borderRadius: 10, color: "#fff",
                fontSize: 14, fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
              }}>
                {loading ? "Inscription..." : "S'inscrire"}
              </button>
              <button type="button"
                onClick={() => { setNom(""); setPrenom(""); setEmail(""); setMdp(""); setError(""); }}
                style={{
                  flex: 1, padding: "12px", background: "#fff",
                  border: "1.5px solid #e2e8f0", borderRadius: 10,
                  color: "#64748b", fontSize: 14, cursor: "pointer",
                }}>
                Annuler
              </button>
            </div>
          </form>

          <div style={{ marginTop: 24, paddingTop: 20,
            borderTop: "1px solid #e2e8f0", textAlign: "center" }}>
            <p style={{ fontSize: 14, color: "#64748b" }}>
              Déjà un compte ?{" "}
              <a href="/" style={{ color: "#1a6fa8", fontWeight: 600, textDecoration: "none" }}>
                Se connecter
              </a>
            </p>
          </div>

          <p style={{ textAlign: "center", fontSize: 12, color: "#94a3b8", marginTop: 24 }}>
            © 2026 MediCare — Tous droits réservés
          </p>
        </div>
      </div>
    </main>
  );
}