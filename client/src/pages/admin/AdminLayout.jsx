// src/pages/admin/AdminLayout.jsx
import React, { useContext, useMemo, useState } from "react";
import { AppContext } from "../../context/AppContext";
import { makeAdminApi } from "../../api/adminApi";
import {
  TrendingUp,
  Users,
  Briefcase,
  AlertTriangle,
  Activity,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import AdminDashboard from "./AdminDashboard";
import AccountsTab from "./AccountsTab";
import ContentTab from "./ContentTab";
import ReportsTab from "./ReportsTab";
import LogsTab from "./LogsTab";

const AdminLayout = () => {
  const navigate = useNavigate();
  const { backendUrl, adminToken, adminData, adminLogout } =
    useContext(AppContext);
  const api = useMemo(
    () => makeAdminApi(backendUrl, adminToken),
    [backendUrl, adminToken]
  );

  const [activeTab, setActiveTab] = useState("accounts");
  const [openUserMenu, setOpenUserMenu] = useState(false);
  const [dateRange, setDateRange] = useState("month");

  const tabs = [
    {
      id: "overview",
      label: "Tổng quan",
      icon: TrendingUp,
      Comp: AdminDashboard,
    },
    {
      id: "accounts",
      label: "Quản lý tài khoản",
      icon: Users,
      Comp: AccountsTab,
    },
    {
      id: "content",
      label: "Quản lý nội dung",
      icon: Briefcase,
      Comp: ContentTab,
    },
    {
      id: "reports",
      label: "Báo cáo vi phạm",
      icon: AlertTriangle,
      Comp: ReportsTab,
    },
    { id: "logs", label: "Nhật ký hoạt động", icon: Activity, Comp: LogsTab },
  ];

  const ActiveComp = tabs.find((t) => t.id === activeTab)?.Comp ?? AccountsTab;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-indigo-600 to-blue-600 text-white flex items-center justify-center font-bold">
              A
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                Admin Dashboard
              </h1>
              <p className="text-xs text-gray-500">
                Job Portal Management System
              </p>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setOpenUserMenu((s) => !s)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100"
            >
              <img
                src={adminData?.avatar || "https://i.pravatar.cc/80?img=12"}
                alt="avatar"
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="text-left hidden sm:block">
                <div className="text-sm font-semibold text-gray-800">
                  {adminData?.username || "Admin"}
                </div>
                <div className="text-xs text-gray-500">{adminData?.email}</div>
              </div>
              <svg
                className={`w-4 h-4 text-gray-500 ${
                  openUserMenu ? "rotate-180" : ""
                }`}
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M6 9l6 6 6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            {openUserMenu && (
              <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-10">
                <button
                  onClick={() => {
                    setOpenUserMenu(false);
                    navigate("/");
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                >
                  Về trang chủ
                </button>
                <button
                  onClick={() => {
                    adminLogout();
                    navigate("/admin");
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex gap-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-4 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
          <div className="py-2">
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="day">Hôm nay</option>
              <option value="week">Tuần này</option>
              <option value="month">Tháng này</option>
              <option value="year">Năm nay</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active Tab Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <ActiveComp api={api} />
      </div>
    </div>
  );
};

export default AdminLayout;
