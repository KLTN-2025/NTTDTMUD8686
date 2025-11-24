// src/pages/admin/AdminLayout.jsx
import React, { useContext, useMemo, useState, useEffect } from "react";
import { AppContext } from "../../context/AppContext";
import { makeAdminApi } from "../../api/adminApi";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  Users,
  Briefcase,
  AlertTriangle,
  Activity,
  LogOut,
  Home,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

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

  const [activeTab, setActiveTab] = useState("overview");
  const [dateRange, setDateRange] = useState("month");
  const [collapsed, setCollapsed] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const tabs = [
    {
      id: "overview",
      label: "Tổng quan",
      icon: TrendingUp,
      Comp: AdminDashboard,
    },
    { id: "accounts", label: "Tài khoản", icon: Users, Comp: AccountsTab },
    { id: "content", label: "Nội dung", icon: Briefcase, Comp: ContentTab },
    { id: "reports", label: "Vi phạm", icon: AlertTriangle, Comp: ReportsTab },
    { id: "logs", label: "Nhật ký", icon: Activity, Comp: LogsTab },
  ];

  const ActiveComp =
    tabs.find((t) => t.id === activeTab)?.Comp ?? AdminDashboard;

  const prettyDate = now.toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-gradient-to-tr from-[#f5f7fa] via-[#ebedfb] to-[#dce3ff]">
      {/* Shell */}
      <div className="flex">
        {/* ====== SIDEBAR (khác Dashboard: dạng rail, icon-first, có collapse) ====== */}
        <motion.aside
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.35 }}
          className={`h-screen sticky top-0 z-40 ${
            collapsed ? "w-[80px]" : "w-72"
          } px-3 py-4`}
        >
          <div className="h-full rounded-3xl border border-white/30 bg-white/60 backdrop-blur-md shadow-xl flex flex-col overflow-hidden">
            {/* Brand */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-white/40">
              <div className="flex items-center gap-3">
                {collapsed ? (
                  <button
                    onClick={() => setCollapsed(false)}
                    className="p-2 rounded-lg hover:bg-white/70 transition"
                    title={collapsed ? "Mở rộng" : "Thu gọn"}
                  >
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </button>
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-indigo-600 to-blue-600 text-white flex items-center justify-center font-bold">
                    A
                  </div>
                )}
                {!collapsed && (
                  <div>
                    <div className="text-sm font-semibold text-gray-800">
                      Admin Panel
                    </div>
                    <div className="text-xs text-gray-500">Management</div>
                  </div>
                )}
              </div>
              <button
                onClick={() => setCollapsed((s) => !s)}
                className="p-2 rounded-lg hover:bg-white/70 transition"
                title={collapsed ? "Mở rộng" : "Thu gọn"}
              >
                {collapsed ? (
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                ) : (
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                )}
              </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
              {tabs.map(({ id, label, icon: Icon }) => {
                const active = activeTab === id;
                return (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`group w-full flex items-center ${
                      collapsed ? "justify-center" : "justify-start"
                    } gap-3 px-3 py-3 rounded-xl transition-all duration-200
                    ${
                      active
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                        : "text-gray-700 hover:bg-white/70"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${active ? "" : "text-gray-600"}`}
                    />
                    {!collapsed && (
                      <span className="text-sm font-medium">{label}</span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Footer actions */}
            <div className="border-t border-white/40 p-3">
              <div
                className={`flex ${
                  collapsed ? "justify-center" : "justify-between"
                } items-center`}
              >
                {!collapsed && (
                  <button
                    onClick={() => navigate("/")}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-white/70 transition"
                  >
                    <Home className="w-4 h-4" />
                    Về trang chủ
                  </button>
                )}
                <button
                  onClick={() => {
                    adminLogout();
                    navigate("/admin");
                  }}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition"
                >
                  <LogOut className="w-4 h-4" />
                  {!collapsed && "Đăng xuất"}
                </button>
              </div>
            </div>
          </div>
        </motion.aside>

        {/* ====== MAIN ====== */}
        <div className="flex-1 min-w-0">
          {/* Header glassy (giống tinh thần Dashboard nhưng nội dung khác) */}
          <motion.header
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            className="sticky top-0 z-30 px-4 md:px-8 py-4"
          >
            <div className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/30 shadow-lg">
              <div className="px-5 py-4 flex items-center justify-between">
                {/* Left */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/50 bg-white shadow">
                    <img
                      src={
                        adminData?.avatar || "https://i.pravatar.cc/80?img=12"
                      }
                      alt="admin"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">{prettyDate}</div>
                    <div className="text-lg font-semibold text-gray-900">
                      Xin chào, {adminData?.username || "Admin"}
                    </div>
                  </div>
                </div>

                {/* Right controls */}
                {/* <div className="flex items-center gap-3">
                  <select
                    className="text-sm rounded-lg border border-gray-200 bg-white/80 px-3 py-2 focus:outline-none"
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                  >
                    <option value="day">Hôm nay</option>
                    <option value="week">Tuần này</option>
                    <option value="month">Tháng này</option>
                    <option value="year">Năm nay</option>
                  </select>
                </div> */}
              </div>

              {/* Sub tabs rail (hiển thị tên tab đang chọn) */}
              <div className="px-5 pb-3 text-sm text-gray-500">
                Đang xem:{" "}
                <span className="font-medium text-gray-800">
                  {tabs.find((t) => t.id === activeTab)?.label}
                </span>
              </div>
            </div>
          </motion.header>

          {/* Content */}
          <main className="px-4 md:px-8 py-6">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="rounded-3xl bg-white/70 backdrop-blur-md border border-white/30 shadow-xl p-6"
            >
              {/* Lớp bọc nội dung cho từng tab: không đổi logic, chỉ trình bày */}
              <ActiveComp api={api} dateRange={dateRange} />
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
