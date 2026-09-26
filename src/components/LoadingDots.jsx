import React from "react";

// Small inline loading indicator — the same bouncing 4-dot animation used on
// the login screen, reused everywhere else in the admin panel that waits on
// data instead of every page inventing its own "Loading..." text.
export default function LoadingDots({ label, size = 8, darkMode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2.5 py-2">
      <div className="flex items-center justify-center gap-2.5">
        {[
          { color: "#4285F4", delay: "0s" },
          { color: "#EA4335", delay: "0.15s" },
          { color: "#FBBC04", delay: "0.3s" },
          { color: "#34A853", delay: "0.45s" },
        ].map(({ color, delay }) => (
          <span
            key={color}
            style={{
              display: "block",
              width: `${size}px`,
              height: `${size}px`,
              borderRadius: "50%",
              backgroundColor: color,
              animation: `loadingDotsBounce 0.8s cubic-bezier(0.33, 0, 0.66, 1) ${delay} infinite`,
            }}
          />
        ))}
      </div>
      {label && (
        <span className={`text-[13px] font-['Roboto'] ${darkMode ? "text-neutral-500" : "text-[#9AA0A6]"}`}>
          {label}
        </span>
      )}
      <style>{`
        @keyframes loadingDotsBounce {
          0%, 100% { transform: translateY(0); }
          45% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}
