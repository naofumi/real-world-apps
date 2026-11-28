package httpx

import (
	"context"
	"database/sql"
	"errors"
	"log"
	"net/http"
	"strings"

	"github.com/naofumi/real-world-apps/apps/go-htmx/internal/auth"
	"github.com/naofumi/real-world-apps/apps/go-htmx/internal/db"
)

// handlerFunc is an http.HandlerFunc that returns an error instead of
// writing one; Server.h turns it into a response.
type handlerFunc func(w http.ResponseWriter, r *http.Request) error

// httpError carries a status code and a message that is safe to show users.
// Any other error becomes a logged 500 with a generic message.
type httpError struct {
	status int
	msg    string
}

func (e *httpError) Error() string { return e.msg }

var errForbidden = &httpError{http.StatusForbidden, "forbidden"}

func notFound(what string) error {
	return &httpError{http.StatusNotFound, what + " not found"}
}

func badRequest(msg string) error {
	return &httpError{http.StatusBadRequest, msg}
}

// orNotFound maps sql.ErrNoRows to a 404 and passes other errors through.
func orNotFound(err error, what string) error {
	if errors.Is(err, sql.ErrNoRows) {
		return notFound(what)
	}
	return err
}

func isUniqueViolation(err error) bool {
	return err != nil && strings.Contains(err.Error(), "UNIQUE constraint failed")
}

func (s *Server) h(fn handlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if err := fn(w, r); err != nil {
			s.writeError(w, r, err)
		}
	}
}

func (s *Server) writeError(w http.ResponseWriter, r *http.Request, err error) {
	var he *httpError
	if errors.As(err, &he) {
		http.Error(w, he.msg, he.status)
		return
	}
	log.Printf("%s %s: %v", r.Method, r.URL.Path, err)
	http.Error(w, "internal server error", http.StatusInternalServerError)
}

func (s *Server) inTx(ctx context.Context, fn func(q *db.Queries) error) error {
	tx, err := s.DB.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	if err := fn(s.Q.WithTx(tx)); err != nil {
		return err
	}
	return tx.Commit()
}

func isHTMX(r *http.Request) bool {
	return r.Header.Get("HX-Request") == "true"
}

func redirect(w http.ResponseWriter, r *http.Request, url string) error {
	http.Redirect(w, r, url, http.StatusSeeOther)
	return nil
}

// signIn starts a session for userID and sends the browser home. The
// anonymous CSRF cookie is dropped because the session carries its own token.
func (s *Server) signIn(w http.ResponseWriter, r *http.Request, userID int64) error {
	token, _, err := auth.CreateSession(r.Context(), s.Q, userID)
	if err != nil {
		return err
	}
	auth.SetSessionCookie(w, token)
	http.SetCookie(w, &http.Cookie{Name: anonCSRFCookie, Value: "", Path: "/", MaxAge: -1})
	return redirect(w, r, "/")
}
