"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Disponibilite {
  id: number;
  date: string;
  heureDebut: string;
  heureFin: string;
  disponible: boolean;
}

interface Medecin {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  disponibilites: Disponibilite[];
}

interface RDV {
  id: number;
  date: string;
  heure: string;
  statut: string;
  paiement: boolean;
  medecin: { nom: string; prenom: string };
}

interface User {
  id: number;
  nom: string;
  prenom: string;
  role: string;
}

interface Profil {
  lieuNaissance: string;
  dateNaissance: string;
  situationMatrimoniale: string;
  genre: string;
  adresse: string;
}

export default function DashboardPatient() {
  const router = useRouter();
  const [activeMenu, setActiveMenu] = useState("accueil");
  const [user, setUser] = useState<User | null>(null);
  const [medecins, setMedecins] = useState<Medecin[]>([]);
  const [rdvs, setRdvs] = useState<RDV[]>([]);
  const [medecinChoisi, setMedecinChoisi] = useState<Medecin | null>(null);
  const [disponibiliteChoisie, setDisponibiliteChoisie] = useState<Disponibilite | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingPaiement, setLoadingPaiement] = useState<number | null>(null);
  const [loadingProfil, setLoadingProfil] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [notification, setNotification] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Profil
  const [profil, setProfil] = useState<Profil>({
    lieuNaissance: "",
    dateNaissance: "",
    situationMatrimoniale: "",
    genre: "",
    adresse: "",
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("user");
      if (stored) {
        const u = JSON.parse(stored);
        setUser(u);
        fetchMedecins();
        fetchRdvs(u.id);
        fetchProfil(u.id);
      } else {
        router.push("/");
      }
    }
  }, []);

  const showNotification = (text: string, type: "success" | "error") => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchMedecins = async () => {
    try {
      const res = await fetch("/api/medecins");
      const data = await res.json();
      setMedecins(data.medecins || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRdvs = async (patientId: number) => {
    try {
      const res = await fetch(`/api/rdv?patientId=${patientId}`);
      const data = await res.json();
      setRdvs(data.rdvs || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProfil = async (userId: number) => {
    try {
      const res = await fetch(`/api/profil?userId=${userId}`);
      const data = await res.json();
      if (data.user) {
        setProfil({
          lieuNaissance: data.user.lieuNaissance || "",
          dateNaissance: data.user.dateNaissance
            ? new Date(data.user.dateNaissance).toISOString().split("T")[0]
            : "",
          situationMatrimoniale: data.user.situationMatrimoniale || "",
          genre: data.user.genre || "",
          adresse: data.user.adresse || "",
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveProfil = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoadingProfil(true);
    try {
      const res = await fetch("/api/profil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, ...profil }),
      });
      const data = await res.json();
      if (res.ok) {
        showNotification("Profil mis à jour avec succès !", "success");
      } else {
        showNotification(data.message || "Erreur", "error");
      }
    } catch {
      showNotification("Erreur réseau", "error");
    } finally {
      setLoadingProfil(false);
    }
  };

  const handlePrendreRdv = async () => {
    if (!user || !medecinChoisi || !disponibiliteChoisie) {
      setError("Veuillez choisir un médecin et un créneau");
      return;
    }
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/rdv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: user.id,
          medecinId: medecinChoisi.id,
          disponibiliteId: disponibiliteChoisie.id,
          date: disponibiliteChoisie.date,
          heure: disponibiliteChoisie.heureDebut,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("RDV pris avec succès ! En attente de confirmation.");
        setMedecinChoisi(null);
        setDisponibiliteChoisie(null);
        fetchMedecins();
        fetchRdvs(user.id);
        showNotification("RDV pris avec succès !", "success");
        setTimeout(() => setActiveMenu("rdv"), 1500);
      } else {
        setError(data.message);
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  const handlePaiement = async (rdvId: number) => {
    setLoadingPaiement(rdvId);
    try {
      const res = await fetch("/api/paiement", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rdvId }),
      });
      const data = await res.json();
      if (res.ok) {
        showNotification("Paiement effectué avec succès ! 🎉", "success");
        if (user) fetchRdvs(user.id);
      } else {
        showNotification(data.message || "Erreur paiement", "error");
      }
    } catch {
      showNotification("Erreur réseau", "error");
    } finally {
      setLoadingPaiement(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      weekday: "long", day: "numeric", month: "long", year: "numeric"
    });
  };

  const getStatutStyle = (statut: string) => {
    switch (statut) {
      case "CONFIRME":
        return { bg: "#f0fdf4", border: "#bbf7d0", color: "#16a34a", label: "✅ Confirmé" };
      case "ANNULE":
        return { bg: "#fef2f2", border: "#fecaca", color: "#dc2626", label: "❌ Annulé" };
      default:
        return { bg: "#fff7ed", border: "#fed7aa", color: "#ea580c", label: "⏳ En attente" };
    }
  };

  const get48hInfo = (dateStr: string) => {
    const maintenant = new Date();
    const dateRdv = new Date(dateStr);
    const diffHeures = (dateRdv.getTime() - maintenant.getTime()) / (1000 * 60 * 60);
    return {
      peutPayer: diffHeures >= 48,
      heuresRestantes: Math.round(diffHeures),
    };
  };

  const menuItems = [
    { id: "accueil", icon: "🏠", label: "Accueil" },
    { id: "nouveau-rdv", icon: "➕", label: "Nouveau RDV" },
    { id: "rdv", icon: "📅", label: "Mes RDV" },
    { id: "paiement", icon: "💳", label: "Paiements" },
    { id: "profil", icon: "👤", label: "Mon Profil" },
  ];

  const rdvsAPayer = rdvs.filter(r => r.statut === "CONFIRME" && !r.paiement);

  const inputStyle = {
    width: "100%", padding: "11px 14px",
    border: "1.5px solid #e2e8f0", borderRadius: 10,
    fontSize: 14, color: "#1e293b", outline: "none",
    background: "#fff", boxSizing: "border-box" as const,
  };

  const labelStyle = {
    display: "block", fontSize: 13, fontWeight: 500,
    color: "#374151", marginBottom: 6,
  };

  return (
    <main style={{ display: "flex", minHeight: "100vh", fontFamily: "system-ui, sans-serif", background: "#f1f5f9" }}>

      {/* Notification */}
      {notification && (
        <div style={{
          position: "fixed", top: 24, right: 24, zIndex: 9999,
          background: notification.type === "success" ? "#1a6fa8" : "#dc2626",
          color: "#fff", padding: "14px 20px", borderRadius: 12,
          fontSize: 14, fontWeight: 500, boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          {notification.type === "success" ? "✅" : "❌"} {notification.text}
        </div>
      )}

      {/* Sidebar */}
      <div style={{
        width: 240,
        background: "linear-gradient(180deg, #0a3d62 0%, #1a6fa8 100%)",
        display: "flex", flexDirection: "column",
        position: "fixed", height: "100vh", zIndex: 10,
      }}>
        <div style={{ padding: "28px 24px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: "50%",
              background: "rgba(255,255,255,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="white" strokeWidth="2" strokeLinecap="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
            </div>
            <div>
              <p style={{ color: "#fff", fontSize: 16, fontWeight: 600, margin: 0 }}>MediCare</p>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, margin: 0 }}>
                {user?.prenom} {user?.nom}
              </p>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: "16px 12px" }}>
          {menuItems.map(({ id, icon, label }) => (
            <div key={id} onClick={() => setActiveMenu(id)}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "11px 14px", borderRadius: 10, marginBottom: 4,
                cursor: "pointer",
                background: activeMenu === id ? "rgba(255,255,255,0.15)" : "transparent",
                border: activeMenu === id ? "1px solid rgba(255,255,255,0.2)" : "1px solid transparent",
              }}>
              <span style={{ fontSize: 18 }}>{icon}</span>
              <span style={{ color: activeMenu === id ? "#fff" : "rgba(255,255,255,0.65)",
                fontSize: 14, fontWeight: activeMenu === id ? 500 : 400 }}>
                {label}
              </span>
              {id === "paiement" && rdvsAPayer.length > 0 && (
                <span style={{ marginLeft: "auto", background: "#ef4444",
                  color: "#fff", borderRadius: 20, fontSize: 11,
                  padding: "2px 7px", fontWeight: 600 }}>
                  {rdvsAPayer.length}
                </span>
              )}
            </div>
          ))}
        </nav>

        <div style={{ padding: "16px 12px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <div onClick={() => { localStorage.removeItem("user"); router.push("/"); }}
            style={{ display: "flex", alignItems: "center", gap: 12,
              padding: "11px 14px", borderRadius: 10, cursor: "pointer",
              background: "rgba(255,255,255,0.07)" }}>
            <span style={{ fontSize: 18 }}>🚪</span>
            <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 14 }}>Se déconnecter</span>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div style={{ marginLeft: 240, flex: 1, padding: "32px" }}>

        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: "#0a3d62", marginBottom: 4 }}>
            {menuItems.find(m => m.id === activeMenu)?.label}
          </h1>
          <p style={{ color: "#64748b", fontSize: 14 }}>
            Bonjour {user?.prenom} {user?.nom}
          </p>
        </div>

        {/* Accueil */}
        {activeMenu === "accueil" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
              {[
                { label: "RDV en attente", value: String(rdvs.filter(r => r.statut === "EN_ATTENTE").length), icon: "📅", color: "#eff6ff", border: "#bfdbfe", text: "#1a6fa8" },
                { label: "RDV confirmés", value: String(rdvs.filter(r => r.statut === "CONFIRME").length), icon: "✅", color: "#f0fdf4", border: "#bbf7d0", text: "#16a34a" },
                { label: "Paiements en attente", value: String(rdvsAPayer.length), icon: "💳", color: "#fff7ed", border: "#fed7aa", text: "#ea580c" },
              ].map(({ label, value, icon, color, border, text }) => (
                <div key={label} style={{ background: color, border: `1px solid ${border}`, borderRadius: 14, padding: "20px 24px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 24 }}>{icon}</span>
                    <span style={{ fontSize: 28, fontWeight: 600, color: text }}>{value}</span>
                  </div>
                  <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>{label}</p>
                </div>
              ))}
            </div>

            {rdvsAPayer.length > 0 && (
              <div style={{ background: "#fff7ed", borderRadius: 14, padding: "20px 24px",
                border: "1px solid #fed7aa", marginBottom: 24 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: "#ea580c", marginBottom: 12 }}>
                  ⚠️ Paiements à effectuer
                </h3>
                {rdvsAPayer.map((rdv) => {
                  const { peutPayer, heuresRestantes } = get48hInfo(rdv.date);
                  return (
                    <div key={rdv.id} style={{ display: "flex", alignItems: "center",
                      justifyContent: "space-between", padding: "12px 16px",
                      background: "#fff", border: "1px solid #fed7aa",
                      borderRadius: 10, marginBottom: 8 }}>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: "#1e293b", margin: 0 }}>
                          Dr. {rdv.medecin.prenom} {rdv.medecin.nom}
                        </p>
                        <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
                          📅 {formatDate(rdv.date)} à {rdv.heure}
                        </p>
                        <p style={{ fontSize: 12, color: peutPayer ? "#16a34a" : "#dc2626", margin: "4px 0 0" }}>
                          {peutPayer ? `✅ Paiement possible (${heuresRestantes}h restantes)` : `❌ Délai dépassé`}
                        </p>
                      </div>
                      <button onClick={() => handlePaiement(rdv.id)}
                        disabled={!peutPayer || loadingPaiement === rdv.id}
                        style={{ padding: "10px 16px",
                          background: peutPayer ? "#1a6fa8" : "#e2e8f0",
                          border: "none", borderRadius: 10,
                          color: peutPayer ? "#fff" : "#94a3b8",
                          fontSize: 13, fontWeight: 600,
                          cursor: peutPayer ? "pointer" : "not-allowed" }}>
                        {loadingPaiement === rdv.id ? "En cours..." : "💳 Payer"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ background: "#fff", borderRadius: 14, padding: "24px", marginBottom: 24, border: "1px solid #e2e8f0" }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#0a3d62", marginBottom: 16 }}>Actions rapides</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
                {[
                  { label: "Prendre un RDV", icon: "➕", action: "nouveau-rdv" },
                  { label: "Voir mes RDV", icon: "📅", action: "rdv" },
                  { label: "Mes paiements", icon: "💳", action: "paiement" },
                  { label: "Mon profil", icon: "👤", action: "profil" },
                ].map(({ label, icon, action }) => (
                  <button key={label} onClick={() => setActiveMenu(action)}
                    style={{ display: "flex", alignItems: "center", gap: 10,
                      padding: "14px 16px", background: "#f8fafc",
                      border: "1.5px solid #e2e8f0", borderRadius: 10,
                      cursor: "pointer", fontSize: 14, color: "#374151", fontWeight: 500 }}>
                    <span style={{ fontSize: 20 }}>{icon}</span>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ background: "#fff", borderRadius: 14, padding: "24px", border: "1px solid #e2e8f0" }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#0a3d62", marginBottom: 16 }}>
                Mes prochains rendez-vous
              </h3>
              {rdvs.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px 0", color: "#94a3b8" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
                  <p style={{ fontSize: 14 }}>Aucun rendez-vous</p>
                  <button onClick={() => setActiveMenu("nouveau-rdv")}
                    style={{ marginTop: 12, padding: "10px 20px",
                      background: "#1a6fa8", border: "none", borderRadius: 8,
                      color: "#fff", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>
                    Prendre un RDV
                  </button>
                </div>
              ) : (
                rdvs.slice(0, 3).map((rdv) => {
                  const s = getStatutStyle(rdv.statut);
                  return (
                    <div key={rdv.id} style={{ display: "flex", alignItems: "center",
                      justifyContent: "space-between", padding: "12px 16px",
                      background: "#f8fafc", border: "1px solid #e2e8f0",
                      borderRadius: 10, marginBottom: 8 }}>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 500, color: "#1e293b", margin: 0 }}>
                          Dr. {rdv.medecin.prenom} {rdv.medecin.nom}
                        </p>
                        <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
                          {formatDate(rdv.date)} à {rdv.heure}
                        </p>
                      </div>
                      <span style={{ padding: "4px 10px", borderRadius: 20, fontSize: 12,
                        background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
                        {s.label}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Nouveau RDV */}
        {activeMenu === "nouveau-rdv" && (
          <div>
            {message && (
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0",
                color: "#16a34a", padding: "12px 16px", borderRadius: 10,
                fontSize: 13, marginBottom: 20 }}>✅ {message}</div>
            )}
            {error && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca",
                color: "#dc2626", padding: "12px 16px", borderRadius: 10,
                fontSize: 13, marginBottom: 20 }}>⚠️ {error}</div>
            )}

            <div style={{ background: "#fff", borderRadius: 14, padding: "24px",
              border: "1px solid #e2e8f0", marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#0a3d62", marginBottom: 16 }}>
                Étape 1 — Choisir un médecin
              </h3>
              {medecins.length === 0 ? (
                <p style={{ color: "#94a3b8", fontSize: 14 }}>Aucun médecin disponible</p>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
                  {medecins.map((m) => (
                    <div key={m.id} onClick={() => { setMedecinChoisi(m); setDisponibiliteChoisie(null); }}
                      style={{ padding: "16px", borderRadius: 12, cursor: "pointer",
                        border: `2px solid ${medecinChoisi?.id === m.id ? "#1a6fa8" : "#e2e8f0"}`,
                        background: medecinChoisi?.id === m.id ? "#eff6ff" : "#f8fafc" }}>
                      <div style={{ width: 44, height: 44, borderRadius: "50%",
                        background: "#dbeafe", display: "flex", alignItems: "center",
                        justifyContent: "center", marginBottom: 10, fontSize: 20 }}>👨‍⚕️</div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: "#1e293b", margin: 0 }}>
                        Dr. {m.prenom} {m.nom}
                      </p>
                      <p style={{ fontSize: 12, color: "#64748b", margin: "4px 0 0" }}>
                        {m.disponibilites.length} créneau(x) disponible(s)
                      </p>
                      {medecinChoisi?.id === m.id && (
                        <span style={{ fontSize: 12, color: "#1a6fa8", fontWeight: 500 }}>✓ Sélectionné</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {medecinChoisi && (
              <div style={{ background: "#fff", borderRadius: 14, padding: "24px",
                border: "1px solid #e2e8f0", marginBottom: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#0a3d62", marginBottom: 16 }}>
                  Étape 2 — Choisir un créneau avec Dr. {medecinChoisi.prenom} {medecinChoisi.nom}
                </h3>
                {medecinChoisi.disponibilites.length === 0 ? (
                  <p style={{ color: "#94a3b8", fontSize: 14 }}>Aucun créneau disponible</p>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
                    {medecinChoisi.disponibilites.map((d) => (
                      <div key={d.id} onClick={() => setDisponibiliteChoisie(d)}
                        style={{ padding: "14px", borderRadius: 10, cursor: "pointer",
                          border: `2px solid ${disponibiliteChoisie?.id === d.id ? "#1a6fa8" : "#e2e8f0"}`,
                          background: disponibiliteChoisie?.id === d.id ? "#eff6ff" : "#f8fafc" }}>
                        <p style={{ fontSize: 13, fontWeight: 500, color: "#1e293b", margin: 0 }}>
                          📅 {formatDate(d.date)}
                        </p>
                        <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
                          🕐 {d.heureDebut} - {d.heureFin}
                        </p>
                        {disponibiliteChoisie?.id === d.id && (
                          <span style={{ fontSize: 12, color: "#1a6fa8", fontWeight: 500 }}>✓ Sélectionné</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {medecinChoisi && disponibiliteChoisie && (
              <div style={{ background: "#fff", borderRadius: 14, padding: "24px", border: "1px solid #e2e8f0" }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#0a3d62", marginBottom: 16 }}>
                  Étape 3 — Confirmer votre RDV
                </h3>
                <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe",
                  borderRadius: 12, padding: "16px 20px", marginBottom: 20 }}>
                  <p style={{ fontSize: 14, color: "#1e293b", margin: "0 0 6px" }}>
                    👨‍⚕️ <strong>Médecin :</strong> Dr. {medecinChoisi.prenom} {medecinChoisi.nom}
                  </p>
                  <p style={{ fontSize: 14, color: "#1e293b", margin: "0 0 6px" }}>
                    📅 <strong>Date :</strong> {formatDate(disponibiliteChoisie.date)}
                  </p>
                  <p style={{ fontSize: 14, color: "#1e293b", margin: 0 }}>
                    🕐 <strong>Heure :</strong> {disponibiliteChoisie.heureDebut} - {disponibiliteChoisie.heureFin}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={handlePrendreRdv} disabled={loading}
                    style={{ flex: 2, padding: "12px", background: loading ? "#93c5fd" : "#1a6fa8",
                      border: "none", borderRadius: 10, color: "#fff",
                      fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer" }}>
                    {loading ? "En cours..." : "Confirmer le RDV"}
                  </button>
                  <button onClick={() => { setMedecinChoisi(null); setDisponibiliteChoisie(null); }}
                    style={{ flex: 1, padding: "12px", background: "#fff",
                      border: "1.5px solid #e2e8f0", borderRadius: 10,
                      color: "#64748b", fontSize: 14, cursor: "pointer" }}>
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mes RDV */}
        {activeMenu === "rdv" && (
          <div style={{ background: "#fff", borderRadius: 14, padding: "24px", border: "1px solid #e2e8f0" }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "#0a3d62", marginBottom: 20 }}>
              📅 Mes rendez-vous ({rdvs.length})
            </h3>
            {rdvs.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0", color: "#94a3b8" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
                <p style={{ fontSize: 14 }}>Aucun rendez-vous</p>
              </div>
            ) : (
              rdvs.map((rdv) => {
                const s = getStatutStyle(rdv.statut);
                return (
                  <div key={rdv.id} style={{ display: "flex", alignItems: "center",
                    justifyContent: "space-between", padding: "16px",
                    background: "#f8fafc", border: "1px solid #e2e8f0",
                    borderRadius: 12, marginBottom: 10 }}>
                    <div>
                      <p style={{ fontSize: 15, fontWeight: 600, color: "#1e293b", margin: 0 }}>
                        Dr. {rdv.medecin.prenom} {rdv.medecin.nom}
                      </p>
                      <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
                        📅 {formatDate(rdv.date)} à {rdv.heure}
                      </p>
                      <p style={{ fontSize: 13, color: rdv.paiement ? "#16a34a" : "#ea580c", margin: "4px 0 0" }}>
                        💳 {rdv.paiement ? "✅ Payé" : "⏳ Paiement en attente"}
                      </p>
                    </div>
                    <span style={{ padding: "6px 12px", borderRadius: 20, fontSize: 12,
                      background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
                      {s.label}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Paiements */}
        {activeMenu === "paiement" && (
          <div>
            <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe",
              borderRadius: 14, padding: "16px 20px", marginBottom: 24,
              display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 24 }}>ℹ️</span>
              <p style={{ fontSize: 14, color: "#1a6fa8", margin: 0 }}>
                Le paiement doit être effectué <strong>au moins 48h avant</strong> la date du rendez-vous.
              </p>
            </div>
            <div style={{ background: "#fff", borderRadius: 14, padding: "24px", border: "1px solid #e2e8f0" }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#0a3d62", marginBottom: 20 }}>
                💳 Mes paiements
              </h3>
              {rdvs.filter(r => r.statut === "CONFIRME").length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px 0", color: "#94a3b8" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>💳</div>
                  <p style={{ fontSize: 14 }}>Aucun RDV confirmé à payer</p>
                </div>
              ) : (
                rdvs.filter(r => r.statut === "CONFIRME").map((rdv) => {
                  const { peutPayer, heuresRestantes } = get48hInfo(rdv.date);
                  return (
                    <div key={rdv.id} style={{ display: "flex", alignItems: "center",
                      justifyContent: "space-between", padding: "16px",
                      background: "#f8fafc", border: `1px solid ${rdv.paiement ? "#bbf7d0" : "#e2e8f0"}`,
                      borderRadius: 12, marginBottom: 12 }}>
                      <div>
                        <p style={{ fontSize: 15, fontWeight: 600, color: "#1e293b", margin: 0 }}>
                          Dr. {rdv.medecin.prenom} {rdv.medecin.nom}
                        </p>
                        <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
                          📅 {formatDate(rdv.date)} à {rdv.heure}
                        </p>
                        {!rdv.paiement && (
                          <p style={{ fontSize: 12, margin: "6px 0 0",
                            color: peutPayer ? "#16a34a" : "#dc2626" }}>
                            {peutPayer
                              ? `✅ Paiement possible — ${heuresRestantes}h avant le RDV`
                              : `❌ Délai dépassé — moins de 48h avant le RDV`}
                          </p>
                        )}
                      </div>
                      <div>
                        {rdv.paiement ? (
                          <span style={{ padding: "8px 16px", borderRadius: 10, fontSize: 13,
                            background: "#f0fdf4", color: "#16a34a",
                            border: "1px solid #bbf7d0", fontWeight: 500 }}>
                            ✅ Payé
                          </span>
                        ) : (
                          <button onClick={() => handlePaiement(rdv.id)}
                            disabled={!peutPayer || loadingPaiement === rdv.id}
                            style={{ padding: "10px 20px",
                              background: peutPayer ? "#1a6fa8" : "#e2e8f0",
                              border: "none", borderRadius: 10,
                              color: peutPayer ? "#fff" : "#94a3b8",
                              fontSize: 13, fontWeight: 600,
                              cursor: peutPayer ? "pointer" : "not-allowed" }}>
                            {loadingPaiement === rdv.id ? "En cours..." : "💳 Payer maintenant"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Profil */}
        {activeMenu === "profil" && (
          <div>
            {/* Carte info */}
            <div style={{ background: "#fff", borderRadius: 14, padding: "24px",
              border: "1px solid #e2e8f0", marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%",
                  background: "#dbeafe", display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: 28 }}>
                  {profil.genre === "Homme" ? "👨" : profil.genre === "Femme" ? "👩" : "👤"}
                </div>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 600, color: "#0a3d62", margin: 0 }}>
                    {user?.prenom} {user?.nom}
                  </h2>
                  <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
                    Patient — MediCare
                  </p>
                </div>
              </div>

              {/* Infos rapides */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                {[
                  { label: "Genre", value: profil.genre || "Non renseigné", icon: "👤" },
                  { label: "Situation", value: profil.situationMatrimoniale || "Non renseigné", icon: "💍" },
                  { label: "Adresse", value: profil.adresse || "Non renseigné", icon: "📍" },
                ].map(({ label, value, icon }) => (
                  <div key={label} style={{ background: "#f8fafc", border: "1px solid #e2e8f0",
                    borderRadius: 10, padding: "12px 16px" }}>
                    <p style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 4px" }}>{icon} {label}</p>
                    <p style={{ fontSize: 13, fontWeight: 500, color: "#1e293b", margin: 0 }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Formulaire */}
            <div style={{ background: "#fff", borderRadius: 14, padding: "28px",
              border: "1px solid #e2e8f0" }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#0a3d62", marginBottom: 24 }}>
                ✏️ Modifier mon profil
              </h3>

              <form onSubmit={handleSaveProfil}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  {/* Genre */}
                  <div>
                    <label style={labelStyle}>Genre</label>
                    <select value={profil.genre}
                      onChange={e => setProfil({ ...profil, genre: e.target.value })}
                      style={{ ...inputStyle, cursor: "pointer" }}>
                      <option value="">-- Choisir --</option>
                      <option value="Homme">Homme</option>
                      <option value="Femme">Femme</option>
                    </select>
                  </div>

                  {/* Situation matrimoniale */}
                  <div>
                    <label style={labelStyle}>Situation matrimoniale</label>
                    <select value={profil.situationMatrimoniale}
                      onChange={e => setProfil({ ...profil, situationMatrimoniale: e.target.value })}
                      style={{ ...inputStyle, cursor: "pointer" }}>
                      <option value="">-- Choisir --</option>
                      <option value="Célibataire">Célibataire</option>
                      <option value="Marié(e)">Marié(e)</option>
                      <option value="Divorcé(e)">Divorcé(e)</option>
                      <option value="Veuf/Veuve">Veuf/Veuve</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  {/* Date de naissance */}
                  <div>
                    <label style={labelStyle}>Date de naissance</label>
                    <input type="date" value={profil.dateNaissance}
                      onChange={e => setProfil({ ...profil, dateNaissance: e.target.value })}
                      style={inputStyle} />
                  </div>

                  {/* Lieu de naissance */}
                  <div>
                    <label style={labelStyle}>Lieu de naissance</label>
                    <input type="text" value={profil.lieuNaissance}
                      onChange={e => setProfil({ ...profil, lieuNaissance: e.target.value })}
                      placeholder="Ex: Dakar, Sénégal"
                      style={inputStyle} />
                  </div>
                </div>

                {/* Adresse */}
                <div style={{ marginBottom: 24 }}>
                  <label style={labelStyle}>Adresse de résidence</label>
                  <input type="text" value={profil.adresse}
                    onChange={e => setProfil({ ...profil, adresse: e.target.value })}
                    placeholder="Ex: Rue 10, Quartier Mermoz, Dakar"
                    style={inputStyle} />
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button type="submit" disabled={loadingProfil}
                    style={{ flex: 2, padding: "12px",
                      background: loadingProfil ? "#93c5fd" : "#1a6fa8",
                      border: "none", borderRadius: 10, color: "#fff",
                      fontSize: 14, fontWeight: 600,
                      cursor: loadingProfil ? "not-allowed" : "pointer" }}>
                    {loadingProfil ? "Enregistrement..." : "💾 Enregistrer le profil"}
                  </button>
                  <button type="button"
                    onClick={() => setProfil({ lieuNaissance: "", dateNaissance: "",
                      situationMatrimoniale: "", genre: "", adresse: "" })}
                    style={{ flex: 1, padding: "12px", background: "#fff",
                      border: "1.5px solid #e2e8f0", borderRadius: 10,
                      color: "#64748b", fontSize: 14, cursor: "pointer" }}>
                    Réinitialiser
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}