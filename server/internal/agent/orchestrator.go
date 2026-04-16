package agent

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/google/generative-ai-go/genai"
	"google.golang.org/api/option"
)

// 1. 🏗️ The Agent Definition (This fixes the "undefined" error)
type Agent struct {
	Client *genai.Client
	Model  *genai.GenerativeModel
}

// 2. 🔑 The Identity Shield (Manually forces the API Key into the request)
type apiKeyTransport struct {
	key string
	rt  http.RoundTripper
}

func (t *apiKeyTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	q := req.URL.Query()
	q.Set("key", t.key)
	req.URL.RawQuery = q.Encode()
	return t.rt.RoundTrip(req)
}

// 3. 🚀 The Initializer
func NewAgent(ctx context.Context, apiKey string) (*Agent, error) {
	// Custom HTTP client to ensure the key is attached and wait longer for slow networks
	httpClient := &http.Client{
		Transport: &apiKeyTransport{
			key: apiKey,
			rt:  http.DefaultTransport,
		},
		Timeout: 90 * time.Second,
	}

	client, err := genai.NewClient(ctx,
		option.WithAPIKey(apiKey),
		option.WithHTTPClient(httpClient),
	)
	if err != nil {
		return nil, err
	}

	model := client.GenerativeModel("gemini-2.5-flash")

	// 🧠 System Instruction for AgroLingo
	model.SystemInstruction = &genai.Content{
		Parts: []genai.Part{
			genai.Text("You are AgroLingo AI, a professional agricultural assistant for farmers in Nigeria. " +
				"Provide clear advice in English and Hausa. Be localized and helpful."),
		},
	}

	// 🛠️ Registering Tools (Market Prices and Weather)
	model.Tools = []*genai.Tool{
		{
			FunctionDeclarations: []*genai.FunctionDeclaration{
				{
					Name:        "get_weather_intelligence",
					Description: "Fetch regional weather forecasts and specific farming advice for a Nigerian state.",
					Parameters: &genai.Schema{
						Type: genai.TypeObject,
						Properties: map[string]*genai.Schema{
							"region": {Type: genai.TypeString, Description: "The state or city name, e.g., Kano, Benue"},
						},
						Required: []string{"region"},
					},
				},
			},
		},
	}

	return &Agent{
		Client: client,
		Model:  model,
	}, nil
}

// Now this works because it's in the same package as the Agent struct
func (a *Agent) FetchWeatherIntelligence(region string) (string, error) {
	// Simulated Result - Later you will replace this with a Supabase query
	condition := "Harmattan/Dusty"
	adviceHa := "A tabbatar da shayarwa akai-akai saboda iska mai bushewa."
	adviceEn := "Ensure frequent irrigation due to dry winds."

	return fmt.Sprintf("Region: %s. Condition: %s. Advice (HA): %s. Advice (EN): %s",
		region, condition, adviceHa, adviceEn), nil
}
