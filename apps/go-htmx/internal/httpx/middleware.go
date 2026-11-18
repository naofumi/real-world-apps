package httpx

import (
	"net/http"

	"github.com/naofumi/real-world-apps/apps/go-htmx/internal/auth"
)

func (s *Server) SessionMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()

		if c, err := r.Cookie(auth.SessionCookie); err == nil && c.Value != "" {
			sess, err := s.Q.GetSessionByToken(ctx, c.Value)
			if err == nil {
				u, err := s.Q.GetUserByID(ctx, sess.UserID)
				if err == nil {
					ctx = auth.WithViewer(ctx, auth.NewViewer(u))
					ctx = auth.WithCSRF(ctx, sess.CsrfToken)
					ctx = auth.WithSessionToken(ctx, sess.Token)
					next.ServeHTTP(w, r.WithContext(ctx))
					return
				}
			}
			auth.ClearSessionCookie(w)
		}

		if c, err := r.Cookie("csrf_anon"); err == nil && c.Value != "" {
			ctx = auth.WithCSRF(ctx, c.Value)
		} else {
			token, err := auth.RandomToken(24)
			if err == nil {
				ctx = auth.WithCSRF(ctx, token)
				http.SetCookie(w, &http.Cookie{
					Name:     "csrf_anon",
					Value:    token,
					Path:     "/",
					HttpOnly: true,
					SameSite: http.SameSiteLaxMode,
					MaxAge:   86400,
				})
			}
		}
		next.ServeHTTP(w, r.WithContext(ctx))
	})
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
			http.Error(w, "bad form", http.StatusBadRequest)
			return
		}
		expected := auth.CSRFFrom(r.Context())
		got := r.FormValue("_csrf")
		if got == "" {
			got = r.Header.Get("X-CSRF-Token")
		}
		if expected == "" || got == "" || got != expected {
			http.Error(w, "invalid CSRF token", http.StatusForbidden)
			return
		}
		next.ServeHTTP(w, r)
	})
}
