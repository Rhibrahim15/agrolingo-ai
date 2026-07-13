package auth

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/labstack/echo/v4"
)

const UserContextKey = "authenticated_user"

type User struct {
	ID          string                 `json:"id"`
	Email       string                 `json:"email"`
	AppMetadata map[string]interface{} `json:"app_metadata"`
}

type Verifier struct {
	supabaseURL string
	anonKey     string
	client      *http.Client
}

func NewVerifier(supabaseURL, anonKey string) *Verifier {
	return &Verifier{
		supabaseURL: strings.TrimRight(supabaseURL, "/"),
		anonKey:     anonKey,
		client:      &http.Client{Timeout: 10 * time.Second},
	}
}

func (v *Verifier) Middleware(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		token, err := bearerToken(c.Request().Header.Get(echo.HeaderAuthorization))
		if err != nil {
			return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Authentication required."})
		}

		request, err := http.NewRequestWithContext(c.Request().Context(), http.MethodGet, v.supabaseURL+"/auth/v1/user", nil)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Authentication could not be verified."})
		}
		request.Header.Set("apikey", v.anonKey)
		request.Header.Set(echo.HeaderAuthorization, "Bearer "+token)

		response, err := v.client.Do(request)
		if err != nil {
			return c.JSON(http.StatusServiceUnavailable, map[string]string{"error": "Authentication service is temporarily unavailable."})
		}
		defer response.Body.Close()
		if response.StatusCode != http.StatusOK {
			return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Your session is invalid or has expired."})
		}

		var user User
		decoder := json.NewDecoder(io.LimitReader(response.Body, 1<<20))
		if err := decoder.Decode(&user); err != nil || user.ID == "" {
			return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Your session could not be verified."})
		}

		c.Set(UserContextKey, user)
		return next(c)
	}
}

func UserFromContext(c echo.Context) (User, bool) {
	user, ok := c.Get(UserContextKey).(User)
	return user, ok
}

func bearerToken(value string) (string, error) {
	parts := strings.Fields(value)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") || parts[1] == "" {
		return "", errors.New("invalid authorization header")
	}
	return parts[1], nil
}
