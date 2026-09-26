import React from "react";

export default function LoadingScreen({
  darkMode = false,
  title = "Loading",
  badge = "Powered by GDG KAU",
}) {
  const backgroundColor = darkMode ? "#121212" : "#F8F9FA";
  const titleColor = darkMode ? "#E0E0E0" : "#1C1B1F";
  const badgeBackground = darkMode ? "#1E1E1E" : "#FFFFFF";
  const badgeBorder = darkMode ? "#333333" : "#E0E0E0";
  const badgeTextColor = darkMode ? "#AAAAAA" : "#5F6368";
  const shapeOpacity = darkMode ? 0.12 : 0.045;
  return (
    <div
      className="relative flex flex-col items-center justify-center overflow-hidden"
      style={{ width: "100%", height: "100vh", backgroundColor}}
    >
      {/* Geometric bg — top-right */}
      <svg className="absolute top-0 right-0 pointer-events-none" width="420" height="420" viewBox="0 0 420 420" fill="none" style={{ opacity: shapeOpacity }}>
        <circle cx="360" cy="60"  r="180" stroke="#4285F4" strokeWidth="1.5" />
        <circle cx="360" cy="60"  r="130" stroke="#EA4335" strokeWidth="1.5" />
        <circle cx="300" cy="120" r="180" stroke="#FBBC04" strokeWidth="1.5" />
        <circle cx="300" cy="120" r="100" stroke="#34A853" strokeWidth="1.5" />
        <circle cx="420" cy="0"   r="90"  stroke="#4285F4" strokeWidth="1.5" />
      </svg>

      {/* Geometric bg — bottom-left */}
      <svg className="absolute bottom-0 left-0 pointer-events-none" width="420" height="420" viewBox="0 0 420 420" fill="none" style={{ opacity: shapeOpacity }}>
        <circle cx="60"  cy="360" r="180" stroke="#34A853" strokeWidth="1.5" />
        <circle cx="60"  cy="360" r="130" stroke="#FBBC04" strokeWidth="1.5" />
        <circle cx="120" cy="300" r="180" stroke="#EA4335" strokeWidth="1.5" />
        <circle cx="120" cy="300" r="100" stroke="#4285F4" strokeWidth="1.5" />
        <circle cx="0"   cy="420" r="90"  stroke="#34A853" strokeWidth="1.5" />
      </svg>

      {/* ── Bouncing dots ── */}
      <div className="flex items-end gap-4" style={{ height: "52px" }}>
        {[
          { color: "#4285F4", delay: "0s"    },
          { color: "#EA4335", delay: "0.16s" },
          { color: "#FBBC04", delay: "0.32s" },
          { color: "#34A853", delay: "0.48s" },
        ].map(({ color, delay }) => (
          <span
            key={color}
            style={{
              display: "block",
              width: "14px",
              height: "14px",
              borderRadius: "50%",
              backgroundColor: color,
              animation: `dotBounce 0.8s cubic-bezier(0.33, 0, 0.66, 1) ${delay} infinite`,
            }}
          />
        ))}
      </div>

      {/* Heading */}
      <h1
        className="mt-7 text-[28px] font-bold tracking-[-0.4px]"
        style={{ fontFamily: "'DM Sans', sans-serif", color: titleColor }}
      >
        {title}
      </h1>

      {/* Footer badge */}
      <div
        className="absolute bottom-8 flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white"
        style={{ backgroundColor: badgeBackground, border: `1.5px solid ${badgeBorder}`, boxShadow: darkMode ? "0 1px 8px rgba(0,0,0,0.35)" : "0 1px 6px rgba(0,0,0,0.06)", }}
      >
        <div className="flex items-center gap-1">
          {["#4285F4", "#EA4335", "#FBBC04", "#34A853"].map(c => (
            <span key={c} className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} />
          ))}
        </div>
        <span className="text-[12px] font-semibold text-[#5F6368]" style={{ fontFamily: "'DM Sans', sans-serif", color: badgeTextColor,}}>
          {badge}
        </span>
      </div>

      <style>{`
        @keyframes dotBounce {
          0%, 100% { transform: translateY(0);     animation-timing-function: cubic-bezier(0.33, 0, 0.66, 1); }
          45%       { transform: translateY(-28px); animation-timing-function: cubic-bezier(0.33, 0, 0.66, 1); }
        }
      `}</style>
    </div>
  );
}