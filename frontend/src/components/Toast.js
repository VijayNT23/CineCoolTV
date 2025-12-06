import React, { useEffect, useState } from "react";

/**
 * Global toast listener.
 * Dispatch an event anywhere in the app like:
 * window.dispatchEvent(new CustomEvent('appToast', { detail: { message: 'Saved!', type: 'success' } }))
 */
export default function Toast() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = (e) => {
      const { message = "", type = "info", duration = 3000 } = e.detail || {};
      const id = Date.now() + Math.random();
      setToasts((t) => [...t, { id, message, type }]);
      setTimeout(() => {
        setToasts((t) => t.filter(x => x.id !== id));
      }, duration);
    };

    window.addEventListener("appToast", handler);
    return () => window.removeEventListener("appToast", handler);
  }, []);

  if (!toasts.length) return null;

  return (
    <div className="fixed z-60 right-4 bottom-6 flex flex-col gap-3 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`pointer-events-auto max-w-sm w-full rounded-lg px-4 py-3 shadow-lg transform transition-all ${
            t.type === "success" ? "bg-green-500 text-white" :
            t.type === "error" ? "bg-red-500 text-white" :
            "bg-gray-900 text-white"
          }`}
        >
          <div className="text-sm font-medium">{t.message}</div>
        </div>
      ))}
    </div>
  );
}