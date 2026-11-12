import React from "react";

// Disco de la ruleta: porciones reales, textos y pernos cromados.
// Solo dibuja: el ángulo lo controla el padre con `rotation`.
const PEGS = Array.from({ length: 18 }, (_, i) => (i * 360) / 18);

export default function WheelDisc({ rotation, segments, background }) {
  return (
    <div
      className="lb-wheel-disc"
      style={{
        background,
        transform: `rotate(${rotation}deg)`,
        transition: "transform 2.7s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {segments.map((s) => (
        <span
          key={s.label}
          className="absolute left-1/2 top-1/2 font-display text-sm font-black tracking-tight text-slate-950"
          style={{ transform: `translate(-50%, -50%) rotate(${s.mid}deg) translateY(-78px)` }}
        >
          {s.label}
        </span>
      ))}
      {PEGS.map((angle) => (
        <i
          key={angle}
          className="lb-wheel-peg"
          style={{ transform: `rotate(${angle}deg) translateY(-93px)` }}
        />
      ))}
    </div>
  );
}