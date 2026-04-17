import { Link } from "react-router-dom";
import { models } from "../data";
import { useState, useEffect } from "react";
import ModelCard from "../components/ModelCard";

export default function Favorites() {
  const [savedIds, setSavedIds] = useState([]);

  useEffect(() => {
    const ids = JSON.parse(localStorage.getItem("savedModels") || "[]");
    setSavedIds(ids);
  }, []);

  const saved = models.filter(m => savedIds.includes(m.id));

  return (
    <div style={styles.container}>
      <Link to="/" style={styles.back}>nazad</Link>
      <h1 style={styles.title}>Избранное</h1>
      <p style={{ opacity: 0.5 }}>{saved.length} моделей сохранено</p>

      {saved.length === 0 ? (
        <div style={styles.empty}>
          <p style={{ fontSize: "48px" }}>🤍</p>
          <p>Вы ещё ничего не сохранили</p>
          <Link to="/" style={styles.link}>Перейти в каталог</Link>
        </div>
      ) : (
        <div style={styles.grid}>
          {saved.map(m => <ModelCard key={m.id} model={m} />)}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "30px",
    background: "#020617",
    minHeight: "100vh",
    color: "#fff",
    fontFamily: "system-ui"
  },
  back: {
    color: "#38bdf8",
    textDecoration: "none",
    fontSize: "14px",
    opacity: 0.8
  },
  title: {
    marginTop: "20px",
    fontSize: "32px"
  },
  empty: {
    textAlign: "center",
    marginTop: "80px",
    opacity: 0.6
  },
  link: {
    color: "#38bdf8",
    display: "block",
    marginTop: "12px"
  },
  grid: {
    marginTop: "20px",
    display: "grid",
    gap: "15px",
    gridTemplateColumns: "repeat(auto-fill, minmax(250px,1fr))"
  }
};
