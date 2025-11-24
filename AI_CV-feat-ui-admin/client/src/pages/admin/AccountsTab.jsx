// src/pages/admin/AccountsTab.jsx
import React, { useEffect, useState } from "react";
import PendingHRTable from "../../components/admin/tables/PendingHRTable";
import SectionHeader from "../../components/admin/SectionHeader";

const AccountsTab = ({ api }) => {
  const [rows, setRows] = useState([]);

  const load = async () => {
    const { data } = await api.getHRPending();
    // server bạn trả: { success, data, count }
    setRows(data?.data || data?.list || []);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <section className="space-y-6">
      <SectionHeader
        title="Tài khoản HR chờ duyệt"
        desc="Duyệt hoặc từ chối tài khoản HR đăng ký mới"
      />
      <PendingHRTable
        rows={rows}
        onApprove={async (id) => {
          await api.approveHR(id);
          await load();
        }}
        onReject={async (id) => {
          await api.rejectHR(id);
          await load();
        }}
        onDelete={async (id) => {
          await api.deleteHR(id);
          setRows((prev) => prev.filter((r) => r._id !== id));
        }}
      />
    </section>
  );
};

export default AccountsTab;
