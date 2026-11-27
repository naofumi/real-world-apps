package httpx_test

import (
	"io"
	"net/http"
	"net/http/cookiejar"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
)

// browser is a cookie-carrying client that reads the CSRF token from the
// last page it fetched, like a user submitting forms.
type browser struct {
	t      *testing.T
	base   string
	client *http.Client
	csrf   string
}

func newBrowser(t *testing.T, srv *httptest.Server) *browser {
	jar, _ := cookiejar.New(nil)
	return &browser{t: t, base: srv.URL, client: &http.Client{
		Jar:           jar,
		CheckRedirect: func(*http.Request, []*http.Request) error { return http.ErrUseLastResponse },
	}}
}

func (b *browser) get(path string) (int, string) {
	b.t.Helper()
	resp, err := b.client.Get(b.base + path)
	if err != nil {
		b.t.Fatal(err)
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	if tok := csrfFromBody(string(body)); tok != "" {
		b.csrf = tok
	}
	return resp.StatusCode, string(body)
}

func (b *browser) post(path string, form url.Values, header ...string) (int, string) {
	b.t.Helper()
	form.Set("_csrf", b.csrf)
	req, _ := http.NewRequest(http.MethodPost, b.base+path, strings.NewReader(form.Encode()))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	for i := 0; i+1 < len(header); i += 2 {
		req.Header.Set(header[i], header[i+1])
	}
	resp, err := b.client.Do(req)
	if err != nil {
		b.t.Fatal(err)
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	return resp.StatusCode, string(body)
}

func (b *browser) register(username string) {
	b.t.Helper()
	b.get("/register")
	code, body := b.post("/register", url.Values{
		"username": {username},
		"email":    {username + "@example.com"},
		"password": {"password1"},
	})
	if code != http.StatusSeeOther {
		b.t.Fatalf("register %s: %d %s", username, code, body)
	}
	b.get("/")
}

func TestArticleEditingIsValidatedAndOwnerOnly(t *testing.T) {
	srv := httptest.NewServer(testServer(t).Router())
	defer srv.Close()

	alice := newBrowser(t, srv)
	alice.register("alice")
	code, _ := alice.post("/articles", url.Values{
		"title": {"Hello World"}, "description": {"d"}, "body": {"b"}, "tagList": {"go"},
	})
	if code != http.StatusSeeOther {
		t.Fatalf("create: %d", code)
	}

	code, body := alice.post("/articles/hello-world", url.Values{"title": {" "}, "description": {"d"}, "body": {"b"}})
	if code != http.StatusOK || !strings.Contains(body, "title can&#39;t be blank") {
		t.Fatalf("blank title update: %d, want re-rendered form with error", code)
	}

	bob := newBrowser(t, srv)
	bob.register("bob")
	if code, _ := bob.post("/articles/hello-world", url.Values{"title": {"x"}, "description": {"d"}, "body": {"b"}}); code != http.StatusForbidden {
		t.Fatalf("non-owner update: %d, want 403", code)
	}
	if code, _ := bob.get("/articles/missing/edit"); code != http.StatusNotFound {
		t.Fatalf("edit missing article: %d, want 404", code)
	}

	code, body = bob.post("/articles/hello-world/favorite", url.Values{}, "HX-Request", "true")
	if code != http.StatusOK || !strings.Contains(body, "/articles/hello-world/unfavorite") || strings.Contains(body, "<html") {
		t.Fatalf("htmx favorite: %d, want unfavorite button partial", code)
	}
}
