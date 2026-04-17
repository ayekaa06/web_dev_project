import { useState, useEffect } from "react";

let showToastFn = null;

export function showToast(message, type = "success") {
  if (showToastFn) showToastFn(message, type);
}

export default function Toast() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    showToastFn = (message, type) => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 3000);
    };
    return () => { showToastFn = null; };
  }, []);

  return (
    <div style={styles.wrapper}>
      {toasts.map(t => (
        <div key={t.id} style={{
          ...styles.toast,
          background: t.type === "error" ? "#ef4444" : "#22c55e"
        }}>
          {t.type === "success" ? "✓" : "✕"} {t.message}
        </div>
      ))}
    </div>
  );
}

const styles = {
  wrapper: {
    position: "fixed",
    bottom: "24px",
    right: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    zIndex: 9999
  },
  toast: {
    padding: "12px 20px",
    borderRadius: "10px",
    color: "#fff",
    fontWeight: "bold",
    fontSize: "14px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
    animation: "slideIn 0.3s ease"
  }
};
