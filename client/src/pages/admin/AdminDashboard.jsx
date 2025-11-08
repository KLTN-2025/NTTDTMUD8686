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
        const { data } = await api.getOverview();
        setStats(data.stats);
        setJobStatsData(data.jobStatsData || []);
        setLoginStatsData(data.loginStatsData || []);
        setJobStatusData(data.jobStatusData || []);
      } catch {
        // nếu chưa có endpoint có thể bỏ qua
      }
    })();
  }, []);

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <CardStat
          iconBg="bg-blue-100"
          Icon={Users}
          title="Tổng người dùng"
          value={stats.totalUsers}
          sub={`+${stats.newUsersThisMonth} tháng này`}
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
          title="Chờ duyệt"
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
                  <Cell
                    key={idx}
                    fill={
                      entry.color || ["#10b981", "#f59e0b", "#ef4444"][idx % 3]
                    }
                  />
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
