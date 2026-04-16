package tools

import "fmt"

// GetMarketPrice simulates fetching real-time data from your Supabase DB
func GetMarketPrice(crop, location string) string {
	// In production, this would be a DB query:
	// SELECT price FROM market_data WHERE crop = $1 AND location = $2

	// Mock response for the Demo:
	priceMap := map[string]string{
		"Maize":  "₦38,500",
		"Millet": "₦45,000",
	}

	price, ok := priceMap[crop]
	if !ok {
		return fmt.Sprintf("Ina ba ku hakuri, ban sami farashin %s a %s ba yanzu.", crop, location)
	}

	return fmt.Sprintf("Farashin %s a %s shine %s. Kasuwar tana da kyau yau.", crop, location, price)
}
