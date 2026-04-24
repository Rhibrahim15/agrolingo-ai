package handlers

import (
	"context"
	"fmt"
	"net/http"

	"github.com/Rhibrahim15/agrolingo-ai/internal/agent"
	"github.com/Rhibrahim15/agrolingo-ai/internal/tools"
	"github.com/google/generative-ai-go/genai"
	"github.com/labstack/echo/v4"
)

type ChatRequest struct {
	Message string `json:"message"`
	Lang    string `json:"lang"`
	UserID  string `json:"userId"`
}

type ChatResponse struct {
	Reply string `json:"reply"`
}

func HandleAgentChat(agnt *agent.Agent) echo.HandlerFunc {
	return func(c echo.Context) error {
		var req ChatRequest
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request"})
		}

		ctx := context.Background()
		// Start a new session for each request (Stateless for simple chat)
		session := agnt.Model.StartChat()

		// 1. Send the initial message to Gemini
		resp, err := session.SendMessage(ctx, genai.Text(req.Message))
		if err != nil {
			// 🚨 ADD THIS PRINT LINE:
			fmt.Println("\n--- 🛑 GEMINI ERROR DETECTED 🛑 ---")
			fmt.Printf("Error Type: %T\n", err)
			fmt.Printf("Error Message: %v\n", err)
			fmt.Println("----------------\n")

			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "AI reasoning failed: " + err.Error(),
			})
		}

		// 🛑 FIX 1: Safety check for empty candidates
		if len(resp.Candidates) == 0 || resp.Candidates[0].Content == nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "AI returned empty response"})
		}

		// 2. 🛠️ Check for Tool (Function) Calls
		// Gemini can return multiple parts; we look for a FunctionCall part
		for _, part := range resp.Candidates[0].Content.Parts {
			if fn, ok := part.(genai.FunctionCall); ok {
				var result string

				// Switch through available tools
				switch fn.Name {
				case "get_weather_intelligence":
					lat := fmt.Sprintf("%v", fn.Args["lat"])
					lon := fmt.Sprintf("%v", fn.Args["lon"])
					result = GetWeatherAnalysis(lat, lon)

				case "add_farm_record":
					// Safely handle types from Gemini (usually float64 for numbers)
					areaSize, _ := fn.Args["area_size"].(float64)

					newRec := tools.NewRecord{
						UserID:       req.UserID,
						CropName:     fmt.Sprintf("%v", fn.Args["crop_name"]),
						Variety:      fmt.Sprintf("%v", fn.Args["variety"]),
						PlantingDate: fmt.Sprintf("%v", fn.Args["planting_date"]),
						AreaSize:     areaSize,
						Status:       "Growing",
					}
					result = tools.CreateFarmRecord(newRec)

				case "get_market_price":
					crop := fmt.Sprintf("%v", fn.Args["crop"])
					location := fmt.Sprintf("%v", fn.Args["location"])
					result = tools.GetMarketPrice(crop, location)
				}

				// 3. Send the tool result back to Gemini to get the final human reply
				resp, err = session.SendMessage(ctx, genai.FunctionResponse{
					Name:     fn.Name,
					Response: map[string]any{"content": result},
				})
				if err != nil {
					return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Final synthesis failed"})
				}
			}
		}

		// 4. Extract final text from the final response
		if len(resp.Candidates) > 0 && resp.Candidates[0].Content != nil {
			// Join all text parts into a single string
			var aiReply string
			for _, part := range resp.Candidates[0].Content.Parts {
				if txt, ok := part.(genai.Text); ok {
					aiReply += string(txt)
				}
			}
			return c.JSON(http.StatusOK, ChatResponse{Reply: aiReply})
		}

		return c.JSON(http.StatusOK, ChatResponse{Reply: "Ina jin dadi, amma ban gane ba. Sake tambaya."})
	}
}
