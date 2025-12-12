"use client";
import { buildDiff } from "@/utils/diff";
import { useMemo, useState } from "react";

export type EditMap<T> = Record<number | string, Partial<T>>;

export function useEditController<T extends Record<string, any>>(
  data: T[],
  idKey: keyof T = "id" as keyof T
) {
  const [edits, setEdits] = useState<EditMap<T>>({});

  const setCellEdit = <K extends keyof T>(
    rowId: T[typeof idKey],
    field: K,
    value: T[K]
  ) => {
    setEdits((prev) => ({
      ...prev,
      [rowId as any]: { ...prev[rowId as any], [field]: value },
    }));
  };

  const resetRow = (rowId: T[typeof idKey]) => {
    setEdits((prev) => ({
      ...prev,
      [rowId as any]: {},
    }));
  };
  const resetAll = () => setEdits({});

  const payload = useMemo(
    () => buildDiff<T>(data, edits, idKey),
    [data, edits, idKey]
  );

  const hasChange = payload.length > 0;

  return { edits, setCellEdit, resetRow, resetAll, payload, hasChange };
}
