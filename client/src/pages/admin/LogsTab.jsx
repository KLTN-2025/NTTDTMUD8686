import React, { useEffect, useState } from "react";
import SectionHeader from "../../components/admin/SectionHeader";
import LogsList from "../../components/admin/tables/LogsList";

const LogsTab = ({ api }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const { data } = await api.getLogs();
      // Hỗ trợ nhiều kiểu shape response
      const fromItems =
        data?.items || data?.data?.items || data?.data || data?.list || [];
      setRows(Array.isArray(fromItems) ? fromItems : []);
    } catch (e) {
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <section className="space-y-6">
      <SectionHeader
        title="Nhật ký hoạt động"
        desc="Theo dõi tất cả hoạt động trên hệ thống"
      />
      <LogsList rows={rows} loading={loading} />
    </section>
  );
};

export default LogsTab;
