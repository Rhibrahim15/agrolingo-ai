package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/Rhibrahim15/agrolingo-ai/server/internal/auth"
	"github.com/Rhibrahim15/agrolingo-ai/server/internal/handlers"
	agromiddleware "github.com/Rhibrahim15/agrolingo-ai/server/internal/middleware"
	"github.com/joho/godotenv"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func main() {
	_ = godotenv.Load()

	geminiKey := requiredEnvironment("GEMINI_API_KEY")
	supabaseURL := requiredEnvironment("SUPABASE_URL")
	supabaseAnonKey := requiredEnvironment("SUPABASE_ANON_KEY")
	model := environment("GEMINI_MODEL", "gemini-2.5-flash")
	port := environment("PORT", "8080")

	e := echo.New()
	e.HideBanner = true
	e.HidePort = true
	e.Use(middleware.RequestID())
	e.Use(middleware.Secure())
	e.Use(middleware.Recover())
	e.Use(middleware.BodyLimit("6M"))
	e.Use(middleware.LoggerWithConfig(middleware.LoggerConfig{
		Format: `${time_rfc3339} request_id=${id} method=${method} uri=${uri} status=${status} latency=${latency_human}` + "\n",
	}))
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: allowedOrigins(),
		AllowMethods: []string{http.MethodGet, http.MethodPost, http.MethodOptions},
		AllowHeaders: []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAccept, echo.HeaderAuthorization, echo.HeaderXRequestID},
		MaxAge:       3600,
	}))

	e.GET("/health", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{
			"status":  "healthy",
			"service": "agrolingo-api",
		})
	})

	verifier := auth.NewVerifier(supabaseURL, supabaseAnonKey)
	rateLimiter := agromiddleware.NewUserRateLimiter(15, 10*time.Minute)
	chatHandler := handlers.NewChatHandler(geminiKey, model)

	api := e.Group("/api/v1")
	api.Use(verifier.Middleware)
	api.POST("/chat", chatHandler.Handle, rateLimiter.Middleware)

	go func() {
		log.Printf("agrolingo-api starting port=%s environment=%s", port, environment("APP_ENV", "development"))
		if err := e.Start(":" + port); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("server failed: %v", err)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)
	<-stop

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := e.Shutdown(ctx); err != nil {
		log.Printf("graceful shutdown failed: %v", err)
	}
}

func requiredEnvironment(name string) string {
	value := strings.TrimSpace(os.Getenv(name))
	if value == "" {
		log.Fatalf("required environment variable %s is not set", name)
	}
	return value
}

func environment(name, fallback string) string {
	if value := strings.TrimSpace(os.Getenv(name)); value != "" {
		return value
	}
	return fallback
}

func allowedOrigins() []string {
	configured := strings.TrimSpace(os.Getenv("ALLOWED_ORIGINS"))
	if configured == "" {
		return []string{"http://localhost:5173", "https://agrolingo.vercel.app"}
	}
	var origins []string
	for _, origin := range strings.Split(configured, ",") {
		if trimmed := strings.TrimSpace(origin); trimmed != "" {
			origins = append(origins, trimmed)
		}
	}
	return origins
}
