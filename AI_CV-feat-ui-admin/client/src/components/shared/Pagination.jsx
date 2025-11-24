import React from "react";

const Btn = ({ disabled, children, ...rest }) => (
  <button
    disabled={disabled}
    className={`px-3 py-1.5 rounded-md border text-sm ${
      disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"
    }`}
    {...rest}
  >
    {children}
  </button>
);

export default function Pagination({
  page,
  pages,
  setPage,
  showingFrom,
  showingTo,
  total,
  pageSize,
  setPageSize,
  pageSizeOptions = [6, 8, 10, 12, 20, 50],
  className = "",
}) {
  if (pages <= 1 && total <= pageSize) return null;

  const nums = [];
  const from = Math.max(1, page - 2);
  const to = Math.min(pages, page + 2);
  if (from > 1) nums.push(1, "…");
  for (let i = from; i <= to; i++) nums.push(i);
  if (to < pages) nums.push("…", pages);

  return (
    <div
      className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-3 ${className}`}
    >
      <div className="text-sm text-gray-500">
        Showing{" "}
        <span className="font-medium text-gray-700">
          {showingFrom}-{showingTo}
        </span>{" "}
        of <span className="font-medium text-gray-700">{total}</span>
      </div>

      <div className="flex items-center gap-3">
        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            setPage(1);
          }}
          className="border rounded-md px-2 py-1 text-sm"
          aria-label="Page size"
        >
          {pageSizeOptions.map((o) => (
            <option key={o} value={o}>
              {o} / page
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1">
          <Btn disabled={page === 1} onClick={() => setPage(1)}>
            «
          </Btn>
          <Btn disabled={page === 1} onClick={() => setPage(page - 1)}>
            ‹
          </Btn>
          {nums.map((n, i) =>
            n === "…" ? (
              <span key={`d${i}`} className="px-2 text-gray-400">
                …
              </span>
            ) : (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`px-3 py-1.5 rounded-md text-sm ${
                  n === page
                    ? "bg-blue-600 text-white"
                    : "border hover:bg-gray-50"
                }`}
              >
                {n}
              </button>
            )
          )}
          <Btn disabled={page === pages} onClick={() => setPage(page + 1)}>
            ›
          </Btn>
          <Btn disabled={page === pages} onClick={() => setPage(pages)}>
            »
          </Btn>
        </div>
      </div>
    </div>
  );
}
