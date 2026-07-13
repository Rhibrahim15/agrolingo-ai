package auth

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/labstack/echo/v4"
)

func TestVerifierAcceptsValidSupabaseSession(t *testing.T) {
	authServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("apikey") != "anon-key" || r.Header.Get("Authorization") != "Bearer valid-token" {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"id":"user-123","email":"farmer@example.test","app_metadata":{}}`))
	}))
	defer authServer.Close()

	e := echo.New()
	verifier := NewVerifier(authServer.URL, "anon-key")
	e.GET("/protected", func(c echo.Context) error {
		user, ok := UserFromContext(c)
		if !ok {
			return c.NoContent(http.StatusInternalServerError)
		}
		return c.String(http.StatusOK, user.ID)
	}, verifier.Middleware)

	request := httptest.NewRequest(http.MethodGet, "/protected", nil)
	request.Header.Set("Authorization", "Bearer valid-token")
	recorder := httptest.NewRecorder()
	e.ServeHTTP(recorder, request)
	if recorder.Code != http.StatusOK || recorder.Body.String() != "user-123" {
		t.Fatalf("unexpected response: status=%d body=%q", recorder.Code, recorder.Body.String())
	}
}

func TestVerifierRejectsMissingToken(t *testing.T) {
	e := echo.New()
	verifier := NewVerifier("https://example.invalid", "anon-key")
	e.GET("/protected", func(c echo.Context) error {
		return c.NoContent(http.StatusOK)
	}, verifier.Middleware)

	request := httptest.NewRequest(http.MethodGet, "/protected", nil)
	recorder := httptest.NewRecorder()
	e.ServeHTTP(recorder, request)
	if recorder.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", recorder.Code)
	}
}
