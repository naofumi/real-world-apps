package httpx

import (
	"database/sql"
	"fmt"
	"html/template"
	"net/http"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/naofumi/real-world-apps/apps/go-htmx/internal/auth"
	"github.com/yuin/goldmark"
	"github.com/yuin/goldmark/renderer/html"
)

type Renderer struct {
	dir       string
	funcs     template.FuncMap
	mu        sync.RWMutex
	cache     map[string]*template.Template
	devReload bool
}

func NewRenderer(dir string, reload bool) *Renderer {
	md := goldmark.New(
		goldmark.WithRendererOptions(html.WithHardWraps()),
	)
	r := &Renderer{
		dir:       dir,
		cache:     map[string]*template.Template{},
		devReload: reload,
	}
	r.funcs = template.FuncMap{
		"formatDate": func(s string) string {
			t, err := time.Parse("2006-01-02 15:04:05", s)
			if err != nil {
				return s
			}
			return t.Format("Jan 2, 2006")
		},
		"markdown": func(s string) template.HTML {
			var buf strings.Builder
			if err := md.Convert([]byte(s), &buf); err != nil {
				return template.HTML(template.HTMLEscapeString(s))
			}
			return template.HTML(buf.String())
		},
		"join": strings.Join,
		"defaultImage": func(img string) string {
			if img == "" {
				return "https://api.realworld.io/images/smiley-cyrus.jpeg"
			}
			return img
		},
		"nullStr": func(ns sql.NullString) string {
			if ns.Valid {
				return ns.String
			}
			return ""
		},
		"dict": func(values ...any) (map[string]any, error) {
			if len(values)%2 != 0 {
				return nil, fmt.Errorf("dict requires even number of args")
			}
			m := make(map[string]any, len(values)/2)
			for i := 0; i < len(values); i += 2 {
				key, ok := values[i].(string)
				if !ok {
					return nil, fmt.Errorf("dict keys must be strings")
				}
				m[key] = values[i+1]
			}
			return m, nil
		},
	}
	return r
}

func (r *Renderer) load(name string) (*template.Template, error) {
	if !r.devReload {
		r.mu.RLock()
		if t, ok := r.cache[name]; ok {
			r.mu.RUnlock()
			return t, nil
		}
		r.mu.RUnlock()
	}

	files := []string{
		filepath.Join(r.dir, "layouts", "base.html"),
		filepath.Join(r.dir, "partials", "article_preview.html"),
		filepath.Join(r.dir, "partials", "favorite_button.html"),
		filepath.Join(r.dir, "partials", "follow_button.html"),
		filepath.Join(r.dir, "pages", name+".html"),
	}
	t, err := template.New("base.html").Funcs(r.funcs).ParseFiles(files...)
	if err != nil {
		return nil, err
	}

	r.mu.Lock()
	r.cache[name] = t
	r.mu.Unlock()
	return t, nil
}

type PageData struct {
	Title   string
	Viewer  *auth.Viewer
	CSRF    string
	Flash   string
	Alert   string
	Content any
}

func (r *Renderer) HTML(w http.ResponseWriter, req *http.Request, name string, title string, content any) {
	t, err := r.load(name)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	data := PageData{
		Title:   title,
		Viewer:  auth.ViewerFrom(req.Context()),
		CSRF:    auth.CSRFFrom(req.Context()),
		Content: content,
	}
	if f := flashFrom(req); f != "" {
		data.Flash = f
		ClearFlash(w)
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	if err := t.ExecuteTemplate(w, "base.html", data); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func (r *Renderer) Partial(w http.ResponseWriter, name string, data any) {
	path := filepath.Join(r.dir, "partials", name+".html")
	t, err := template.New(filepath.Base(path)).Funcs(r.funcs).ParseFiles(path)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	if err := t.ExecuteTemplate(w, name, data); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func flashFrom(req *http.Request) string {
	c, err := req.Cookie("flash")
	if err != nil || c.Value == "" {
		return ""
	}
	return c.Value
}

func SetFlash(w http.ResponseWriter, msg string) {
	http.SetCookie(w, &http.Cookie{
		Name:     "flash",
		Value:    msg,
		Path:     "/",
		MaxAge:   60,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
	})
}

func ClearFlash(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{Name: "flash", Value: "", Path: "/", MaxAge: -1})
}
