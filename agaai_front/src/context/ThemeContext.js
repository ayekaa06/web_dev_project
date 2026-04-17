import { createContext, useContext, useState } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(true);
  const toggle = () => setDark(!dark);

  const theme = {
    dark,
    bg: dark ? "#020617" : "#f1f5f9",
    card: dark ? "rgba(30,41,59,0.6)" : "#fff",
    nav: dark ? "#0f172a" : "#fff",
    border: dark ? "#1e293b" : "#e2e8f0",
    text: dark ? "#fff" : "#0f172a",
    subtext: dark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)",
    input: dark ? "#1e293b" : "#fff",
    block: dark ? "#1e293b" : "#fff",
  };

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
