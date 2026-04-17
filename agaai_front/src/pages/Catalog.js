import { useState } from "react";
import { models } from "../data";
import ModelCard from "../components/ModelCard";
import { useTheme } from "../context/ThemeContext";

export default function Catalog() {
  const { theme } = useTheme();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [visible, setVisible] = useState(true);

  const filtered = models.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) &&
    (filter === "All" || m.type === filter)
  );

  const handleFilter = (f) => {
    setVisible(false);
    setTimeout(() => { setFilter(f); setVisible(true); }, 200);
  };

  return (
    <div style={{ padding: "30px", background: theme.bg, minHeight: "100vh", color: theme.text, fontFamily: "system-ui" }}>
      <h1>AI Model Index</h1>
      <p style={{ opacity: 0.6 }}>Explore AI models</p>
      <input
        placeholder="Search..."
        value={search}
        onChange={(e) => {
          setVisible(false);
          setTimeout(() => { setSearch(e.target.value); setVisible(true); }, 150);
        }}
        style={{
          padding: "10px",
          borderRadius: "8px",
          marginTop: "10px",
          width: "250px",
          background: theme.input,
          border: `1px solid ${theme.border}`,
          color: theme.text
        }}
      />
      <div style={{ marginTop: "10px", display: "flex", gap: "10px" }}>
        {["All", "LLM", "Open-source", "Fast"].map(f => (
          <button
            key={f}
            onClick={() => handleFilter(f)}
            style={{
              padding: "6px 10px",
              border: "none",
              borderRadius: "6px",
              color: filter === f ? "#000" : theme.text,
              background: filter === f ? "#38bdf8" : theme.input,
              cursor: "pointer",
              transition: "background 0.2s"
            }}
          >
            {f}
          </button>
        ))}
      </div>
      <div style={{
        marginTop: "20px",
        display: "grid",
        gap: "15px",
        gridTemplateColumns: "repeat(auto-fill, minmax(250px,1fr))",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(10px)",
        transition: "opacity 0.2s ease, transform 0.2s ease"
      }}>
        {filtered.map(m => <ModelCard key={m.id} model={m} />)}
      </div>
      {filtered.length === 0 && visible && (
        <p style={{ opacity: 0.5, marginTop: "40px", textAlign: "center" }}>Ничего не найдено</p>
      )}
    </div>
  );
}
