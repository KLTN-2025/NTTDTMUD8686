// src/api/adminApi.js
import axios from "axios";

export const makeAdminApi = (backendUrl, adminToken) => {
  const http = axios.create({
    baseURL: `${backendUrl}/api/admin`,
    headers: { Authorization: `Bearer ${adminToken}` },
  });

  return {
    /* ----------------------------- Tổng quan ----------------------------- */
    getOverview: () => http.get("/overview"),

    /* ----------------------------- HR Management ----------------------------- */
    getHRPending: () => http.get("/hr"),
    approveHR: (id) => http.post(`/hr/${id}/approve`),
    rejectHR: (id) => http.post(`/hr/${id}/reject`),
    deleteHR: (id) => http.delete(`hr/${id}`),

    /* ----------------------------- Jobs Management ----------------------------- */
    getJobsPending: () => http.get("/jobs"),
    getJobDetail: (id) => http.get(`/jobs/${id}`),
    approveJob: (id) => http.post(`/jobs/${id}/approve`),
    rejectJob: (id) => http.post(`/jobs/${id}/reject`),
    deleteJob: (id) => http.delete(`/jobs/${id}`),
    /* ----------------------------- Reports Management ----------------------------- */
    // Lấy danh sách báo cáo vi phạm
    getReports: () => http.get("/reports"),

    // Đánh dấu báo cáo đã xử lý
    markReportReviewed: (id) => http.post(`/reports/${id}/reviewed`),

    // Xoá hoặc gỡ báo cáo (nếu cần, tùy BE)
    deleteReport: (id) => http.delete(`/reports/${id}`),
    /* ----------------------------- Logs ----------------------------- */
    getLogs: () => http.get("/logs"),
  };
};
