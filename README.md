# mayak_app
Web app for sheduling time on tennis court

## Backend API

The backend is built with [FastAPI](https://fastapi.tiangolo.com/). To start the server run:

```bash
uvicorn backend.server:app --reload
```

Available endpoints:
- `GET /occupied?date=YYYY-MM-DD` – returns bookings for the provided date.
