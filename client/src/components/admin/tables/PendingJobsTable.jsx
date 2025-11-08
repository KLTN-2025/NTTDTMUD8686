// src/components/admin/tables/PendingJobsTable.jsx
import React, { useState } from "react";
import { CheckCircle, XCircle, Eye, Trash2 } from "lucide-react";
import Badge from "../Badge";
const PendingJobsTable = ({ rows, onApprove, onReject, onView, onDelete }) => {
  const [confirmId, setConfirmId] = useState(null);
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            {["Tiêu đề", "Công ty", "Ngày gửi", "Trạng thái", "Hành động"].map(
              (h) => (
                <th
                  key={h}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                >
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {rows.map((job) => (
            <tr key={job._id} className="hover:bg-gray-50">
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                {job.title}
              </td>
              <td className="px-6 py-4 text-sm text-gray-700">
                {job.companyId?.name || "-"}
                <div className="text-xs text-gray-500">
                  {job.companyId?.email}
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {job.createdAt
                  ? new Date(job.createdAt).toLocaleDateString()
                  : "-"}
              </td>
              <td className="px-6 py-4">
                {job.status === "pending" && (
                  <Badge text="Chờ duyệt" color="yellow" />
                )}
                {job.status === "approved" && (
                  <Badge text="Đã duyệt" color="green" />
                )}
                {job.status === "rejected" && (
                  <Badge text="Từ chối" color="red" />
                )}
              </td>
              <td className="px-6 py-4 text-sm">
                {job.status === "pending" ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => onApprove(job._id)}
                      className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" /> Duyệt
                    </button>
                    <button
                      onClick={() => onReject(job._id)}
                      className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      <XCircle className="w-4 h-4 mr-1" /> Từ chối
                    </button>
                    <button
                      onClick={() => onView(job._id)}
                      className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Eye className="w-4 h-4 mr-1" /> Xem
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmId(job._id)}
                    className="inline-flex items-center px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    <Trash2 className="w-4 h-4 mr-1" /> Xoá bài đăng
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Popup xác nhận xoá */}
      {confirmId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[360px] text-center">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">
              Xác nhận xoá bài đăng
            </h3>
            <p className="text-sm text-gray-600 mb-5">
              Bạn có chắc chắn muốn xoá bài đăng này không?
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => {
                  onDelete(confirmId);
                  setConfirmId(null);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Xoá
              </button>
              <button
                onClick={() => setConfirmId(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Huỷ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingJobsTable;
