package tools

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
)

type NewRecord struct {
	UserID       string  `json:"user_id"`
	CropName     string  `json:"crop_name"`
	Variety      string  `json:"variety"`
	PlantingDate string  `json:"planting_date"`
	AreaSize     float64 `json:"area_size"`
	Status       string  `json:"status"`
}

// CreateFarmRecord pushes new data to Supabase
func CreateFarmRecord(record NewRecord) string {
	supabaseURL := os.Getenv("SUPABASE_URL")
	supabaseKey := os.Getenv("SUPABASE_KEY") // Use service_role key

	jsonData, _ := json.Marshal(record)

	req, _ := http.NewRequest("POST", fmt.Sprintf("%s/rest/v1/farm_records", supabaseURL), bytes.NewBuffer(jsonData))
	req.Header.Set("apikey", supabaseKey)
	req.Header.Set("Authorization", "Bearer "+supabaseKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Prefer", "return=representation")

	client := &http.Client{}
	resp, err := client.Do(req)

	if err != nil || resp.StatusCode >= 400 {
		return "Failed to save record. Please try again later."
	}
	defer resp.Body.Close()

	return fmt.Sprintf("Success! I have recorded %s (%s) for your farm.", record.CropName, record.Variety)
}
