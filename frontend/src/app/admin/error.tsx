"use client";

import CriticalError from "@/components/Error/CriticalError";

export default function IndexError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <CriticalError
      headerText="Упс, что-то пошло не так..."
      errorMessage={error.message}
    />
  );
}
