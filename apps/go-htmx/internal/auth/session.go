package auth

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"net/http"
	"time"

	"github.com/naofumi/real-world-apps/apps/go-htmx/internal/db"
)

const (
	SessionCookie = "conduit_session"
	sessionTTL    = 30 * 24 * time.Hour
)

type contextKey int

const (
	ctxViewer contextKey = iota
	ctxSession
	ctxCSRF
)

type Viewer struct {
	ID       int64
	Email    string
	Username string
	Bio      sqlNullString
	Image    sqlNullString
}

// sqlNullString avoids importing database/sql in every template helper.
type sqlNullString struct {
	String string
	Valid  bool
}

func NewViewer(u db.User) *Viewer {
	v := &Viewer{
		ID:       u.ID,
		Email:    u.Email,
		Username: u.Username,
	}
	if u.Bio.Valid {
		v.Bio = sqlNullString{String: u.Bio.String, Valid: true}
	}
	if u.Image.Valid {
		v.Image = sqlNullString{String: u.Image.String, Valid: true}
	}
	return v
}

func (v *Viewer) BioText() string {
	if v == nil || !v.Bio.Valid {
		return ""
	}
	return v.Bio.String
}

func (v *Viewer) ImageURL() string {
	if v == nil || !v.Image.Valid || v.Image.String == "" {
		return "https://api.realworld.io/images/smiley-cyrus.jpeg"
	}
	return v.Image.String
}

func RandomToken(n int) (string, error) {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(b), nil
}

func CreateSession(ctx context.Context, q *db.Queries, userID int64) (token, csrf string, err error) {
	token, err = RandomToken(32)
	if err != nil {
		return "", "", err
	}
	csrf, err = RandomToken(32)
	if err != nil {
		return "", "", err
	}
	expires := time.Now().UTC().Add(sessionTTL).Format("2006-01-02 15:04:05")
	_, err = q.CreateSession(ctx, db.CreateSessionParams{
		Token:     token,
		UserID:    userID,
		CsrfToken: csrf,
		ExpiresAt: expires,
	})
	return token, csrf, err
}

func SetSessionCookie(w http.ResponseWriter, token string) {
	http.SetCookie(w, &http.Cookie{
		Name:     SessionCookie,
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   int(sessionTTL.Seconds()),
	})
}

func ClearSessionCookie(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     SessionCookie,
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		MaxAge:   -1,
	})
}

func WithViewer(ctx context.Context, v *Viewer) context.Context {
	return context.WithValue(ctx, ctxViewer, v)
}

func ViewerFrom(ctx context.Context) *Viewer {
	v, _ := ctx.Value(ctxViewer).(*Viewer)
	return v
}

func WithCSRF(ctx context.Context, token string) context.Context {
	return context.WithValue(ctx, ctxCSRF, token)
}

func CSRFFrom(ctx context.Context) string {
	t, _ := ctx.Value(ctxCSRF).(string)
	return t
}

func WithSessionToken(ctx context.Context, token string) context.Context {
	return context.WithValue(ctx, ctxSession, token)
}

func SessionTokenFrom(ctx context.Context) string {
	t, _ := ctx.Value(ctxSession).(string)
	return t
}
