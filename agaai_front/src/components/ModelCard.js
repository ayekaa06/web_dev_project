import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { showToast } from "./Toast";

export default function ModelCard({ model }) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedIds = JSON.parse(localStorage.getItem("savedModels") || "[]");
    setSaved(savedIds.includes(model.id));
  }, [model.id]);

  const toggleSave = (e) => {
    e.preventDefault();
    const savedIds = JSON.parse(localStorage.getItem("savedModels") || "[]");
    let updated;
    if (savedIds.includes(model.id)) {
      updated = savedIds.filter(id => id !== model.id);
      showToast("Удалено из избранного");
    } else {
      updated = [...savedIds, model.id];
      showToast("Добавлено в избранное!");
    }
    localStorage.setItem("savedModels", JSON.stringify(updated));
    setSaved(!saved);
  };

  return (
    <Link to={`/models/${model.id}`} style={{ textDecoration: "none" }}>
      <div
        style={styles.card}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        <div style={styles.header}>
          <h3>{model.name}</h3>
          <span style={styles.badge}>{model.type}</span>
        </div>
        <p style={styles.desc}>{model.description}</p>
        <button onClick={toggleSave} style={styles.save}>
          {saved ? "❤️" : "🤍"}
        </button>
      </div>
    </Link>
  );
}

const styles = {
  card: {
    padding: "18px",
    borderRadius: "18px",
    background: "rgba(30,41,59,0.6)",
    color: "#fff",
    transition: "0.3s",
    position: "relative"
  },
  header: {
    display: "flex",
    justifyContent: "space-between"
  },
  badge: {
    fontSize: "12px",
    background: "#38bdf8",
    padding: "4px 8px",
    borderRadius: "6px"
  },
  desc: {
    marginTop: "10px",
    opacity: 0.7
  },
  save: {
    position: "absolute",
    bottom: "10px",
    right: "10px",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: "18px"
  }
};
