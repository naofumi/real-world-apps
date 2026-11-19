package httpx_test

import (
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/naofumi/real-world-apps/apps/go-htmx/internal/config"
	"github.com/naofumi/real-world-apps/apps/go-htmx/internal/db"
	"github.com/naofumi/real-world-apps/apps/go-htmx/internal/httpx"
)

func testServer(t *testing.T) *httpx.Server {
	t.Helper()
	root := filepath.Join("..", "..")
	cfg := config.Config{
		Addr:          "127.0.0.1:0",
		DatabasePath:  "file:httptest-" + t.Name() + "?mode=memory&cache=shared",
		MigrationsDir: filepath.Join(root, "sql", "migrations"),
		TemplatesDir:  filepath.Join(root, "templates"),
		StaticDir:     filepath.Join(root, "static"),
	}
	sqlDB, err := db.Open(cfg.DatabasePath, cfg.MigrationsDir)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = sqlDB.Close() })
	return httpx.NewServer(sqlDB, cfg)
}

func csrfFromBody(body string) string {
	const marker = `name="_csrf" value="`
	i := strings.Index(body, marker)
	if i < 0 {
		return ""
	}
	rest := body[i+len(marker):]
	j := strings.Index(rest, `"`)
	if j < 0 {
		return ""
	}
	return rest[:j]
}

func TestRegisterLoginLogout(t *testing.T) {
	srv := testServer(t)
	handler := srv.Router()

	// GET register → CSRF
	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/register", nil)
	handler.ServeHTTP(rec, req)
	if rec.Code != 200 {
		t.Fatalf("register get: %d", rec.Code)
	}
	csrf := csrfFromBody(rec.Body.String())
	if csrf == "" {
		t.Fatal("missing csrf")
	}
	cookies := rec.Result().Cookies()

	form := url.Values{
		"_csrf":    {csrf},
		"username": {"newbie"},
		"email":    {"newbie@example.com"},
		"password": {"password1"},
	}
	rec = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodPost, "/register", strings.NewReader(form.Encode()))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	for _, c := range cookies {
		req.AddCookie(c)
	}
	handler.ServeHTTP(rec, req)
	if rec.Code != http.StatusSeeOther {
		t.Fatalf("register post: %d %s", rec.Code, rec.Body.String())
	}
	var session *http.Cookie
	for _, c := range rec.Result().Cookies() {
		if c.Name == "conduit_session" {
			session = c
		}
	}
	if session == nil {
		t.Fatal("expected session cookie")
	}

	rec = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodGet, "/", nil)
	req.AddCookie(session)
	handler.ServeHTTP(rec, req)
	if rec.Code != 200 {
		t.Fatalf("home: %d", rec.Code)
	}
	if !strings.Contains(rec.Body.String(), "newbie") {
		t.Fatal("expected username in nav")
	}
}

func TestLoginRejectsBadPassword(t *testing.T) {
	// ensure templates exist relative to this package
	if _, err := os.Stat(filepath.Join("..", "..", "templates", "pages", "login.html")); err != nil {
		t.Fatal(err)
	}
	srv := testServer(t)
	handler := srv.Router()

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/login", nil)
	handler.ServeHTTP(rec, req)
	csrf := csrfFromBody(rec.Body.String())
	cookies := rec.Result().Cookies()

	form := url.Values{"_csrf": {csrf}, "email": {"nope@example.com"}, "password": {"wrong"}}
	rec = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodPost, "/login", strings.NewReader(form.Encode()))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	for _, c := range cookies {
		req.AddCookie(c)
	}
	handler.ServeHTTP(rec, req)
	if rec.Code != 200 {
		t.Fatalf("code=%d", rec.Code)
	}
	if !strings.Contains(rec.Body.String(), "email or password is invalid") {
		t.Fatal("expected error message")
	}
}
