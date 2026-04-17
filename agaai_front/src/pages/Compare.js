import { useState } from "react";
import { models } from "../data";
import { Link } from "react-router-dom";

export default function Compare() {
  const [selected, setSelected] = useState([]);

  const toggle = (model) => {
    if (selected.find(m => m.id === model.id)) {
      setSelected(selected.filter(m => m.id !== model.id));
    } else if (selected.length < 3) {
      setSelected([...selected, model]);
    }
  };

  const isSelected = (model) => selected.find(m => m.id === model.id);

  const fields = [
    { label: "Тип", key: "type" },
    { label: "Архитектура", key: "architecture" },
    { label: "Бенчмарки", key: "benchmarks" },
    { label: "Описание", key: "description" },
  ];

  return (
    <div style={styles.container}>
      <Link to="/" style={styles.back}>nazad</Link>
      <h1 style={styles.title}>Сравнение моделей</h1>
      <p style={{ opacity: 0.5 }}>Выберите до 3 моделей для сравнения</p>

      {/* Выбор моделей */}
      <div style={styles.selector}>
        {models.map(m => (
          <button
            key={m.id}
            onClick={() => toggle(m)}
            style={{
              ...styles.chip,
              background: isSelected(m) ? "#38bdf8" : "#1e293b",
              color: isSelected(m) ? "#000" : "#fff",
              opacity: !isSelected(m) && selected.length === 3 ? 0.4 : 1
            }}
          >
            {isSelected(m) ? "✓ " : ""}{m.name}
          </button>
        ))}
      </div>

      {/* Таблица сравнения */}
      {selected.length >= 2 ? (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Параметр</th>
                {selected.map(m => (
                  <th key={m.id} style={styles.th}>{m.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fields.map(f => (
                <tr key={f.key}>
                  <td style={styles.tdLabel}>{f.label}</td>
                  {selected.map(m => (
                    <td key={m.id} style={styles.td}>{m[f.key]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={styles.empty}>
          <p style={{ fontSize: "40px" }}>📊</p>
          <p>Выберите минимум 2 модели чтобы увидеть сравнение</p>
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
  selector: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginTop: "20px"
  },
  chip: {
    padding: "8px 16px",
    borderRadius: "20px",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "14px",
    transition: "all 0.2s"
  },
  tableWrap: {
    marginTop: "30px",
    overflowX: "auto"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse"
  },
  th: {
    padding: "14px 20px",
    background: "#1e293b",
    color: "#38bdf8",
    textAlign: "left",
    fontSize: "15px",
    borderBottom: "2px solid #334155"
  },
  td: {
    padding: "14px 20px",
    borderBottom: "1px solid #1e293b",
    fontSize: "14px",
    opacity: 0.85,
    verticalAlign: "top"
  },
  tdLabel: {
    padding: "14px 20px",
    borderBottom: "1px solid #1e293b",
    fontSize: "14px",
    fontWeight: "bold",
    color: "#38bdf8",
    whiteSpace: "nowrap"
  },
  empty: {
    textAlign: "center",
    marginTop: "80px",
    opacity: 0.5
  }
};
