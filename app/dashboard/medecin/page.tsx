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

interface RDV {
  id: number;
  date: string;
  heure: string;
  statut: string;
  paiement: boolean;
  disponibiliteId: number;
  patient: { nom: string; prenom: string; email: string };
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

export default function DashboardMedecin() {
  const router = useRouter();
  const [activeMenu, setActiveMenu] = useState("accueil");
  const [user, setUser] = useState<User | null>(null);
  const [disponibilites, setDisponibilites] = useState<Disponibilite[]>([]);
  const [rdvs, setRdvs] = useState<RDV[]>([]);
  const [date, setDate] = useState("");
  const [heureDebut, setHeureDebut] = useState("");
  const [heureFin, setHeureFin] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingProfil, setLoadingProfil] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [notification, setNotification] = useState<{ text: string; type: "success" | "error" } | null>(null);
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
        fetchDisponibilites(u.id);
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

  const fetchDisponibilites = async (medecinId: number) => {
    try {
      const res = await fetch(`/api/disponibilites?medecinId=${medecinId}`);
      const data = await res.json();
      setDisponibilites(data.disponibilites || []);
    } catch (err) { console.error(err); }
  };

  const fetchRdvs = async (medecinId: number) => {
    try {
      const res = await fetch(`/api/rdv?medecinId=${medecinId}`);
      const data = await res.json();
      setRdvs(data.rdvs || []);
    } catch (err) { console.error(err); }
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
    } catch (err) { console.error(err); }
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

  const handleAjouter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { setError("Utilisateur non connecté"); return; }
    setLoading(true);
    setMessage(""); setError("");
    try {
      const res = await fetch("/api/disponibilites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medecinId: user.id, date, heureDebut, heureFin }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Disponibilité ajoutée !");
        setDate(""); setHeureDebut(""); setHeureFin("");
        fetchDisponibilites(user.id);
        showNotification("Disponibilité ajoutée !", "success");
      } else {
        setError(data.message);
      }
    } catch { setError("Erreur réseau"); }
    finally { setLoading(false); }
  };

  const handleSupprimer = async (id: number) => {
    await fetch(`/api/disponibilites?id=${id}`, { method: "DELETE" });
    if (user) fetchDisponibilites(user.id);
    showNotification("Disponibilité supprimée !", "success");
  };

  const handleStatutRdv = async (rdvId: number, statut: string) => {
    try {
      const res = await fetch(`/api/rdv/${rdvId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut }),
      });
      const data = await res.json();
      if (res.ok) {
        if (user) fetchRdvs(user.id);
        showNotification(
          statut === "CONFIRME" ? "RDV confirmé !" : "RDV annulé !",
          statut === "CONFIRME" ? "success" : "error"
        );
      } else {
        showNotification(data.message || "Erreur", "error");
      }
    } catch (err) { console.error(err); }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      weekday: "long", day: "numeric", month: "long", year: "numeric"
    });
  };

  const getStatutStyle = (statut: string) => {
    switch (statut) {
      case "CONFIRME": return { bg: "#f0fdf4", border: "#bbf7d0", color: "#16a34a", label: "✅ Confirmé" };
      case "ANNULE": return { bg: "#fef2f2", border: "#fecaca", color: "#dc2626", label: "❌ Annulé" };
      default: return { bg: "#fff7ed", border: "#fed7aa", color: "#ea580c", label: "⏳ En attente" };
    }
  };

  const menuItems = [
    { id: "accueil", icon: "🏠", label: "Accueil" },
    { id: "disponibilites", icon: "📆", label: "Mes Disponibilités" },
    { id: "rdv", icon: "📅", label: "Demandes RDV" },
    { id: "patients", icon: "👥", label: "Mes Patients" },
    { id: "profil", icon: "👤", label: "Mon Profil" },
  ];

  const rdvsEnAttente = rdvs.filter(r => r.statut === "EN_ATTENTE");
  const rdvsConfirmes = rdvs.filter(r => r.statut === "CONFIRME");

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
          background: notification.type === "success" ? "#065f46" : "#dc2626",
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
        background: "linear-gradient(180deg, #064e3b 0%, #065f46 100%)",
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
                Dr. {user?.nom || ""}
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
              {id === "rdv" && rdvsEnAttente.length > 0 && (
                <span style={{ marginLeft: "auto", background: "#ef4444",
                  color: "#fff", borderRadius: 20, fontSize: 11,
                  padding: "2px 7px", fontWeight: 600 }}>
                  {rdvsEnAttente.length}
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
          <h1 style={{ fontSize: 24, fontWeight: 600, color: "#064e3b", marginBottom: 4 }}>
            {menuItems.find(m => m.id === activeMenu)?.label}
          </h1>
          <p style={{ color: "#64748b", fontSize: 14 }}>
            Bonjour Dr. {user?.prenom} {user?.nom}
          </p>
        </div>

        {/* Accueil */}
        {activeMenu === "accueil" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
              {[
                { label: "RDV en attente", value: String(rdvsEnAttente.length), icon: "⏳", color: "#fff7ed", border: "#fed7aa", text: "#ea580c" },
                { label: "RDV confirmés", value: String(rdvsConfirmes.length), icon: "✅", color: "#f0fdf4", border: "#bbf7d0", text: "#16a34a" },
                { label: "Disponibilités libres", value: String(disponibilites.filter(d => d.disponible).length), icon: "📆", color: "#eff6ff", border: "#bfdbfe", text: "#1a6fa8" },
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

            <div style={{ background: "#fff", borderRadius: 14, padding: "24px", marginBottom: 24, border: "1px solid #e2e8f0" }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#064e3b", marginBottom: 16 }}>
                ⏳ Demandes en attente ({rdvsEnAttente.length})
              </h3>
              {rdvsEnAttente.length === 0 ? (
                <div style={{ textAlign: "center", padding: "24px 0", color: "#94a3b8" }}>
                  <p style={{ fontSize: 14 }}>Aucune demande en attente</p>
                </div>
              ) : (
                rdvsEnAttente.map((rdv) => (
                  <div key={rdv.id} style={{ display: "flex", alignItems: "center",
                    justifyContent: "space-between", padding: "14px 16px",
                    background: "#fff7ed", border: "1px solid #fed7aa",
                    borderRadius: 12, marginBottom: 10 }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: "#1e293b", margin: 0 }}>
                        {rdv.patient.prenom} {rdv.patient.nom}
                      </p>
                      <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
                        📅 {formatDate(rdv.date)} à {rdv.heure}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={(e) => { e.stopPropagation(); handleStatutRdv(rdv.id, "CONFIRME"); }}
                        style={{ padding: "8px 14px", background: "#065f46",
                          border: "none", borderRadius: 8, color: "#fff",
                          fontSize: 13, cursor: "pointer", fontWeight: 500 }}>
                        ✅ Confirmer
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleStatutRdv(rdv.id, "ANNULE"); }}
                        style={{ padding: "8px 14px", background: "#fef2f2",
                          border: "1px solid #fecaca", borderRadius: 8,
                          color: "#dc2626", fontSize: 13, cursor: "pointer" }}>
                        ❌ Annuler
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ background: "#fff", borderRadius: 14, padding: "24px", border: "1px solid #e2e8f0" }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#064e3b", marginBottom: 16 }}>Actions rapides</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
                {menuItems.filter(m => m.id !== "accueil").map(({ id, icon, label }) => (
                  <button key={id} onClick={() => setActiveMenu(id)}
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
          </div>
        )}

        {/* Disponibilités */}
        {activeMenu === "disponibilites" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <div style={{ background: "#fff", borderRadius: 14, padding: "24px", border: "1px solid #e2e8f0" }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#064e3b", marginBottom: 20 }}>
                ➕ Ajouter une disponibilité
              </h3>
              {message && (
                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0",
                  color: "#16a34a", padding: "10px 14px", borderRadius: 10, fontSize: 13, marginBottom: 16 }}>
                  ✅ {message}
                </div>
              )}
              {error && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca",
                  color: "#dc2626", padding: "10px 14px", borderRadius: 10, fontSize: 13, marginBottom: 16 }}>
                  ⚠️ {error}
                </div>
              )}
              <form onSubmit={handleAjouter}>
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Date</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)}
                    required min={new Date().toISOString().split("T")[0]}
                    style={inputStyle} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                  <div>
                    <label htmlFor="heureDebut" style={labelStyle}>Heure début</label>
                    <input id="heureDebut" type="time" value={heureDebut} onChange={e => setHeureDebut(e.target.value)}
                      required style={inputStyle} title="Sélectionnez l'heure de début" />
                  </div>
                  <div>
                    <label style={labelStyle}>Heure fin</label>
                    <input type="time" value={heureFin} onChange={e => setHeureFin(e.target.value)}
                      required style={inputStyle} />
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  style={{ width: "100%", padding: "12px", background: loading ? "#6ee7b7" : "#065f46",
                    border: "none", borderRadius: 10, color: "#fff",
                    fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer" }}>
                  {loading ? "Ajout en cours..." : "Ajouter la disponibilité"}
                </button>
              </form>
            </div>

            <div style={{ background: "#fff", borderRadius: 14, padding: "24px", border: "1px solid #e2e8f0" }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#064e3b", marginBottom: 20 }}>
                📆 Mes créneaux ({disponibilites.length})
              </h3>
              {disponibilites.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px 0", color: "#94a3b8" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📆</div>
                  <p style={{ fontSize: 14 }}>Aucune disponibilité ajoutée</p>
                </div>
              ) : (
                <div style={{ maxHeight: 400, overflowY: "auto" }}>
                  {disponibilites.map((d) => (
                    <div key={d.id} style={{ display: "flex", alignItems: "center",
                      justifyContent: "space-between", padding: "12px 16px",
                      background: "#f8fafc", border: "1px solid #e2e8f0",
                      borderRadius: 10, marginBottom: 8 }}>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 500, color: "#1e293b", margin: 0 }}>
                          {formatDate(d.date)}
                        </p>
                        <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
                          🕐 {d.heureDebut} - {d.heureFin}
                        </p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ padding: "4px 10px", borderRadius: 20, fontSize: 12,
                          background: d.disponible ? "#f0fdf4" : "#fef2f2",
                          color: d.disponible ? "#16a34a" : "#dc2626",
                          border: `1px solid ${d.disponible ? "#bbf7d0" : "#fecaca"}` }}>
                          {d.disponible ? "Libre" : "Réservé"}
                        </span>
                        {d.disponible && (
                          <button onClick={() => handleSupprimer(d.id)}
                            style={{ padding: "6px 10px", background: "#fef2f2",
                              border: "1px solid #fecaca", borderRadius: 8,
                              color: "#dc2626", fontSize: 12, cursor: "pointer" }}>
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Demandes RDV */}
        {activeMenu === "rdv" && (
          <div style={{ background: "#fff", borderRadius: 14, padding: "24px", border: "1px solid #e2e8f0" }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "#064e3b", marginBottom: 20 }}>
              📅 Toutes les demandes ({rdvs.length})
            </h3>
            {rdvs.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0", color: "#94a3b8" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                <p style={{ fontSize: 14 }}>Aucune demande de RDV</p>
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
                        {rdv.patient.prenom} {rdv.patient.nom}
                      </p>
                      <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
                        📧 {rdv.patient.email}
                      </p>
                      <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
                        📅 {formatDate(rdv.date)} à {rdv.heure}
                      </p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                      <span style={{ padding: "6px 12px", borderRadius: 20, fontSize: 12,
                        background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
                        {s.label}
                      </span>
                      {rdv.statut === "EN_ATTENTE" && (
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={(e) => { e.stopPropagation(); handleStatutRdv(rdv.id, "CONFIRME"); }}
                            style={{ padding: "7px 12px", background: "#065f46",
                              border: "none", borderRadius: 8, color: "#fff",
                              fontSize: 12, cursor: "pointer", fontWeight: 500 }}>
                            ✅ Confirmer
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleStatutRdv(rdv.id, "ANNULE"); }}
                            style={{ padding: "7px 12px", background: "#fef2f2",
                              border: "1px solid #fecaca", borderRadius: 8,
                              color: "#dc2626", fontSize: 12, cursor: "pointer" }}>
                            ❌ Annuler
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Mes Patients */}
        {activeMenu === "patients" && (
          <div style={{ background: "#fff", borderRadius: 14, padding: "24px", border: "1px solid #e2e8f0" }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "#064e3b", marginBottom: 20 }}>
              👥 Mes patients
            </h3>
            {rdvs.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0", color: "#94a3b8" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
                <p style={{ fontSize: 14 }}>Aucun patient pour linstant</p>
              </div>
            ) : (
              // Patients uniques
              Array.from(new Map(rdvs.map(r => [r.patient.email, r.patient])).values()).map((patient) => (
                <div key={patient.email} style={{ display: "flex", alignItems: "center",
                  gap: 14, padding: "14px 16px", background: "#f8fafc",
                  border: "1px solid #e2e8f0", borderRadius: 12, marginBottom: 10 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%",
                    background: "#dbeafe", display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: 20 }}>👤</div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#1e293b", margin: 0 }}>
                      {patient.prenom} {patient.nom}
                    </p>
                    <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
                      📧 {patient.email}
                    </p>
                    <p style={{ fontSize: 12, color: "#94a3b8", margin: "4px 0 0" }}>
                      {rdvs.filter(r => r.patient.email === patient.email).length} RDV
                    </p>
                  </div>
                </div>
              ))
            )}
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
                  background: "#d1fae5", display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: 28 }}>
                  {profil.genre === "Homme" ? "👨‍⚕️" : profil.genre === "Femme" ? "👩‍⚕️" : "🩺"}
                </div>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 600, color: "#064e3b", margin: 0 }}>
                    Dr. {user?.prenom} {user?.nom}
                  </h2>
                  <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
                    Médecin — MediCare
                  </p>
                </div>
              </div>

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
            <div style={{ background: "#fff", borderRadius: 14, padding: "28px", border: "1px solid #e2e8f0" }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#064e3b", marginBottom: 24 }}>
                ✏️ Modifier mon profil
              </h3>

              <form onSubmit={handleSaveProfil}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
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
                  <div>
                    <label style={labelStyle}>Date de naissance</label>
                    <input type="date" value={profil.dateNaissance}
                      onChange={e => setProfil({ ...profil, dateNaissance: e.target.value })}
                      style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Lieu de naissance</label>
                    <input type="text" value={profil.lieuNaissance}
                      onChange={e => setProfil({ ...profil, lieuNaissance: e.target.value })}
                      placeholder="Ex: Dakar, Sénégal"
                      style={inputStyle} />
                  </div>
                </div>

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
                      background: loadingProfil ? "#6ee7b7" : "#065f46",
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