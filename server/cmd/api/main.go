package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/generative-ai-go/genai"
	"github.com/joho/godotenv"
	echojwt "github.com/labstack/echo-jwt/v4"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"google.golang.org/api/option"
)

// 📦 Struct for the AI Request
type ChatRequest struct {
	Message  string `json:"message"`
	Context  string `json:"context"`
	ImageUrl string `json:"imageUrl"`
	Lang     string `json:"lang"`
	UserID   string `json:"userId"`
}

func main() {
	godotenv.Load()
	// This looks for a .env file two folders up (in the /server root)
	err := godotenv.Load("../../../.env") 
	if err != nil {
		// Fallback: try to load from current directory if the above fails
		godotenv.Load() 
	}
	apiKey := os.Getenv("GEMINI_API_KEY")
	jwtSecret := os.Getenv("SUPABASE_JWT_SECRET")
	weatherKey := os.Getenv("OPENWEATHER_API_KEY")

	if apiKey == "" || jwtSecret == "" {
		log.Fatal("❌ Missing environment variables! Check your .env file.")
	}

	e := echo.New()

	// 🛠️ Global Middleware
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{"*"},
		AllowHeaders: []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAccept, echo.HeaderAuthorization},
	}))

	// Public Health Check
	e.GET("/health", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{"status": "Active"})
	})

	// 🛡️ The Shield (Protected API Group)
	api := e.Group("/api/v1")
	api.Use(echojwt.WithConfig(echojwt.Config{
		SigningKey: []byte(jwtSecret),
	}))

	// --- Farmer Routes ---
	// Pass both Gemini and Weather keys to the handler
	api.POST("/chat", handleChat(apiKey, weatherKey))

	// --- Admin Tower Routes ---
	api.GET("/admin/stats", HandleAdminStats, AdminMiddleware)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Printf("\n🚀 AgroLingo Engine Live: http://localhost:%s\n", port)
	e.Logger.Fatal(e.Start(":" + port))
}

// 🤖 THE HEART: AI Chat Handler
func handleChat(apiKey string, weatherKey string) echo.HandlerFunc {
	return func(c echo.Context) error {
		var req ChatRequest
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid JSON package"})
		}

		ctx := context.Background()
		client, err := genai.NewClient(ctx, option.WithAPIKey(apiKey))
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "AI Brain offline"})
		}
		defer client.Close()

		model := client.GenerativeModel("gemini-1.5-flash")

		// 🌦️ Get Real Intelligence
		weatherData := getWeatherContext(weatherKey, "11.8491", "9.3392") // Coordinates for Dutse/Kano
		marketData := getMarketContext()

		// 🧠 Build Global Intelligence Prompt
		systemPrompt := fmt.Sprintf(`You are the AgroLingo AI Expert.
User Language: %s.
Current Weather: %s.
Real-Time Market: %s.
User Farm History: %s.

Advice must be specific to Northern Nigeria. If a photo is provided, analyze it for crop disease.`,
			req.Lang, weatherData, marketData, req.Context)

		var parts []genai.Part
		parts = append(parts, genai.Text(systemPrompt))
		parts = append(parts, genai.Text("User: "+req.Message))

		// 📸 Process Image if it exists
		if req.ImageUrl != "" {
			imgResp, err := http.Get(req.ImageUrl)
			if err == nil {
				defer imgResp.Body.Close()
				imgData, _ := io.ReadAll(imgResp.Body)
				parts = append(parts, genai.ImageData("jpeg", imgData))
			}
		}

		// 🚀 Generate Content
		resp, err := model.GenerateContent(ctx, parts...)
		if err != nil {
			return c.JSON(http.StatusBadGateway, map[string]string{"error": "AI Generation failed"})
		}

		aiReply := "Thinking... try again."
		if len(resp.Candidates) > 0 && len(resp.Candidates[0].Content.Parts) > 0 {
			if textPart, ok := resp.Candidates[0].Content.Parts[0].(genai.Text); ok {
				aiReply = string(textPart);
			}
		}

		return c.JSON(http.StatusOK, map[string]string{"reply": aiReply})
	}
}

// 🌦️ REAL WEATHER API
func getWeatherContext(apiKey string, lat string, lon string) string {
	if apiKey == "" {
		return "Weather service key missing."
	}
	url := fmt.Sprintf("https://api.openweathermap.org/data/2.5/weather?lat=%s&lon=%s&appid=%s&units=metric", lat, lon, apiKey)

	resp, err := http.Get(url)
	if err != nil {
		return "Weather currently unavailable."
	}
	defer resp.Body.Close()

	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)

	// Safe navigation of the JSON response
	mainData, ok1 := result["main"].(map[string]interface{})
	weatherArr, ok2 := result["weather"].([]interface{})
	if !ok1 || !ok2 || len(weatherArr) == 0 {
		return "Weather data malformed."
	}

	temp := mainData["temp"]
	weatherObj := weatherArr[0].(map[string]interface{})
	description := weatherObj["description"]

	return fmt.Sprintf("%v°C, %v", temp, description)
}

// 🌾 MARKET CONTEXT
func getMarketContext() string {
	// Simulation: Future update will pull from your Supabase market table
	return "Maize: ₦65k (Up), Millet: ₦72k (Stable), Sorghum: ₦58k (Down)."
}

// 🛡️ ADMIN MIDDLEWARE
func AdminMiddleware(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		userToken, ok := c.Get("user").(*jwt.Token)
		if !ok {
			return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Invalid Token"})
		}
		claims, ok := userToken.Claims.(jwt.MapClaims)
		if !ok {
			return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Invalid Claims"})
		}
		if claims["role"] != "admin" {
			return c.JSON(http.StatusForbidden, map[string]string{"error": "CEO Access Only"})
		}
		return next(c)
	}
}

func HandleAdminStats(c echo.Context) error {
	return c.JSON(http.StatusOK, map[string]interface{}{
		"active_users":  124,
		"engine_status": "Healthy",
	})
}
