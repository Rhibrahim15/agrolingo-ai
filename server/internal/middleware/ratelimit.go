package middleware

import (
	"net/http"
	"strconv"
	"sync"
	"time"

	"github.com/Rhibrahim15/agrolingo-ai/server/internal/auth"
	"github.com/labstack/echo/v4"
)

type rateWindow struct {
	started time.Time
	count   int
}

type UserRateLimiter struct {
	mu      sync.Mutex
	windows map[string]rateWindow
	limit   int
	window  time.Duration
}

func NewUserRateLimiter(limit int, window time.Duration) *UserRateLimiter {
	return &UserRateLimiter{
		windows: make(map[string]rateWindow),
		limit:   limit,
		window:  window,
	}
}

func (l *UserRateLimiter) Middleware(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		user, ok := auth.UserFromContext(c)
		if !ok {
			return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Authentication required."})
		}

		now := time.Now()
		l.mu.Lock()
		entry, exists := l.windows[user.ID]
		if !exists || now.Sub(entry.started) >= l.window {
			entry = rateWindow{started: now}
		}
		if entry.count >= l.limit {
			retryAfter := int(l.window.Seconds() - now.Sub(entry.started).Seconds())
			if retryAfter < 1 {
				retryAfter = 1
			}
			l.mu.Unlock()
			c.Response().Header().Set("Retry-After", strconv.Itoa(retryAfter))
			return c.JSON(http.StatusTooManyRequests, map[string]string{"error": "Request limit reached. Please wait and try again."})
		}
		entry.count++
		l.windows[user.ID] = entry
		l.mu.Unlock()

		return next(c)
	}
}
