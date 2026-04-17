import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import Landing from "./pages/Landing";
import Catalog from "./pages/Catalog";
import ModelPage from "./pages/ModelPage";
import Favorites from "./pages/Favorites";
import Compare from "./pages/Compare";
import Toast from "./components/Toast";
import { ThemeProvider, useTheme } from "./context/ThemeContext";

function NavBar() {
  const { theme, toggle } = useTheme();
  return (
    <nav style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "14px 30px",
      background: theme.nav,
      borderBottom: `1px solid ${theme.border}`
    }}>
      <NavLink to="/" style={{ color: "#38bdf8", fontWeight: "bold", fontSize: "18px", letterSpacing: "2px", textDecoration: "none" }}>
        AGAAI
      </NavLink>
      <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
        <NavLink to="/catalog" style={({ isActive }) => ({
          textDecoration: "none", fontSize: "14px", fontWeight: "bold", paddingBottom: "4px",
          color: isActive ? "#38bdf8" : theme.subtext,
          borderBottom: isActive ? "2px solid #38bdf8" : "2px solid transparent"
        })}>Каталог</NavLink>
        <NavLink to="/favorites" style={({ isActive }) => ({
          textDecoration: "none", fontSize: "14px", fontWeight: "bold", paddingBottom: "4px",
          color: isActive ? "#38bdf8" : theme.subtext,
          borderBottom: isActive ? "2px solid #38bdf8" : "2px solid transparent"
        })}>Избранное</NavLink>
        <NavLink to="/compare" style={({ isActive }) => ({
          textDecoration: "none", fontSize: "14px", fontWeight: "bold", paddingBottom: "4px",
          color: isActive ? "#38bdf8" : theme.subtext,
          borderBottom: isActive ? "2px solid #38bdf8" : "2px solid transparent"
        })}>Сравнение</NavLink>
        <button onClick={toggle} style={{
          background: theme.dark ? "#1e293b" : "#e2e8f0",
          border: "none", borderRadius: "20px", padding: "6px 14px",
          cursor: "pointer", fontSize: "16px", color: theme.text
        }}>
          {theme.dark ? "☀️" : "🌙"}
        </button>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <NavBar />
        <Toast />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/models/:id" element={<ModelPage />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/compare" element={<Compare />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
