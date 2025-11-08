import React, { useState } from "react";
import { Eye, Trash2, CheckCircle } from "lucide-react";

const ReportsTable = ({ rows = [], loading, onDelete, onMarkReviewed }) => {
  const [selectedReport, setSelectedReport] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">
        Đang tải danh sách báo cáo...
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {[
                "Tiêu đề",
                "Công ty",
                "Lý do",
                "Ngày báo cáo",
                "Trạng thái",
                "Hành động",
              ].map((h) => (
                <th
                  key={h}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="text-center py-6 text-gray-500 text-sm"
                >
                  Không có báo cáo nào.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {r.title || "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {r.company || "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {r.reason || "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {r.createdAt
                      ? new Date(r.createdAt).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {r.status === "pending" ? (
                      <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs">
                        Chờ duyệt
                      </span>
                    ) : (
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
                        Đã xử lý
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedReport(r)}
                        className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <Eye className="w-4 h-4 mr-1" /> Xem
                      </button>
                      {r.status === "pending" ? (
                        <button
                          onClick={() => onMarkReviewed(r._id)}
                          className="inline-flex items-center px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" /> Đánh dấu xử
                          lý
                        </button>
                      ) : (
                        <button
                          onClick={() => setConfirmId(r.jobId)}
                          // onClick={() => onDeleteJob(r.jobId?._id)}
                          className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                          <Trash2 className="w-4 h-4 mr-1" /> Gỡ bỏ tin
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Popup xem chi tiết */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 relative">
            <button
              onClick={() => setSelectedReport(null)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl"
            >
              ×
            </button>
            <h3 className="text-lg font-semibold mb-4">
              Chi tiết báo cáo vi phạm
            </h3>

            <div className="space-y-3 text-sm">
              <div>
                <strong>Tiêu đề:</strong> {selectedReport.title}
              </div>
              <div>
                <strong>Công ty:</strong> {selectedReport.company}
              </div>
              <div>
                <strong>Lý do:</strong> {selectedReport.reason}
              </div>
              <div>
                <strong>Mô tả:</strong> {selectedReport.description || "—"}
              </div>
              <div>
                <strong>Ngày báo cáo:</strong>{" "}
                {new Date(selectedReport.createdAt).toLocaleString()}
              </div>
              <div>
                <strong>Trạng thái:</strong>{" "}
                <span
                  className={`${
                    selectedReport.status === "pending"
                      ? "text-yellow-700"
                      : "text-green-700"
                  } font-medium`}
                >
                  {selectedReport.status === "pending"
                    ? "Chờ duyệt"
                    : "Đã xử lý"}
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              {selectedReport.status === "pending" && (
                <button
                  onClick={() => {
                    onMarkReviewed(selectedReport._id);
                    setSelectedReport(null);
                  }}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Đánh dấu đã xử lý
                </button>
              )}
              <button
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup xác nhận xoá */}
      {confirmId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[360px] text-center">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">
              Xác nhận gỡ bài đăng
            </h3>
            <p className="text-sm text-gray-600 mb-5">
              Bạn có chắc chắn muốn gỡ bài đăng này không?
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => {
                  onDelete(confirmId);
                  setConfirmId(null);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Gỡ
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
    </>
  );
};

export default ReportsTable;
