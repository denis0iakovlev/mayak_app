import axios from "axios";
import { ZodError } from "zod";

export function getAppErrorMessage(error: unknown): string {
  if (error instanceof ZodError) {
    const i = error.issues[0];
    const path = i?.path?.length ? i.path.join(".") : "root";
    return i ? `${path}: ${i.message}` : "Некорректные данные";
  }

  if (axios.isAxiosError(error)) {
    // после interceptor тут уже будет error.message нормальный
    return error.message || "Ошибка запроса";
  }

  if (error instanceof Error) return error.message;
  return "Неизвестная ошибка";
}
