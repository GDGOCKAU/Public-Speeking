import React from "react";

// The signature 4px Google accent strip. It belongs at the very bottom of every full-height
// page shell, as the last child, so it sits flush against the viewport edge below the
// content and any footer. Never reordered, never thicker, never fewer than four segments.
export default function GoogleBar() {
  return (
    <div className="flex w-full flex-shrink-0" style={{ height: "4px" }}>
      <div className="flex-1" style={{ backgroundColor: "#4285F4" }} />
      <div className="flex-1" style={{ backgroundColor: "#EA4335" }} />
      <div className="flex-1" style={{ backgroundColor: "#FBBC05" }} />
      <div className="flex-1" style={{ backgroundColor: "#34A853" }} />
    </div>
  );
}
