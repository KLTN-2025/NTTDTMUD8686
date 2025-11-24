// src/pages/admin/AdminDashboard.jsx
import React, { useEffect, useState } from "react";
import CardStat from "../../components/admin/CardStat";
import { Users, Briefcase, AlertTriangle, Clock } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const AdminDashboard = ({ api }) => {
  const [stats, setStats] = useState(null);
  const [jobStatsData, setJobStatsData] = useState([]);
  const [loginStatsData, setLoginStatsData] = useState([]);
  const [jobStatusData, setJobStatusData] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        // Gọi thống kê mở rộng + thống kê cơ bản
        const [statsNewRes, statsBaseRes] = await Promise.all([
          api.getStatistics(), // /statistics
          api.getStatsBase(), // /stats
        ]);

        const sNew = statsNewRes?.data || {};
        const sBase = statsBaseRes?.data || {};

        const summary = sNew.summary || {};
        const trends = sNew.trends || {};
        const base = sBase.data || {};

        // Chuẩn hoá object stats cho 4 thẻ trên cùng
        const mergedStats = {
          totalUsers: base.totalUsers ?? 0,
          newUsersThisMonth: summary.newUsers ?? 0, // thực tế là 7 ngày gần nhất từ BE mới
          totalJobs: base.totalJobs ?? 0,
          pendingApproval: base.pendingHR ?? 0, // “Chờ duyệt”: HR pending
          reportedJobs: summary.reportedJobCount ?? 0,
        };
        setStats(mergedStats);

        // LineChart: jobs theo ngày (7 ngày)
        const jobsPerDay = Array.isArray(trends.jobsPerDay)
          ? trends.jobsPerDay.map((d) => ({
              name: d?._id || "", // yyyy-MM-dd
              jobs: d?.count ?? 0,
              users: 0, // chưa có usersPerDay từ BE mới -> để 0
            }))
          : [];
        setJobStatsData(jobsPerDay);

        // BarChart: logins theo ngày (7 ngày)
        const loginsPerDay = Array.isArray(trends.loginsPerDay)
          ? trends.loginsPerDay.map((d) => ({
              name: d?._id || "",
              logins: d?.count ?? 0,
            }))
          : [];
        setLoginStatsData(loginsPerDay);

        // Gọi thêm 3 request để đếm job theo trạng thái
        const [approvedRes, pendingRes, rejectedRes] = await Promise.all([
          api.getJobsByStatus("approved"),
          api.getJobsByStatus("pending"),
          api.getJobsByStatus("rejected"),
        ]);

        const approvedCount =
          approvedRes?.data?.meta?.total ??
          approvedRes?.data?.data?.length ??
          0;
        const pendingCount =
          pendingRes?.data?.meta?.total ?? pendingRes?.data?.data?.length ?? 0;
        const rejectedCount =
          rejectedRes?.data?.meta?.total ??
          rejectedRes?.data?.data?.length ??
          0;

        setJobStatusData([
          { name: "Approved", value: approvedCount, color: "#10b981" },
          { name: "Pending", value: pendingCount, color: "#f59e0b" },
          { name: "Rejected", value: rejectedCount, color: "#ef4444" },
        ]);
      } catch (e) {
        // có thể im lặng nếu endpoint chưa sẵn sàng
        // console.error(e);
      }
    })();
  }, [api]);

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* 4 thẻ thống kê nhanh */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <CardStat
          iconBg="bg-blue-100"
          Icon={Users}
          title="Tổng người dùng"
          value={stats.totalUsers}
          sub={`+${stats.newUsersThisMonth} (7 ngày gần đây)`}
          subColor="text-green-600"
        />
        <CardStat
          iconBg="bg-green-100"
          Icon={Briefcase}
          title="Tổng tin tuyển dụng"
          value={stats.totalJobs}
          sub="Đang hoạt động"
        />
        <CardStat
          iconBg="bg-orange-100"
          Icon={Clock}
          title="HR chờ duyệt"
          value={stats.pendingApproval}
          sub="Cần xử lý"
          subColor="text-orange-600"
        />
        <CardStat
          iconBg="bg-red-100"
          Icon={AlertTriangle}
          title="Báo cáo vi phạm"
          value={stats.reportedJobs}
          sub="Cần kiểm tra"
          subColor="text-red-600"
        />
      </div>

      {/* Line: Jobs & Users (users hiện để 0 nếu BE chưa trả usersPerDay) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Thống kê tin tuyển dụng & Người dùng
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={jobStatsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="jobs"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Tin tuyển dụng"
              />
              <Line
                type="monotone"
                dataKey="users"
                stroke="#10b981"
                strokeWidth={2}
                name="Người dùng mới"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Bar: Lượt đăng nhập */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Lượt đăng nhập
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={loginStatsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="logins" fill="#8b5cf6" name="Lượt đăng nhập" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pie: Phân bổ trạng thái job */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Phân bổ trạng thái tin tuyển dụng
        </h3>
        <div className="flex items-center gap-8">
          <ResponsiveContainer width="40%" height={250}>
            <PieChart>
              <Pie
                data={jobStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                dataKey="value"
              >
                {jobStatusData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex-1 space-y-4">
            {jobStatusData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-gray-700">{item.name}</span>
                </div>
                <span className="font-semibold text-gray-900">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
