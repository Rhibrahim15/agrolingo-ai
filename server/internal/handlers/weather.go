package handlers

import (
	"fmt"
	"io"
	"net/http"

	"github.com/labstack/echo/v4"
)

// HandleWeather godoc
// GET /api/v1/weather?lat=11.74&lon=9.33
// Returns weather data for a given coordinate
func HandleWeather(c echo.Context) error {
	lat := c.QueryParam("lat")
	lon := c.QueryParam("lon")

	// Default to Dutse, Jigawa if no coordinates given
	if lat == "" {
		lat = "11.7399"
	}
	if lon == "" {
		lon = "9.3199"
	}

	// Validate coordinates are numeric-ish
	if len(lat) > 20 || len(lon) > 20 {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Invalid coordinates",
		})
	}

	// Fetch from Open-Meteo (free, no API key needed)
	result := GetWeatherAnalysis(lat, lon)
	if result == "" {
		return c.JSON(http.StatusServiceUnavailable, map[string]string{
			"error": "Weather service temporarily unavailable",
		})
	}

	return c.JSON(http.StatusOK, map[string]string{
		"data": result,
	})
}

// GetWeatherAnalysis fetches real-time weather data from Open-Meteo
func GetWeatherAnalysis(lat, lon string) string {
	url := fmt.Sprintf("https://api.open-meteo.com/v1/forecast?latitude=%s&longitude=%s&current_weather=true", lat, lon)
	resp, err := http.Get(url)
	if err != nil {
		return ""
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return ""
	}

	return string(body)
}

// HandleAdminStats godoc
// GET /api/v1/admin/stats
// Returns system statistics — admin JWT role required
func HandleAdminStats(c echo.Context) error {
	return c.JSON(http.StatusOK, map[string]interface{}{
		"active_users":  0, // TODO: query from DB
		"total_queries": 0, // TODO: query from DB
		"error_count":   0,
		"engine_status": "healthy",
		"ai_model":      "gemini-1.5-flash",
		"message": fmt.Sprintf("AgroLingo Engine is running"),
	})
}
