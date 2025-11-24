import { useMemo, useState } from "react";

export function paginate(total, page, pageSize) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const p = Math.min(Math.max(1, page), pages);
  const start = (p - 1) * pageSize;
  const end = Math.min(total, start + pageSize);
  return { pages, page: p, start, end };
}

export default function usePagination(
  items = [],
  { pageSize = 10, initialPage = 1 } = {}
) {
  const [page, setPage] = useState(initialPage);
  const [size, setSize] = useState(pageSize);

  const { pages, start, end } = useMemo(
    () => paginate(items.length, page, size),
    [items.length, page, size]
  );

  const pageItems = useMemo(() => items.slice(start, end), [items, start, end]);

  // Nếu dữ liệu thay đổi làm số trang ít hơn trang hiện tại → đưa về trang cuối
  if (page > pages) Promise.resolve().then(() => setPage(pages));

  return {
    pageItems,
    page,
    pages,
    pageSize: size,
    setPage,
    setPageSize: setSize,
    showingFrom: start + 1,
    showingTo: end,
    total: items.length,
  };
}
