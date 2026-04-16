package tools

import (
	"encoding/json"
	"fmt"
	"net/http"
)

type WeatherData struct {
	Current struct {
		Temperature float64 `json:"temperature_2m"`
		Rain        float64 `json:"rain"`
		WindSpeed   float64 `json:"wind_speed_10m"`
	} `json:"current"`
}

// GetWeatherAnalysis fetches data for a specific LGA
func GetWeatherAnalysis(lat, lon string) string {
	// Open-Meteo API URL
	url := fmt.Sprintf("https://api.open-meteo.com/v1/forecast?latitude=%s&longitude=%s&current=temperature_2m,rain,wind_speed_10m", lat, lon)

	resp, err := http.Get(url)
	if err != nil {
		return "Unable to fetch weather data right now."
	}
	defer resp.Body.Close()

	var data WeatherData
	json.NewDecoder(resp.Body).Decode(&data)

	// Logic for the Agent to use
	assessment := ""
	if data.Current.Rain > 0 {
		assessment = "High Risk: Rain detected. Advise farmer to cover harvested crops."
	} else if data.Current.Temperature > 35 {
		assessment = "Extreme Heat: Advise early morning irrigation."
	} else {
		assessment = "Condition: Clear. Good for spraying or harvesting."
	}

	return fmt.Sprintf("Temp: %.1f°C, Rain: %.1fmm, Wind: %.1fkm/h. Assessment: %s",
		data.Current.Temperature, data.Current.Rain, data.Current.WindSpeed, assessment)
}
