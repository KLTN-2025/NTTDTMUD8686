import React, { useContext, useState } from "react";
import axios from "axios";
import { AppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const AdminLogin = () => {
  const { backendUrl, setAdminToken, setAdminData } = useContext(AppContext);
  const [username, setUsername] = useState("admin"); // gợi ý
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    console.log(username, password);
    try {
      setLoading(true);
      const { data } = await axios.post(`${backendUrl}/api/admin/login`, {
        username,
        password,
      });
      if (data.success) {
        setAdminToken(data.token);
        setAdminData(data.admin);
        toast.success("Đăng nhập admin thành công");
        navigate("/dashboard-management");
      } else {
        toast.error(data.message || "Đăng nhập thất bại");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white/10 border border-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white font-bold text-xl shadow-lg">
            A
          </div>
          <h1 className="mt-4 text-white text-2xl font-bold">Admin Portal</h1>
          <p className="text-slate-300 text-sm">
            Đăng nhập để quản trị hệ thống
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-200 text-sm mb-1">Email</label>
            <input
              type="text"
              className="w-full rounded-lg bg-white/5 border border-white/10 text-white px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-slate-200 text-sm mb-1">
              Password
            </label>
            <input
              type="password"
              className="w-full rounded-lg bg-white/5 border border-white/10 text-white px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-2.5 font-semibold hover:from-indigo-700 hover:to-blue-700 transition disabled:opacity-70"
          >
            {loading ? "Đang xử lý..." : "Đăng nhập"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
