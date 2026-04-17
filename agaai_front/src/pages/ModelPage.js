import { useParams, Link } from "react-router-dom";
import { models } from "../data";
import { useState, useEffect } from "react";
import { showToast } from "../components/Toast";

export default function ModelPage() {
  const { id } = useParams();
  const model = models.find(m => m.id === Number(id));
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedIds = JSON.parse(localStorage.getItem("savedModels") || "[]");
    setSaved(savedIds.includes(model?.id));
    const savedNote = localStorage.getItem("note_" + id);
    if (savedNote) setNote(savedNote);
  }, [id, model]);

  if (!model) return <h2 style={{ color: "#fff", padding: "30px" }}>Not found</h2>;

  const toggleSave = () => {
    const savedIds = JSON.parse(localStorage.getItem("savedModels") || "[]");
    const updated = savedIds.includes(model.id)
      ? savedIds.filter(i => i !== model.id)
      : [...savedIds, model.id];
    localStorage.setItem("savedModels", JSON.stringify(updated));
    setSaved(!saved);
    showToast(saved ? "Удалено из избранного" : "Добавлено в избранное!");
  };

  const saveNote = () => {
    localStorage.setItem("note_" + id, note);
    showToast("Заметка сохранена!");
  };

  return (
    <div style={styles.container}>
      <Link to="/" style={styles.back}>nazad</Link>
      <div style={styles.hero}>
        <div>
          <span style={styles.badge}>{model.type}</span>
          <h1 style={styles.title}>{model.name}</h1>
          <p style={styles.desc}>{model.description}</p>
        </div>
        <button onClick={toggleSave} style={styles.heartBtn}>
          {saved ? "❤️" : "🤍"}
        </button>
      </div>
      <div style={styles.grid}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Архитектура</h3>
          <p style={styles.cardText}>{model.architecture}</p>
        </div>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Бенчмарки</h3>
          <p style={styles.cardText}>{model.benchmarks}</p>
        </div>
      </div>
      <div style={styles.noteBlock}>
        <h3 style={styles.cardTitle}>Ваши заметки</h3>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Напишите что-нибудь об этой модели..."
          style={styles.textarea}
        />
        <button onClick={saveNote} style={styles.saveBtn}>
          Сохранить заметку
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "30px",
    background: "#020617",
    minHeight: "100vh",
    color: "#fff",
    fontFamily: "system-ui",
    maxWidth: "800px",
    margin: "0 auto"
  },
  back: {
    color: "#38bdf8",
    textDecoration: "none",
    fontSize: "14px",
    opacity: 0.8
  },
  hero: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: "24px",
    padding: "30px",
    background: "linear-gradient(135deg, #1e293b, #0f172a)",
    borderRadius: "20px",
    border: "1px solid #1e3a5f"
  },
  badge: {
    fontSize: "12px",
    background: "#38bdf8",
    color: "#000",
    padding: "4px 10px",
    borderRadius: "20px",
    fontWeight: "bold"
  },
  title: {
    fontSize: "36px",
    margin: "12px 0 8px"
  },
  desc: {
    opacity: 0.7,
    fontSize: "16px"
  },
  heartBtn: {
    fontSize: "32px",
    background: "transparent",
    border: "none",
    cursor: "pointer"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
    marginTop: "20px"
  },
  card: {
    background: "#1e293b",
    borderRadius: "16px",
    padding: "20px",
    border: "1px solid #334155"
  },
  cardTitle: {
    fontSize: "16px",
    fontWeight: "bold",
    marginBottom: "8px",
    color: "#38bdf8"
  },
  cardText: {
    opacity: 0.8,
    fontSize: "15px"
  },
  noteBlock: {
    marginTop: "20px",
    background: "#1e293b",
    borderRadius: "16px",
    padding: "20px",
    border: "1px solid #334155"
  },
  textarea: {
    width: "100%",
    height: "120px",
    marginTop: "10px",
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: "10px",
    color: "#fff",
    padding: "12px",
    fontSize: "14px",
    resize: "vertical",
    boxSizing: "border-box"
  },
  saveBtn: {
    marginTop: "12px",
    padding: "10px 20px",
    background: "#38bdf8",
    color: "#000",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "14px"
  }
};
