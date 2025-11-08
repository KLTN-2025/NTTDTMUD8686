import React from "react";

const CardStat = ({ iconBg, Icon, title, value, sub, subColor }) => (
  <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        {sub && (
          <p className={`text-xs mt-1 ${subColor || "text-blue-600"}`}>{sub}</p>
        )}
      </div>
      <div className={`${iconBg} p-3 rounded-lg`}>
        <Icon className="w-6 h-6 text-gray-700" />
      </div>
    </div>
  </div>
);

export default CardStat;
