package handlers

import (
	"encoding/base64"
	"strings"
	"testing"
)

func TestParseImageAcceptsSupportedDataURI(t *testing.T) {
	encoded := base64.StdEncoding.EncodeToString([]byte("small image payload"))
	image, err := parseImage("data:image/png;base64," + encoded)
	if err != nil {
		t.Fatalf("parseImage returned error: %v", err)
	}
	if image == nil || image.MimeType != "image/png" || image.Data != encoded {
		t.Fatalf("unexpected image result: %#v", image)
	}
}

func TestParseImageRejectsUnsupportedOrOversizedInput(t *testing.T) {
	tests := []string{
		"https://example.com/image.png",
		"data:image/svg+xml;base64," + base64.StdEncoding.EncodeToString([]byte("<svg/>")),
		"data:image/png,not-base64",
		"data:image/png;base64,not-valid-base64",
		"data:image/png;base64," + base64.StdEncoding.EncodeToString(make([]byte, maxImageBytes+1)),
	}
	for _, value := range tests {
		if _, err := parseImage(value); err == nil {
			t.Fatalf("expected input to be rejected: %.40s", value)
		}
	}
}

func TestBuildGeminiRequestLimitsHistory(t *testing.T) {
	history := make([]HistoryMessage, 14)
	for index := range history {
		history[index] = HistoryMessage{Role: "user", Content: strings.Repeat("a", maxHistoryCharacters+20)}
	}
	request := buildGeminiRequest(ChatRequest{Message: "How should I prepare for drought?", Lang: "en", History: history}, nil)
	if len(request.Contents) != maxHistoryMessages+1 {
		t.Fatalf("expected %d contents, got %d", maxHistoryMessages+1, len(request.Contents))
	}
	for _, content := range request.Contents[:maxHistoryMessages] {
		if got := len([]rune(content.Parts[0].Text)); got != maxHistoryCharacters {
			t.Fatalf("expected truncated history length %d, got %d", maxHistoryCharacters, got)
		}
	}
}

func TestNormalizeLanguage(t *testing.T) {
	if normalizeLanguage("HA") != "ha" {
		t.Fatal("expected HA to normalize to ha")
	}
	if normalizeLanguage("unknown") != "en" {
		t.Fatal("expected unsupported language to fall back to en")
	}
}
