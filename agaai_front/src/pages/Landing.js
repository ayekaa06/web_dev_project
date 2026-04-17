import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

export default function Landing() {
  const { theme } = useTheme();

  return (
    <div style={{ background: theme.bg, minHeight: "100vh", color: theme.text, fontFamily: "system-ui" }}>

      {/* Hero секция */}
      <div style={{
        textAlign: "center",
        padding: "100px 30px 60px",
        background: "linear-gradient(180deg, #0f172a 0%, transparent 100%)"
      }}>
        <span style={{
          background: "#38bdf8",
          color: "#000",
          padding: "4px 14px",
          borderRadius: "20px",
          fontSize: "13px",
          fontWeight: "bold"
        }}>
          Beta
        </span>
        <h1 style={{
          fontSize: "56px",
          margin: "20px 0 10px",
          lineHeight: 1.2,
          background: "linear-gradient(90deg, #fff, #38bdf8)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent"
        }}>
          Найди идеальную<br />AI модель
        </h1>
        <p style={{ fontSize: "18px", opacity: 0.6, maxWidth: "500px", margin: "0 auto 40px" }}>
          Каталог AI моделей с бенчмарками, сравнением и персональными заметками
        </p>
        <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link to="/catalog" style={{
            padding: "14px 32px",
            background: "#38bdf8",
            color: "#000",
            borderRadius: "12px",
            textDecoration: "none",
            fontWeight: "bold",
            fontSize: "16px"
          }}>
            Открыть каталог
          </Link>
          <Link to="/compare" style={{
            padding: "14px 32px",
            background: "transparent",
            color: "#38bdf8",
            borderRadius: "12px",
            textDecoration: "none",
            fontWeight: "bold",
            fontSize: "16px",
            border: "2px solid #38bdf8"
          }}>
            Сравнить модели
          </Link>
        </div>
      </div>

      {/* Фичи */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px,1fr))",
        gap: "20px",
        padding: "40px 30px",
        maxWidth: "900px",
        margin: "0 auto"
      }}>
        {[
          { icon: "🔍", title: "Поиск и фильтры", desc: "Найдите модель по типу, архитектуре и характеристикам" },
          { icon: "📊", title: "Сравнение", desc: "Сравнивайте до 3 моделей side-by-side" },
          { icon: "❤️", title: "Избранное", desc: "Сохраняйте понравившиеся модели" },
          { icon: "📝", title: "Заметки", desc: "Пишите личные заметки к каждой модели" },
        ].map(f => (
          <div key={f.title} style={{
            padding: "24px",
            background: theme.block,
            borderRadius: "16px",
            border: `1px solid ${theme.border}`
          }}>
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>{f.icon}</div>
            <h3 style={{ marginBottom: "8px", color: "#38bdf8" }}>{f.title}</h3>
            <p style={{ opacity: 0.6, fontSize: "14px", lineHeight: 1.5 }}>{f.desc}</p>
          </div>
        ))}
      </div>

      {/* CTA внизу */}
      <div style={{ textAlign: "center", padding: "60px 30px" }}>
        <h2 style={{ fontSize: "32px", marginBottom: "16px" }}>Готов начать?</h2>
        <Link to="/catalog" style={{
          padding: "14px 40px",
          background: "#38bdf8",
          color: "#000",
          borderRadius: "12px",
          textDecoration: "none",
          fontWeight: "bold",
          fontSize: "16px"
        }}>
          Перейти в каталог
        </Link>
      </div>
    </div>
  );
}
