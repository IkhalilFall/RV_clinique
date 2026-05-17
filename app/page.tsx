"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [mdp, setMdp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, mdp }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("user", JSON.stringify({
          id: data.userId,
          role: data.role,
          nom: data.nom,
          prenom: data.prenom,
        }));

        if (data.role === "MEDECIN") {
          router.push("/dashboard/medecin");
        } else {
          router.push("/dashboard/patient");
        }
      } else {
        setError(data.message || "Erreur de connexion");
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{
      minHeight: "100vh",
      display: "flex",
      fontFamily: "system-ui, sans-serif",
    }}>
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
        <div style={{ position: "absolute", width: 200, height: 200, borderRadius: "50%",
          background: "rgba(255,255,255,0.04)", top: "30%", right: "-50px" }} />

        {/* Logo */}
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
          <h1 style={{ color: "#fff", fontSize: 32, fontWeight: 600, marginBottom: 8, letterSpacing: "-0.5px" }}>
            MediCare
          </h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 15 }}>
            Clinique de santé moderne
          </p>
        </div>

        {/* Features */}
        {[
          { icon: "📅", text: "Prenez vos RDV en ligne" },
          { icon: "👨‍⚕️", text: "Consultez nos médecins" },
          { icon: "🔔", text: "Notifications en temps réel" },
        ].map(({ icon, text }) => (
          <div key={text} style={{
            display: "flex", alignItems: "center", gap: 14,
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 12, padding: "14px 20px", marginBottom: 12,
            width: "100%", maxWidth: 320, position: "relative", zIndex: 1,
          }}>
            <span style={{ fontSize: 22 }}>{icon}</span>
            <span style={{ color: "rgba(255,255,255,0.85)", fontSize: 14 }}>{text}</span>
          </div>
        ))}
      </div>

      {/* Panneau droit */}
      <div style={{
        width: 480, background: "#f8fafc",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "48px 40px",
      }}>
        <div style={{ width: "100%", maxWidth: 360 }}>
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 26, fontWeight: 600, color: "#0a3d62", marginBottom: 6 }}>
              Connexion
            </h2>
            <p style={{ fontSize: 14, color: "#64748b" }}>
              Accédez à votre espace personnel
            </p>
          </div>

          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca",
              color: "#dc2626", padding: "12px 16px", borderRadius: 10,
              fontSize: 13, marginBottom: 20 }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500,
                color: "#374151", marginBottom: 6 }}>
                Adresse email
              </label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 12, top: "50%",
                  transform: "translateY(-50%)", fontSize: 16 }}>📧</span>
                <input type="email" value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="votre@email.com" required
                  style={{ width: "100%", padding: "11px 14px 11px 38px",
                    border: "1.5px solid #e2e8f0", borderRadius: 10,
                    fontSize: 14, color: "#1e293b", outline: "none",
                    background: "#fff", boxSizing: "border-box" }} />
              </div>
            </div>

            {/* Mot de passe */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500,
                color: "#374151", marginBottom: 6 }}>
                Mot de passe
              </label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 12, top: "50%",
                  transform: "translateY(-50%)", fontSize: 16 }}>🔒</span>
                <input type="password" value={mdp}
                  onChange={e => setMdp(e.target.value)}
                  placeholder="••••••••" required
                  style={{ width: "100%", padding: "11px 14px 11px 38px",
                    border: "1.5px solid #e2e8f0", borderRadius: 10,
                    fontSize: 14, color: "#1e293b", outline: "none",
                    background: "#fff", boxSizing: "border-box" }} />
              </div>
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
                {loading ? "Connexion..." : "Se connecter"}
              </button>
              <button type="button"
                onClick={() => { setEmail(""); setMdp(""); setError(""); }}
                style={{
                  flex: 1, padding: "12px", background: "#fff",
                  border: "1.5px solid #e2e8f0", borderRadius: 10,
                  color: "#64748b", fontSize: 14, cursor: "pointer",
                }}>
                Annuler
              </button>
            </div>
          </form>

          {/* Lien inscription */}
          <div style={{ marginTop: 28, paddingTop: 24,
            borderTop: "1px solid #e2e8f0", textAlign: "center" }}>
            <p style={{ fontSize: 14, color: "#64748b" }}>
              Pas encore de compte ?{" "}
              <a href="/inscription" style={{
                color: "#1a6fa8", fontWeight: 600, textDecoration: "none"
              }}>
                S'inscrire
              </a>
            </p>
          </div>

          <p style={{ textAlign: "center", fontSize: 12, color: "#94a3b8", marginTop: 32 }}>
            © 2026 MediCare — Tous droits réservés
          </p>
        </div>
      </div>
    </main>
  );
}