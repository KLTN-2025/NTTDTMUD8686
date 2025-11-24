// // src/api/adminApi.js
// import axios from "axios";

// // export const makeAdminApi = (backendUrl, adminToken) => {
// //   const http = axios.create({
// //     baseURL: `${backendUrl}/api/admin`,
// //     headers: { Authorization: `Bearer ${adminToken}` },
// //   });
//   const backendUrl = import.meta.env.VITE_BACKEND_URL;

// export const makeAdminApi = (adminToken) => {
//   const http = axios.create({
//     baseURL: `${backendUrl}/api/admin`,
//     headers: { Authorization: `Bearer ${adminToken}` },
//   });


//   return {
//     //* ----------------------------- Tổng quan / Statistics ----------------------------- */
//     // thống kê mở rộng
//     getStatistics: () => http.get("/statistics"),
//     // thống kê nền tảng cũ (có totalUsers, totalJobs, pendingHR, ...)
//     getStatsBase: () => http.get("/stats"),
//     // lấy job theo trạng thái (để đếm approved/pending/rejected)
//     getJobsByStatus: (status) => http.get(`/jobs`, { params: { status } }),

//     /* ----------------------------- HR Management ----------------------------- */
//     getHRPending: () => http.get("/hr"),
//     approveHR: (id) => http.post(`/hr/${id}/approve`),
//     rejectHR: (id) => http.post(`/hr/${id}/reject`),
//     deleteHR: (id) => http.delete(`hr/${id}`),

//     /* ----------------------------- Jobs Management ----------------------------- */
//     getJobsPending: () => http.get("/jobs"),
//     getJobDetail: (id) => http.get(`/jobs/${id}`),
//     approveJob: (id) => http.post(`/jobs/${id}/approve`),
//     rejectJob: (id) => http.post(`/jobs/${id}/reject`),
//     deleteJob: (id) => http.delete(`/jobs/${id}`),
//     /* ----------------------------- Reports Management ----------------------------- */
//     // Lấy danh sách báo cáo vi phạm
//     getReports: () => http.get("/reports"),

//     // Đánh dấu báo cáo đã xử lý
//     markReportReviewed: (id) => http.post(`/reports/${id}/reviewed`),

//     // Xoá hoặc gỡ báo cáo (nếu cần, tùy BE)
//     deleteReport: (id) => http.delete(`/reports/${id}`),
//     /* ----------------------------- Logs ----------------------------- */
//     getLogs: () => http.get("/logs"),
//   };
// };

// src/api/adminApi.js
import axios from "axios";

// 🔹 Lấy URL backend từ file .env (Vite tự động đọc import.meta.env)
const backendUrl = import.meta.env.VITE_BACKEND_URL;

export const makeAdminApi = (adminToken) => {
  // Tạo instance axios dùng chung cho các request admin
  const http = axios.create({
    baseURL: `${backendUrl}/api/admin`,
    headers: { Authorization: `Bearer ${adminToken}` },
  });

  return {
    //* ----------------------------- Tổng quan / Statistics ----------------------------- */
    // Thống kê mở rộng
    getStatistics: () => http.get("/statistics"),
    // Thống kê cơ bản (totalUsers, totalJobs, pendingHR, ...)
    getStatsBase: () => http.get("/stats"),
    // Lấy job theo trạng thái
    getJobsByStatus: (status) => http.get("/jobs", { params: { status } }),

    /* ----------------------------- HR Management ----------------------------- */
    getHRPending: () => http.get("/hr"),
    approveHR: (id) => http.post(`/hr/${id}/approve`),
    rejectHR: (id) => http.post(`/hr/${id}/reject`),
    deleteHR: (id) => http.delete(`/hr/${id}`),

    /* ----------------------------- Jobs Management ----------------------------- */
    getJobsPending: () => http.get("/jobs"),
    getJobDetail: (id) => http.get(`/jobs/${id}`),
    approveJob: (id) => http.post(`/jobs/${id}/approve`),
    rejectJob: (id) => http.post(`/jobs/${id}/reject`),
    deleteJob: (id) => http.delete(`/jobs/${id}`),

    /* ----------------------------- Reports Management ----------------------------- */
    getReports: () => http.get("/reports"),
    markReportReviewed: (id) => http.post(`/reports/${id}/reviewed`),
    deleteReport: (id) => http.delete(`/reports/${id}`),

    /* ----------------------------- Logs ----------------------------- */
    getLogs: () => http.get("/logs"),
  };
};

