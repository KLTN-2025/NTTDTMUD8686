import { useMemo, useState } from "react";

const get = (o, p) => p.split(".").reduce((a, k) => (a ? a[k] : undefined), o);
const toVal = (row, accessor) =>
  typeof accessor === "function" ? accessor(row) : get(row, accessor || "");

export default function useSort(items = [], initial = null) {
  // initial = { key: 'title', dir: 'asc', accessor?: (row)=>any }
  const [sort, setSort] = useState(initial); // null => no sort

  const sorted = useMemo(() => {
    if (!sort?.key || !sort?.dir) return items;
    const acc = (r) => toVal(r, sort.accessor || sort.key);
    const mapped = items.map((r, i) => ({ r, i, v: acc(r) ?? "" }));
    mapped.sort((a, b) => {
      const A = a.v,
        B = b.v;
      let cmp =
        typeof A === "number" && typeof B === "number"
          ? A - B
          : String(A).localeCompare(String(B), undefined, {
              numeric: true,
              sensitivity: "base",
            });
      if (sort.dir === "desc") cmp = -cmp;
      return cmp || a.i - b.i;
    });
    return mapped.map((m) => m.r);
  }, [items, sort]);

  // tiện click header: asc -> desc -> none
  const cycle = (key, accessor) =>
    setSort((s) => {
      if (!s || s.key !== key) return { key, dir: "asc", accessor };
      if (s.dir === "asc") return { key, dir: "desc", accessor: s.accessor };
      return null; // tắt sort
    });

  return { sorted, sort, setSort, cycle };
}
