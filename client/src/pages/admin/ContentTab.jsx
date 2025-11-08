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
    // toLocaleString để khớp ảnh bạn gửi (UTC+00:00 hiển thị hợp lý)
  };

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
            await load(1); // reload về trang 1 để thấy item mới nhất ở đầu
          } catch {
            toast.error("Duyệt thất bại");
          }
        }}
        onReject={async (id) => {
          try {
            await api.rejectJob(id);
            toast.info("Đã từ chối nội dung");
            await load(page);
          } catch {
            toast.error("Từ chối thất bại");
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
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 relative">
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl"
              aria-label="Đóng"
            >
              ×
            </button>

            <h2 className="text-xl font-semibold mb-4 text-primary">
              {selectedJob.title}
            </h2>

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
                  : "-"}{" "}
                VNĐ
              </p>
              <p>
                <strong>Ngày gửi:</strong> {formatCreated(selectedJob)}
              </p>
              <p>
                <strong>Trạng thái:</strong> {selectedJob.status}
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

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Đóng
              </button>
            </div>

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
