package httpx

import (
	"database/sql"
	"net/http"
	"strings"

	"github.com/naofumi/real-world-apps/apps/go-htmx/internal/auth"
	"github.com/naofumi/real-world-apps/apps/go-htmx/internal/db"
)

func (s *Server) LoginForm(w http.ResponseWriter, r *http.Request) {
	s.R.HTML(w, r, "login", "Sign in — Conduit", map[string]any{
		"Email": "",
		"Errors": []string{},
	})
}

func (s *Server) Login(w http.ResponseWriter, r *http.Request) {
	email := strings.TrimSpace(r.FormValue("email"))
	password := r.FormValue("password")
	u, err := s.Q.GetUserByEmail(r.Context(), email)
	if err != nil || !auth.CheckPassword(u.PasswordHash, password) {
		s.R.HTML(w, r, "login", "Sign in — Conduit", map[string]any{
			"Email":  email,
			"Errors": []string{"email or password is invalid"},
		})
		return
	}
	token, _, err := auth.CreateSession(r.Context(), s.Q, u.ID)
	if err != nil {
		http.Error(w, "session error", http.StatusInternalServerError)
		return
	}
	auth.SetSessionCookie(w, token)
	http.SetCookie(w, &http.Cookie{Name: "csrf_anon", Value: "", Path: "/", MaxAge: -1})
	http.Redirect(w, r, "/", http.StatusSeeOther)
}

func (s *Server) Logout(w http.ResponseWriter, r *http.Request) {
	if tok := auth.SessionTokenFrom(r.Context()); tok != "" {
		_ = s.Q.DeleteSession(r.Context(), tok)
	}
	auth.ClearSessionCookie(w)
	http.Redirect(w, r, "/", http.StatusSeeOther)
}

func (s *Server) RegisterForm(w http.ResponseWriter, r *http.Request) {
	s.R.HTML(w, r, "register", "Sign up — Conduit", map[string]any{
		"Username": "",
		"Email":    "",
		"Errors":   []string{},
	})
}

func (s *Server) Register(w http.ResponseWriter, r *http.Request) {
	username := strings.TrimSpace(r.FormValue("username"))
	email := strings.TrimSpace(r.FormValue("email"))
	password := r.FormValue("password")
	var errs []string
	if username == "" {
		errs = append(errs, "username can't be blank")
	}
	if email == "" {
		errs = append(errs, "email can't be blank")
	}
	if len(password) < 8 {
		errs = append(errs, "password is too short (minimum is 8 characters)")
	}
	if len(errs) > 0 {
		s.R.HTML(w, r, "register", "Sign up — Conduit", map[string]any{
			"Username": username, "Email": email, "Errors": errs,
		})
		return
	}
	hash, err := auth.HashPassword(password)
	if err != nil {
		http.Error(w, "hash error", http.StatusInternalServerError)
		return
	}
	u, err := s.Q.CreateUser(r.Context(), db.CreateUserParams{
		Email:        email,
		Username:     username,
		PasswordHash: hash,
		Bio:          sql.NullString{},
		Image:        sql.NullString{},
	})
	if err != nil {
		s.R.HTML(w, r, "register", "Sign up — Conduit", map[string]any{
			"Username": username, "Email": email,
			"Errors": []string{"email or username is already taken"},
		})
		return
	}
	token, _, err := auth.CreateSession(r.Context(), s.Q, u.ID)
	if err != nil {
		http.Error(w, "session error", http.StatusInternalServerError)
		return
	}
	auth.SetSessionCookie(w, token)
	http.SetCookie(w, &http.Cookie{Name: "csrf_anon", Value: "", Path: "/", MaxAge: -1})
	http.Redirect(w, r, "/", http.StatusSeeOther)
}

func (s *Server) SettingsForm(w http.ResponseWriter, r *http.Request) {
	v := auth.ViewerFrom(r.Context())
	u, err := s.Q.GetUserByID(r.Context(), v.ID)
	if err != nil {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}
	s.R.HTML(w, r, "settings", "Settings — Conduit", map[string]any{
		"User":   u,
		"Errors": []string{},
	})
}

func (s *Server) SettingsUpdate(w http.ResponseWriter, r *http.Request) {
	v := auth.ViewerFrom(r.Context())
	u, err := s.Q.GetUserByID(r.Context(), v.ID)
	if err != nil {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}
	email := strings.TrimSpace(r.FormValue("email"))
	username := strings.TrimSpace(r.FormValue("username"))
	bio := strings.TrimSpace(r.FormValue("bio"))
	image := strings.TrimSpace(r.FormValue("image"))
	password := r.FormValue("password")
	hash := u.PasswordHash
	if password != "" {
		if len(password) < 8 {
			s.R.HTML(w, r, "settings", "Settings — Conduit", map[string]any{
				"User": u, "Errors": []string{"password is too short (minimum is 8 characters)"},
			})
			return
		}
		h, err := auth.HashPassword(password)
		if err != nil {
			http.Error(w, "hash error", http.StatusInternalServerError)
			return
		}
		hash = h
	}
	updated, err := s.Q.UpdateUser(r.Context(), db.UpdateUserParams{
		Email:        email,
		Username:     username,
		PasswordHash: hash,
		Bio:          sql.NullString{String: bio, Valid: true},
		Image:        sql.NullString{String: image, Valid: image != ""},
		ID:           u.ID,
	})
	if err != nil {
		s.R.HTML(w, r, "settings", "Settings — Conduit", map[string]any{
			"User": u, "Errors": []string{"could not update settings"},
		})
		return
	}
	_ = updated
	SetFlash(w, "Settings updated.")
	http.Redirect(w, r, "/settings", http.StatusSeeOther)
}
