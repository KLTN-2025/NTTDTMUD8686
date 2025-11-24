// src/pages/admin/ContentTab.jsx
import React, { useEffect, useState } from "react";
import SectionHeader from "../../components/admin/SectionHeader";
import PendingJobsTable from "../../components/admin/tables/PendingJobsTable";
import { toast } from "react-toastify";

const ContentTab = ({ api }) => {
  const [rows, setRows] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loadingView, setLoadingView] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.getJobsPending();
      setRows(data?.data || []);
    } catch {
      toast.error("Không thể tải danh sách tin chờ duyệt");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleView = async (id) => {
    try {
      setLoadingView(true);
      const { data } = await api.getJobDetail(id);
      const job = data?.data || data?.job || null;
      if (!job) return toast.error("Không tìm thấy nội dung tin");
      setSelectedJob(job);
    } catch {
      toast.error("Không thể tải nội dung job");
    } finally {
      setLoadingView(false);
    }
  };

  const handleClose = () => setSelectedJob(null);

  const formatCreated = (job) => {
    const raw = job?.createdAt || job?.date;
    if (!raw) return "-";
    const d = typeof raw === "number" ? new Date(raw) : new Date(String(raw));
    return isNaN(d.getTime()) ? "-" : d.toLocaleString();
  };

  // Khóa scroll trang khi mở modal + đóng bằng phím Esc
  useEffect(() => {
    if (!selectedJob) return;

    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    const onKey = (e) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [selectedJob]);

  return (
    <section className="space-y-6">
      <SectionHeader
        title="Tin tuyển dụng chờ duyệt"
        desc="Duyệt hoặc từ chối tin tuyển dụng do HR gửi lên"
      />

      <PendingJobsTable
        rows={rows}
        onView={handleView}
        onApprove={async (id) => {
          try {
            await api.approveJob(id);
            toast.success("Đã duyệt nội dung");
            await load(1);
          } catch {
            toast.error("Duyệt thất bại");
          }
        }}
        onReject={async (id) => {
          try {
            await api.rejectJob(id);
          } catch (e) {
            toast.error("Từ chối thất bại");
            return;
          }

          try {
            await load(1);
            toast.success("Đã từ chối nội dung");
          } catch (e) {
            toast.warning("Đã từ chối, nhưng tải lại danh sách thất bại");
          }
        }}
        onDelete={async (id) => {
          const { data } = await api.deleteJob(id);
          if (data.success) {
            toast.success("Đã xoá bài đăng");
            await load();
          } else {
            toast.error(data.message);
          }
        }}
      />

      {/* Popup xem chi tiết job */}
      {selectedJob && (
        <div
          className="fixed inset-0 z-50 grid place-items-center"
          role="dialog"
          aria-modal="true"
          onClick={handleClose} // click nền để đóng
        >
          {/* Nền mờ nhẹ + blur xíu */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />

          {/* Hộp modal: flex-col để chỉ phần nội dung scroll được */}
          <div
            className="relative bg-white w-full max-w-2xl rounded-lg shadow-2xl flex flex-col"
            style={{ maxHeight: "84vh" }}
            onClick={(e) => e.stopPropagation()} // chặn click xuyên
          >
            {/* Header (cố định trên) */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-xl font-semibold text-primary">
                {selectedJob.title}
              </h2>
              <button
                onClick={handleClose}
                className="text-2xl leading-none text-gray-400 hover:text-gray-600"
                aria-label="Đóng"
              >
                ×
              </button>
            </div>

            {/* Nội dung (scroll bên trong) */}
            <div className="px-6 py-4 overflow-y-auto flex-1">
              <div className="space-y-2 text-gray-700">
                <p>
                  <strong>Vị trí:</strong> {selectedJob.category || "-"}
                </p>
                <p>
                  <strong>Cấp độ:</strong> {selectedJob.level || "-"}
                </p>
                <p>
                  <strong>Địa điểm:</strong> {selectedJob.location || "-"}
                </p>
                <p>
                  <strong>Lương:</strong>{" "}
                  {typeof selectedJob.salary === "number"
                    ? selectedJob.salary.toLocaleString()
                    : selectedJob.salary || "-"}{" "}
                  VNĐ
                </p>
                <p>
                  <strong>Ngày gửi:</strong> {formatCreated(selectedJob)}
                </p>
                <p>
                  <strong>Trạng thái:</strong> {selectedJob.status || "-"}
                </p>
              </div>

              <div className="mt-4 border-t pt-3">
                <h3 className="text-lg font-medium mb-1 text-gray-800">
                  Mô tả công việc
                </h3>
                <div
                  className="prose max-w-none text-gray-700"
                  dangerouslySetInnerHTML={{
                    __html: selectedJob.description || "<p>-</p>",
                  }}
                />
              </div>
            </div>

            {/* Footer (cố định dưới) */}
            <div className="flex justify-end gap-3 px-6 py-3 border-t">
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Đóng
              </button>
            </div>

            {/* Loading overlay trong modal */}
            {loadingView && (
              <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] rounded-lg flex items-center justify-center">
                <div className="animate-spin h-6 w-6 border-2 border-gray-300 border-t-transparent rounded-full" />
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default ContentTab;
