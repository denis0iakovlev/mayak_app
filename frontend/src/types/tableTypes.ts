export type ColumnCreaterProps<T> = {
  edits: Record<number, Partial<T>>;
  setCellEdit: (id: number, field: keyof T, value: unknown) => void;
};
