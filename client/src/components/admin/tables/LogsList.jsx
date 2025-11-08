import React from "react";
import {
  Activity,
  CheckCircle,
  XCircle,
  LogIn,
  ShieldCheck,
  Trash2,
  FileWarning,
  UserCheck,
  UserX,
  FileText,
} from "lucide-react";

/**
 * Map action -> nhóm hiển thị + icon + màu
 * action mẫu từ BE:
 *  - user.login / company.login / admin.login
 *  - report.submitted
 *  - job.approved / job.rejected / job.deleted
 *  - company.registered / company.approved / company.rejected / company.deleted
 *  - application.submitted
 */
function classify(log) {
  const a = (log?.action || "").toLowerCase();

  if (a.includes("login")) {
    return {
      type: "login",
      Icon: LogIn,
      wrap: "bg-blue-100",
      icon: "text-blue-600",
    };
  }
  if (a.startsWith("report.")) {
    return {
      type: "report",
      Icon: FileWarning,
      wrap: "bg-amber-100",
      icon: "text-amber-600",
    };
  }
  if (a.startsWith("application.")) {
    return {
      type: "application",
      Icon: FileText,
      wrap: "bg-indigo-100",
      icon: "text-indigo-600",
    };
  }
  if (a.startsWith("job.approved") || a.startsWith("company.approved")) {
    return {
      type: "approval",
      Icon: CheckCircle,
      wrap: "bg-green-100",
      icon: "text-green-600",
    };
  }
  if (a.startsWith("job.rejected") || a.startsWith("company.rejected")) {
    return {
      type: "rejection",
      Icon: XCircle,
      wrap: "bg-red-100",
      icon: "text-red-600",
    };
  }
  if (a.startsWith("job.deleted") || a.startsWith("company.deleted")) {
    return {
      type: "deleted",
      Icon: Trash2,
      wrap: "bg-rose-100",
      icon: "text-rose-600",
    };
  }
  if (a.startsWith("company.registered")) {
    return {
      type: "register",
      Icon: ShieldCheck,
      wrap: "bg-slate-100",
      icon: "text-slate-600",
    };
  }

  return {
    type: "other",
    Icon: Activity,
    wrap: "bg-gray-100",
    icon: "text-gray-600",
  };
}

const Line = ({ log }) => {
  const { Icon, wrap, icon } = classify(log);
  const time = log?.createdAt
    ? new Date(log.createdAt).toLocaleString()
    : log?.time || "";

  // Ưu tiên hiển thị message; fallback action
  const title = log?.message || log?.action || "—";

  // Người thực hiện
  const actor =
    log?.actorName ||
    log?.user ||
    (log?.actorType
      ? `${log.actorType}${log.actorId ? ` (#${log.actorId})` : ""}`
      : "—");

  // Mục tiêu (nếu có)
  const target =
    log?.targetName ||
    (log?.targetType
      ? `${log.targetType}${log?.targetId ? ` (#${log.targetId})` : ""}`
      : "");

  return (
    <div className="p-6 hover:bg-gray-50">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className={`p-2 rounded-lg ${wrap}`}>
            <Icon className={`w-5 h-5 ${icon}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{title}</p>
            <div className="mt-1 text-sm text-gray-600 space-y-0.5">
              <p>
                <span className="text-gray-500">Thực hiện bởi:</span> {actor}
              </p>
              {target ? (
                <p>
                  <span className="text-gray-500">Đối tượng:</span> {target}
                </p>
              ) : null}
              {/* Hiển thị meta nếu có (vd: reason, status …) */}
              {log?.meta && typeof log.meta === "object" && (
                <div className="text-xs text-gray-500 mt-1">
                  {Object.entries(log.meta).map(([k, v]) => (
                    <div key={k}>
                      <span className="font-medium">{k}:</span> {String(v)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <span className="text-sm text-gray-500 whitespace-nowrap">{time}</span>
      </div>
    </div>
  );
};

const LogsList = ({ rows = [], loading }) => {
  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">Đang tải nhật ký...</div>
    );
  }

  if (!rows.length) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-10 text-center text-gray-500">
        Chưa có hoạt động nào.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-200">
      {rows.map((log) => (
        <Line key={log._id || `${log.action}-${log.createdAt}`} log={log} />
      ))}
    </div>
  );
};

export default LogsList;
