package httpx

import (
	"database/sql"
	"errors"
	"net/http"
	"strings"

	"github.com/naofumi/real-world-apps/apps/go-htmx/internal/auth"
	"github.com/naofumi/real-world-apps/apps/go-htmx/internal/db"
)

const (
	loginTitle    = "Sign in — Conduit"
	registerTitle = "Sign up — Conduit"
	settingsTitle = "Settings — Conduit"
)

func (s *Server) LoginForm(w http.ResponseWriter, r *http.Request) error {
	return s.R.HTML(w, r, "login", loginTitle, authView{})
}

func (s *Server) Login(w http.ResponseWriter, r *http.Request) error {
	email := strings.TrimSpace(r.FormValue("email"))
	u, err := s.Q.GetUserByEmail(r.Context(), email)
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		return err
	}
	if err != nil || !auth.CheckPassword(u.PasswordHash, r.FormValue("password")) {
		return s.R.HTML(w, r, "login", loginTitle, authView{
			Email:  email,
			Errors: []string{"email or password is invalid"},
		})
	}
	return s.signIn(w, r, u.ID)
}

func (s *Server) Logout(w http.ResponseWriter, r *http.Request) error {
	if tok := auth.SessionTokenFrom(r.Context()); tok != "" {
		if err := s.Q.DeleteSession(r.Context(), tok); err != nil {
			return err
		}
	}
	auth.ClearSessionCookie(w)
	return redirect(w, r, "/")
}

func (s *Server) RegisterForm(w http.ResponseWriter, r *http.Request) error {
	return s.R.HTML(w, r, "register", registerTitle, authView{})
}

func (s *Server) Register(w http.ResponseWriter, r *http.Request) error {
	f := parseRegisterForm(r)
	rerender := func(errs ...string) error {
		return s.R.HTML(w, r, "register", registerTitle, authView{Username: f.Username, Email: f.Email, Errors: errs})
	}
	if errs := f.errors(); len(errs) > 0 {
		return rerender(errs...)
	}
	hash, err := auth.HashPassword(f.Password)
	if err != nil {
		return err
	}
	u, err := s.Q.CreateUser(r.Context(), db.CreateUserParams{
		Email:        f.Email,
		Username:     f.Username,
		PasswordHash: hash,
	})
	if isUniqueViolation(err) {
		return rerender("email or username is already taken")
	}
	if err != nil {
		return err
	}
	return s.signIn(w, r, u.ID)
}

func (s *Server) SettingsForm(w http.ResponseWriter, r *http.Request) error {
	u, err := s.Q.GetUserByID(r.Context(), auth.ViewerFrom(r.Context()).ID)
	if err != nil {
		return orNotFound(err, "user")
	}
	return s.R.HTML(w, r, "settings", settingsTitle, settingsView{User: u})
}

func (s *Server) SettingsUpdate(w http.ResponseWriter, r *http.Request) error {
	ctx := r.Context()
	u, err := s.Q.GetUserByID(ctx, auth.ViewerFrom(ctx).ID)
	if err != nil {
		return orNotFound(err, "user")
	}
	f := parseSettingsForm(r)
	rerender := func(errs ...string) error {
		return s.R.HTML(w, r, "settings", settingsTitle, settingsView{User: u, Errors: errs})
	}
	if errs := f.errors(); len(errs) > 0 {
		return rerender(errs...)
	}

	hash := u.PasswordHash
	if f.Password != "" {
		if hash, err = auth.HashPassword(f.Password); err != nil {
			return err
		}
	}
	_, err = s.Q.UpdateUser(ctx, db.UpdateUserParams{
		Email:        f.Email,
		Username:     f.Username,
		PasswordHash: hash,
		Bio:          sql.NullString{String: f.Bio, Valid: true},
		Image:        sql.NullString{String: f.Image, Valid: f.Image != ""},
		ID:           u.ID,
	})
	if isUniqueViolation(err) {
		return rerender("email or username is already taken")
	}
	if err != nil {
		return err
	}
	SetFlash(w, "Settings updated.")
	return redirect(w, r, "/settings")
}
