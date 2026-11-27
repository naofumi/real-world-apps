package httpx

import (
	"context"
	"crypto/subtle"
	"database/sql"
	"errors"
	"net/http"

	"github.com/naofumi/real-world-apps/apps/go-htmx/internal/auth"
)

const anonCSRFCookie = "csrf_anon"

var errBadCSRF = &httpError{http.StatusForbidden, "invalid CSRF token"}

func (s *Server) SessionMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx, err := s.withSession(w, r)
		if err != nil {
			s.writeError(w, r, err)
			return
		}
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// withSession puts the signed-in viewer and their session's CSRF token on the
// context. Guests get an anonymous CSRF token kept in its own cookie so the
// login and register forms can still be protected.
func (s *Server) withSession(w http.ResponseWriter, r *http.Request) (context.Context, error) {
	ctx := r.Context()

	if c, err := r.Cookie(auth.SessionCookie); err == nil && c.Value != "" {
		row, err := s.Q.GetSessionUser(ctx, c.Value)
		switch {
		case err == nil:
			ctx = auth.WithViewer(ctx, auth.NewViewer(row.User))
			ctx = auth.WithSessionToken(ctx, c.Value)
			return auth.WithCSRF(ctx, row.CsrfToken), nil
		case errors.Is(err, sql.ErrNoRows):
			auth.ClearSessionCookie(w)
		default:
			return nil, err
		}
	}

	if c, err := r.Cookie(anonCSRFCookie); err == nil && c.Value != "" {
		return auth.WithCSRF(ctx, c.Value), nil
	}
	token, err := auth.RandomToken(24)
	if err != nil {
		return nil, err
	}
	http.SetCookie(w, &http.Cookie{
		Name:     anonCSRFCookie,
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   86400,
	})
	return auth.WithCSRF(ctx, token), nil
}

func (s *Server) RequireLogin(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if auth.ViewerFrom(r.Context()) == nil {
			http.Redirect(w, r, "/login", http.StatusSeeOther)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (s *Server) RequireCSRF(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if err := r.ParseForm(); err != nil {
			s.writeError(w, r, badRequest("bad form"))
			return
		}
		if !validCSRF(r) {
			s.writeError(w, r, errBadCSRF)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func validCSRF(r *http.Request) bool {
	expected := auth.CSRFFrom(r.Context())
	got := r.FormValue("_csrf")
	if got == "" {
		got = r.Header.Get("X-CSRF-Token")
	}
	return expected != "" && subtle.ConstantTimeCompare([]byte(got), []byte(expected)) == 1
}
