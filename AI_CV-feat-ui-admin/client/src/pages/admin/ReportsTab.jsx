import React, { useEffect, useState } from "react";
import SectionHeader from "../../components/admin/SectionHeader";
import ReportsTable from "../../components/admin/tables/ReportsTable";
import { toast } from "react-toastify";

const ReportsTab = ({ api }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const { data } = await api.getReports();
      if (data?.success) {
        setRows(data.data || []);
      } else {
        setRows(data?.list || []);
      }
    } catch (err) {
      toast.error("Không thể tải danh sách báo cáo");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async (jobId) => {
    try {
      const { data } = await api.deleteJob(jobId);
      if (data?.success) {
        toast.success("Đã gỡ bỏ tin vi phạm");
        fetchReports();
      } else {
        toast.error(data?.message || "Không thể gỡ bỏ");
      }
    } catch (err) {
      toast.error("Lỗi khi gỡ bỏ bài đăng");
    }
  };

  const handleMarkReviewed = async (reportId) => {
    try {
      const { data } = await api.markReportReviewed(reportId);
      if (data?.success) {
        toast.success("Đã đánh dấu đã xử lý");
        fetchReports();
      } else {
        toast.error(data?.message);
      }
    } catch (err) {
      toast.error("Lỗi khi cập nhật trạng thái");
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return (
    <section className="space-y-6">
      <SectionHeader
        title="Báo cáo vi phạm"
        desc="Tin tuyển dụng bị người dùng báo cáo vi phạm"
      />
      <ReportsTable
        rows={rows}
        loading={loading}
        onDelete={handleDeleteJob}
        onMarkReviewed={handleMarkReviewed}
      />
    </section>
  );
};

export default ReportsTab;
