import axios, { AxiosError } from "axios";

type ApiErrorResponse = { detail?: unknown };

const API_URL = process.env.NEXT_PUBLIC_API_URL;
if (API_URL === undefined) {
  throw new Error(`Api not defined in environment`);
}

const apiSrv = axios.create({
  baseURL: API_URL,
  timeout: 100000,
  headers: {
    "Content-Type": "application/json",
  },
});
apiSrv.interceptors.response.use(
  (r) => r,
  (error: AxiosError<ApiErrorResponse>) => {
    const detail = error.response?.data?.detail;

    const message =
      typeof detail === "string"
        ? detail
        : detail != null
        ? JSON.stringify(detail)
        : error.request
        ? "Сервер не отвечает. Проверьте соединение."
        : error.message || "Ошибка запроса";

    // Важно: сохраняем AxiosError, но улучшаем message
    error.message = message;

    return Promise.reject(error);
  }
);
export default apiSrv;
