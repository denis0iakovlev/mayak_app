export function toTime(timestamp: number) {
  const hour = Math.trunc(timestamp);
  const minutes = (timestamp - hour) * 60;
  return `${String(hour).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export const minutesToTime = (timestampInMinutes: number) =>
  `${String(Math.floor(timestampInMinutes / 60)).padStart(2, "0")}:${String(
    timestampInMinutes % 60
  ).padStart(2, "0")}`;
