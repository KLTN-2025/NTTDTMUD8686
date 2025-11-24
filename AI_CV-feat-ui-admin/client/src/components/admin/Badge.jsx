// src/components/admin/Badge.jsx
import React from "react";

const Badge = ({ text, color }) => {
  const cmap = {
    yellow: "bg-yellow-100 text-yellow-800",
    green: "bg-green-100 text-green-800",
    red: "bg-red-100 text-red-800",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cmap[color]}`}
    >
      {text}
    </span>
  );
};

export default Badge;
