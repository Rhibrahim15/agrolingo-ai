package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/golang-jwt/jwt/v5"
	"github.com/joho/godotenv"
	echojwt "github.com/labstack/echo-jwt/v4"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"

	// ✅ Using the internal handlers package — no duplicate inline handlers
	"github.com/Rhibrahim15/agrolingo-ai/internal/agent"
	"github.com/Rhibrahim15/agrolingo-ai/internal/handlers"
)

func main() {
	// Load .env (try server root first, then current directory)
	if err := godotenv.Load(".env"); err != nil {
		godotenv.Load("../../.env")
	}

	// ── Validate required environment variables ──────────────
	jwtSecret := os.Getenv("SUPABASE_JWT_SECRET")

	if jwtSecret == "" {
		log.Fatal("❌ SUPABASE_JWT_SECRET is not set in .env")
	}

	// ── Initialize AI Agent ──────────────────────────────────
	apiKey := os.Getenv("OPENAI_API_KEY")
	var agnt *agent.Agent
	if apiKey != "" {
		var err error
		agnt, err = agent.NewAgent(context.Background(), apiKey)
		if err == nil && agnt != nil {
			defer agnt.Client.Close()
		}
	} else {
		log.Println("⚠️ OPENAI_API_KEY missing. Backend AI disabled (Frontend uses OpenAI directly).")
	}

	// ── Echo Setup ───────────────────────────────────────────
	e := echo.New()
	e.HideBanner = true

	// Global middleware
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{
			"http://localhost:5173",
			"http://localhost:3000",
			"https://*.vercel.app",
			"https://*.netlify.app",
		},
		AllowMethods: []string{
			http.MethodGet, http.MethodPost,
			http.MethodPut, http.MethodDelete, http.MethodOptions,
		},
		AllowHeaders: []string{
			echo.HeaderOrigin,
			echo.HeaderContentType,
			echo.HeaderAccept,
			echo.HeaderAuthorization,
		},
	}))

	// ── Public Routes (no auth required) ────────────────────
	e.GET("/health", healthCheck)

	// ── Protected Routes (JWT required) ─────────────────────
	api := e.Group("/api/v1")
	api.Use(echojwt.WithConfig(echojwt.Config{
		SigningKey:    []byte(jwtSecret),
		SigningMethod: "HS256",
		ErrorHandler: func(c echo.Context, err error) error {
			return c.JSON(http.StatusUnauthorized, map[string]string{
				"error": "Invalid or expired token. Please log in again.",
			})
		},
	}))

	// ── Farmer Routes ────────────────────────────────────────
	// POST /api/v1/chat — AI agent chat
	if agnt != nil {
		api.POST("/chat", handlers.HandleAgentChat(agnt))
	} else {
		api.POST("/chat", func(c echo.Context) error {
			return c.JSON(http.StatusOK, map[string]interface{}{"reply": "Backend AI disabled. Using frontend OpenAI."})
		})
	}

	// GET /api/v1/weather?lat=11.74&lon=9.33 — weather data
	// ✅ FIX: This route was missing — frontend was calling it but getting 404
	api.GET("/weather", handlers.HandleWeather)

	// ── Admin Routes ─────────────────────────────────────────
	api.GET("/admin/stats", handlers.HandleAdminStats, adminMiddleware)

	// ── Start Server ─────────────────────────────────────────
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Printf("\n🌾 AgroLingo AI Engine v1.0\n")
	fmt.Printf("   Environment : %s\n", getEnv("APP_ENV", "development"))
	fmt.Printf("   Port        : %s\n", port)
	fmt.Printf("   AI Model    : OpenAI GPT-4o\n")
	fmt.Printf("   Status      : Online ✅\n\n")

	e.Logger.Fatal(e.Start(":" + port))
}

// ── Health Check ─────────────────────────────────────────────
func healthCheck(c echo.Context) error {
	return c.JSON(http.StatusOK, map[string]interface{}{
		"status":  "healthy",
		"service": "AgroLingo AI Engine",
		"version": "1.0.0",
	})
}

// ── Admin Middleware ──────────────────────────────────────────
// Only allows users with role="admin" in their JWT app_metadata
func adminMiddleware(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		userToken, ok := c.Get("user").(*jwt.Token)
		if !ok {
			return c.JSON(http.StatusUnauthorized, map[string]string{
				"error": "Authentication required",
			})
		}

		claims, ok := userToken.Claims.(jwt.MapClaims)
		if !ok {
			return c.JSON(http.StatusUnauthorized, map[string]string{
				"error": "Invalid token claims",
			})
		}

		// Supabase stores custom roles in app_metadata
		appMeta, ok := claims["app_metadata"].(map[string]interface{})
		if !ok || appMeta["role"] != "admin" {
			return c.JSON(http.StatusForbidden, map[string]string{
				"error": "Admin access required",
			})
		}

		return next(c)
	}
}

// ── Helper ────────────────────────────────────────────────────
func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}
