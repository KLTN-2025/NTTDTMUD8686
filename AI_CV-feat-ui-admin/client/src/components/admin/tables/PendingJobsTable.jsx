// src/components/admin/tables/PendingJobsTable.jsx
import React, { useEffect, useState } from "react";
import { CheckCircle, XCircle, Eye, Trash2 } from "lucide-react";
import Badge from "../Badge";

// dùng lại bộ dùng chung
import useSort from "../../shared/useSort";
import usePagination from "../../shared/usePagination";
import Pagination from "../../shared/Pagination";

const StatusCell = ({ status }) => {
  const v = (status || "pending").toLowerCase();
  if (v === "approved") return <Badge text="Đã duyệt" color="green" />;
  if (v === "rejected") return <Badge text="Từ chối" color="red" />;
  return <Badge text="Chờ duyệt" color="yellow" />;
};

const PendingJobsTable = ({
  rows = [],
  onApprove,
  onReject,
  onView,
  onDelete,
  defaultPageSize = 10,
}) => {
  const [confirmId, setConfirmId] = useState(null);

  // --- SORT: mặc định theo createdAt desc ---
  const { sorted, sort, cycle } = useSort(rows, {
    key: "createdAt",
    dir: "desc",
    accessor: (r) => (r?.createdAt ? new Date(r.createdAt).getTime() : 0),
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

  // về trang 1 khi dữ liệu đổi để tránh rỗng trang
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

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
      {/* thanh sort + chọn page size */}
      <div className="px-4 py-3 border-b flex flex-wrap items-center gap-2">
        <span className="text-xs text-gray-500">Sắp xếp:</span>
        <SortBtn
          label="Ngày gửi"
          active={sort?.key === "createdAt"}
          onClick={() =>
            cycle("createdAt", (r) =>
              r?.createdAt ? new Date(r.createdAt).getTime() : 0
            )
          }
        />
        <SortBtn
          label="Tiêu đề"
          active={sort?.key === "title"}
          onClick={() => cycle("title", (r) => r?.title || "")}
        />
        <SortBtn
          label="Công ty"
          active={sort?.key === "company"}
          onClick={() => cycle("company", (r) => r?.companyId?.name || "")}
        />
        <SortBtn
          label="Trạng thái"
          active={sort?.key === "status"}
          onClick={() => cycle("status", (r) => r?.status || "")}
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
          {pageItems.length === 0 ? (
            <tr>
              <td
                colSpan={5}
                className="px-6 py-8 text-center text-gray-500 text-sm"
              >
                Không có tin chờ duyệt
              </td>
            </tr>
          ) : (
            pageItems.map((job) => (
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
                    ? new Date(job.createdAt).toLocaleDateString("vi-VN")
                    : "-"}
                </td>

                <td className="px-6 py-4">
                  <StatusCell status={job.status} />
                </td>

                <td className="px-6 py-4 text-sm">
                  {(job.status || "pending").toLowerCase() === "pending" ? (
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => onApprove && onApprove(job._id)}
                        className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" /> Duyệt
                      </button>
                      <button
                        onClick={() => onReject && onReject(job._id)}
                        className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        <XCircle className="w-4 h-4 mr-1" /> Từ chối
                      </button>
                      <button
                        onClick={() => onView && onView(job._id)}
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
                  onDelete && onDelete(confirmId);
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
