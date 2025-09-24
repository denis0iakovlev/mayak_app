from contextvars import ContextVar
req_id_var = ContextVar("req_id", default="-")
chat_id_var = ContextVar("chat_id", default="-")
user_id_var = ContextVar("user_id", default="-")
