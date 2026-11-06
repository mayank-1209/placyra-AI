import time
from collections import defaultdict
from threading import Lock
from typing import Callable, Dict, List
from fastapi import Request, Response, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    In-memory sliding window rate limiter per client IP.
    Protects authentication endpoints from brute-force and API abuse.
    """

    def __init__(
        self,
        app,
        auth_limit: int = 20,       # 20 auth attempts / min
        general_limit: int = 150,   # 150 requests / min
        window_seconds: int = 60,
    ):
        super().__init__(app)
        self.auth_limit = auth_limit
        self.general_limit = general_limit
        self.window_seconds = window_seconds
        self.ip_records: Dict[str, List[float]] = defaultdict(list)
        self.lock = Lock()

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Bypass rate limiting for documentation and healthchecks
        path = request.url.path
        if path in ("/health", "/api/v1/health", "/docs", "/openapi.json", "/redoc"):
            return await call_next(request)

        # Identify client IP
        client_ip = request.client.host if request.client else "127.0.0.1"
        now = time.time()
        is_auth_route = "/auth/login" in path or "/auth/register" in path
        limit = self.auth_limit if is_auth_route else self.general_limit

        with self.lock:
            # Purge entries older than the window
            timestamps = self.ip_records[client_ip]
            cutoff = now - self.window_seconds
            self.ip_records[client_ip] = [ts for ts in timestamps if ts > cutoff]

            if len(self.ip_records[client_ip]) >= limit:
                return JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content={
                        "detail": "Rate limit exceeded. Too many requests. Please slow down.",
                        "retry_after_seconds": int(self.window_seconds),
                    },
                    headers={"Retry-After": str(self.window_seconds)},
                )

            self.ip_records[client_ip].append(now)

        response = await call_next(request)
        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Applies enterprise security headers across all HTTP responses.
    Defends against Clickjacking, MIME sniffing, and cross-site scripting.
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)

        # Apply Hardened Security Headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        return response
