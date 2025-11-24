// src/components/admin/tables/PendingHRTable.jsx
import React, { useEffect, useState } from "react";
import { CheckCircle, XCircle, Trash2 } from "lucide-react";

import useSort from "../../shared/useSort";
import usePagination from "../../shared/usePagination";
import Pagination from "../../shared/Pagination";

const StatusBadge = ({ value }) => {
  const v = (value || "").toLowerCase();
  if (v === "approved") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Đã duyệt
      </span>
    );
  }
  if (v === "rejected") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        Từ chối
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
      Chờ duyệt
    </span>
  );
};

const PendingHRTable = ({
  rows = [],
  onApprove,
  onReject,
  onDelete,
  // tuỳ chọn: override page size mặc định
  defaultPageSize = 10,
}) => {
  const [confirmId, setConfirmId] = useState(null);

  // --- SORT (mặc định theo createdAt desc) ---
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

  // Khi dữ liệu đổi, luôn đưa về trang 1 để tránh “rỗng trang”
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
    <div className="relative">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
        {/* Thanh sort nhanh */}
        <div className="px-4 py-3 border-b flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-500">Sắp xếp:</span>
          <SortBtn
            label="Ngày đăng ký"
            active={sort?.key === "createdAt"}
            onClick={() =>
              cycle("createdAt", (r) =>
                r?.createdAt ? new Date(r.createdAt).getTime() : 0
              )
            }
          />
          <SortBtn
            label="Tên"
            active={sort?.key === "name"}
            onClick={() => cycle("name", (r) => r?.name || "")}
          />
          <SortBtn
            label="Email"
            active={sort?.key === "email"}
            onClick={() => cycle("email", (r) => r?.email || "")}
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
            {pageItems.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-8 text-center text-gray-500 text-sm"
                >
                  Không có HR nào
                </td>
              </tr>
            ) : (
              pageItems.map((hr) => (
                <tr key={hr._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {hr.name || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {hr.email || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {hr.createdAt
                      ? new Date(hr.createdAt).toLocaleDateString("vi-VN")
                      : "-"}
                  </td>

                  <td className="px-6 py-4">
                    <StatusBadge value={hr.status} />
                  </td>

                  <td className="px-6 py-4 text-sm">
                    {(hr.status || "pending").toLowerCase() === "pending" ? (
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => onApprove && onApprove(hr._id)}
                          className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" /> Duyệt
                        </button>
                        <button
                          onClick={() => onReject && onReject(hr._id)}
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

        {/* Footer phân trang */}
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

export default PendingHRTable;
