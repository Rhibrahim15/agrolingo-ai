package agent

import "fmt"

func (a *Agent) GetMarketPrice(crop string, location string) (string, error) {
	// 🕵️ In a real app, you'd use a Supabase Go client or direct SQL
	// For now, let's simulate the DB query with a clean format

	// logic: SELECT price_per_kg FROM market_prices WHERE crop = crop AND market = location
	price := 450.0 // Simulated result
	trend := "up"

	return fmt.Sprintf("The current price of %s in %s market is ₦%.2f per kg. The trend is currently %s.",
		crop, location, price, trend), nil
}

// func (a *Agent) FetchWeatherIntelligence(region string) (string, error) {
// 	// In a real setup, use a database/sql driver to query Supabase
// 	// query := "SELECT condition, advice_ha FROM weather_intelligence WHERE region = $1"

// 	// Simulated Result from your new SQL table
// 	condition := "Harmattan/Dusty"
// 	adviceHa := "A tabbatar da shayarwa akai-akai saboda iska mai bushewa."
// 	adviceEn := "Ensure frequent irrigation due to dry winds."

// 	return fmt.Sprintf("Region: %s. Condition: %s. Advice (HA): %s. Advice (EN): %s",
// 		region, condition, adviceHa, adviceEn), nil
// }
