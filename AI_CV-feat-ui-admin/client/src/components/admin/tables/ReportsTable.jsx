// src/components/admin/tables/ReportsTable.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Eye, Trash2, CheckCircle } from "lucide-react";

// dùng lại bộ dùng chung
import useSort from "../../shared/useSort";
import usePagination from "../../shared/usePagination";
import Pagination from "../../shared/Pagination";

const StatusPill = ({ status }) => {
  const v = (status || "pending").toLowerCase();
  if (v === "pending") {
    return (
      <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs">
        Chờ duyệt
      </span>
    );
  }
  return (
    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
      Đã xử lý
    </span>
  );
};

const ReportsTable = ({
  rows = [],
  loading,
  onDelete, // (jobId) => void
  onMarkReviewed, // (reportId) => void
  defaultPageSize = 10,
}) => {
  const [selectedReport, setSelectedReport] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  // Chuẩn hoá 1 chút để sort an toàn
  const normalized = useMemo(
    () =>
      (rows || []).map((r) => ({
        ...r,
        _norm: {
          title: r?.title || "",
          company:
            r?.company ||
            r?.companyName ||
            r?.jobId?.companyId?.name ||
            r?.job?.companyId?.name ||
            "",
          reason: r?.reason || "",
          createdMs: r?.createdAt ? new Date(r.createdAt).getTime() : 0,
          status: (r?.status || "pending").toLowerCase(),
          jobId: r?.jobId?._id || r?.jobId || r?.job?._id || "",
        },
      })),
    [rows]
  );

  // --- SORT: mặc định theo ngày báo cáo desc ---
  const { sorted, sort, cycle } = useSort(normalized, {
    key: "createdAt",
    dir: "desc",
    accessor: (r) => r?._norm?.createdMs || 0,
  });

  // --- PAGINATION ---
  const {
    page,
    pages,
    setPage,
    pageItems,
    pageSize,
    setPageSize,
    showingFrom,
    showingTo,
    total,
  } = usePagination(sorted, { pageSize: defaultPageSize });

  // về trang 1 khi dữ liệu đổi
  useEffect(() => {
    setPage(1);
  }, [rows.length, setPage]);

  const SortBtn = ({ label, active, onClick }) => (
    <button
      onClick={() => {
        onClick();
        setPage(1);
      }}
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[12px] border ${
        active ? "bg-blue-600 text-white" : "hover:bg-gray-50"
      }`}
      title="Sắp xếp"
    >
      {label}
      {active ? (sort.dir === "asc" ? "↑" : "↓") : ""}
    </button>
  );

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
        {/* thanh sort + chọn page size */}
        <div className="px-4 py-3 border-b flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-500">Sắp xếp:</span>
          <SortBtn
            label="Ngày báo cáo"
            active={sort?.key === "createdAt"}
            onClick={() => cycle("createdAt", (r) => r?._norm?.createdMs || 0)}
          />
          <SortBtn
            label="Tiêu đề"
            active={sort?.key === "title"}
            onClick={() => cycle("title", (r) => r?._norm?.title || "")}
          />
          <SortBtn
            label="Công ty"
            active={sort?.key === "company"}
            onClick={() => cycle("company", (r) => r?._norm?.company || "")}
          />
          <SortBtn
            label="Lý do"
            active={sort?.key === "reason"}
            onClick={() => cycle("reason", (r) => r?._norm?.reason || "")}
          />
          <SortBtn
            label="Trạng thái"
            active={sort?.key === "status"}
            onClick={() => cycle("status", (r) => r?._norm?.status || "")}
          />

          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-gray-500">Hiển thị:</span>
            <select
              className="text-sm border rounded-md px-2 py-1"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
            >
              {[5, 10, 20, 50].map((n) => (
                <option key={n} value={n}>
                  {n}/trang
                </option>
              ))}
            </select>
          </div>
        </div>

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
            {pageItems.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="text-center py-6 text-gray-500 text-sm"
                >
                  Không có báo cáo nào.
                </td>
              </tr>
            ) : (
              pageItems.map((r) => (
                <tr key={r._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {r.title || "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {r._norm.company || "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {r.reason || "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {r.createdAt
                      ? new Date(r.createdAt).toLocaleDateString("vi-VN")
                      : "—"}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <StatusPill status={r.status} />
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedReport(r)}
                        className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <Eye className="w-4 h-4 mr-1" /> Xem
                      </button>

                      {(r.status || "pending").toLowerCase() === "pending" ? (
                        <button
                          onClick={() =>
                            onMarkReviewed && onMarkReviewed(r._id)
                          }
                          className="inline-flex items-center px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" /> Đánh dấu xử
                          lý
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            setConfirmId(r?._norm?.jobId || r?.jobId)
                          }
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

        {/* Footer phân trang tái sử dụng */}
        <Pagination
          className="border-t"
          page={page}
          pages={pages}
          setPage={setPage}
          showingFrom={showingFrom}
          showingTo={showingTo}
          total={total}
          pageSize={pageSize}
          setPageSize={setPageSize}
          pageSizeOptions={[5, 10, 20, 50]}
        />
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
                <strong>Tiêu đề:</strong> {selectedReport.title || "—"}
              </div>
              <div>
                <strong>Công ty:</strong>{" "}
                {selectedReport._norm?.company || selectedReport.company || "—"}
              </div>
              <div>
                <strong>Lý do:</strong> {selectedReport.reason || "—"}
              </div>
              <div>
                <strong>Mô tả:</strong> {selectedReport.description || "—"}
              </div>
              <div>
                <strong>Ngày báo cáo:</strong>{" "}
                {selectedReport.createdAt
                  ? new Date(selectedReport.createdAt).toLocaleString("vi-VN")
                  : "—"}
              </div>
              <div>
                <strong>Trạng thái:</strong>{" "}
                <span
                  className={`${
                    (selectedReport.status || "pending").toLowerCase() ===
                    "pending"
                      ? "text-yellow-700"
                      : "text-green-700"
                  } font-medium`}
                >
                  {(selectedReport.status || "pending").toLowerCase() ===
                  "pending"
                    ? "Chờ duyệt"
                    : "Đã xử lý"}
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              {(selectedReport.status || "pending").toLowerCase() ===
                "pending" && (
                <button
                  onClick={() => {
                    onMarkReviewed && onMarkReviewed(selectedReport._id);
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

      {/* Popup xác nhận gỡ bài đăng */}
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
                  onDelete && onDelete(confirmId);
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
