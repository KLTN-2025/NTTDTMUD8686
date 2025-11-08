// src/components/admin/tables/PendingHRTable.jsx
import React, { useState, useEffect } from "react";
import { CheckCircle, XCircle, Trash2 } from "lucide-react";

const PendingHRTable = ({ rows = [], onApprove, onReject, onDelete }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmId, setConfirmId] = useState(null);
  const perPage = 10;

  const sortedRows = [...rows].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  const totalPages = Math.ceil(sortedRows.length / perPage);
  const currentRows = sortedRows.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [rows.length]);

  return (
    <div className="relative">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {["Tên", "Email", "Ngày đăng ký", "Trạng thái", "Hành động"].map(
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
            {currentRows.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-8 text-center text-gray-500 text-sm"
                >
                  Không có HR nào
                </td>
              </tr>
            ) : (
              currentRows.map((hr) => (
                <tr key={hr._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {hr.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {hr.email}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {hr.createdAt
                      ? new Date(hr.createdAt).toLocaleDateString("vi-VN")
                      : "-"}
                  </td>

                  <td className="px-6 py-4">
                    {hr.status === "pending" && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Chờ duyệt
                      </span>
                    )}
                    {hr.status === "approved" && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Đã duyệt
                      </span>
                    )}
                    {hr.status === "rejected" && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Từ chối
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-sm">
                    {hr.status === "pending" ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => onApprove(hr._id)}
                          className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" /> Duyệt
                        </button>
                        <button
                          onClick={() => onReject(hr._id)}
                          className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                          <XCircle className="w-4 h-4 mr-1" /> Từ chối
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmId(hr._id)}
                        className="inline-flex items-center px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                      >
                        <Trash2 className="w-4 h-4 mr-1" /> Xoá tài khoản
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center px-6 py-4 bg-gray-50 border-t border-gray-200">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className={`px-3 py-1.5 text-sm rounded-md ${
              currentPage === 1
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white border hover:bg-gray-100 text-gray-700"
            }`}
          >
            ← Trước
          </button>

          <span className="text-sm text-gray-600">
            Trang {currentPage} / {totalPages}
          </span>

          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            className={`px-3 py-1.5 text-sm rounded-md ${
              currentPage === totalPages
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white border hover:bg-gray-100 text-gray-700"
            }`}
          >
            Sau →
          </button>
        </div>
      )}

      {/* Popup xác nhận xoá */}
      {confirmId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[360px] text-center">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">
              Xác nhận xoá tài khoản
            </h3>
            <p className="text-sm text-gray-600 mb-5">
              Bạn có chắc chắn muốn xoá tài khoản này không?
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

export default PendingHRTable;
