import React from "react";

const SectionHeader = ({ title, desc }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
    <p className="text-sm text-gray-600 mt-1">{desc}</p>
  </div>
);

export default SectionHeader;
