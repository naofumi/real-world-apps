package httpx

import (
	"database/sql"
	"net/http"
	"path/filepath"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/naofumi/real-world-apps/apps/go-htmx/internal/config"
	"github.com/naofumi/real-world-apps/apps/go-htmx/internal/db"
)

type Server struct {
	DB   *sql.DB
	Q    *db.Queries
	R    *Renderer
	Cfg  config.Config
}

func NewServer(sqlDB *sql.DB, cfg config.Config) *Server {
	return &Server{
		DB:  sqlDB,
		Q:   db.New(sqlDB),
		R:   NewRenderer(cfg.TemplatesDir, true),
		Cfg: cfg,
	}
}

func (s *Server) Router() http.Handler {
	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(s.SessionMiddleware)

	r.Handle("/static/*", http.StripPrefix("/static/", http.FileServer(http.Dir(s.Cfg.StaticDir))))

	r.Get("/", s.Home)
	r.Get("/feed", s.RequireLoginFn(s.Feed))

	r.Get("/login", s.LoginForm)
	r.With(s.RequireCSRF).Post("/login", s.Login)
	r.With(s.RequireCSRF).Post("/logout", s.Logout)

	r.Get("/register", s.RegisterForm)
	r.With(s.RequireCSRF).Post("/register", s.Register)

	r.Get("/settings", s.RequireLoginFn(s.SettingsForm))
	r.With(s.RequireCSRF).Post("/settings", s.RequireLoginFn(s.SettingsUpdate))

	r.Get("/articles/new", s.RequireLoginFn(s.ArticleNewForm))
	r.With(s.RequireCSRF).Post("/articles", s.RequireLoginFn(s.ArticleCreate))
	r.Get("/articles/{slug}", s.ArticleShow)
	r.Get("/articles/{slug}/edit", s.RequireLoginFn(s.ArticleEditForm))
	r.With(s.RequireCSRF).Post("/articles/{slug}", s.RequireLoginFn(s.ArticleUpdate))
	r.With(s.RequireCSRF).Post("/articles/{slug}/delete", s.RequireLoginFn(s.ArticleDelete))

	r.With(s.RequireCSRF).Post("/articles/{slug}/favorite", s.RequireLoginFn(s.FavoriteCreate))
	r.With(s.RequireCSRF).Post("/articles/{slug}/unfavorite", s.RequireLoginFn(s.FavoriteDestroy))

	r.With(s.RequireCSRF).Post("/articles/{slug}/comments", s.RequireLoginFn(s.CommentCreate))
	r.With(s.RequireCSRF).Post("/comments/{id}/delete", s.RequireLoginFn(s.CommentDelete))

	r.Get("/users/{username}", s.ProfileShow)
	r.Get("/users/{username}/favorites", s.ProfileFavorites)
	r.With(s.RequireCSRF).Post("/users/{username}/follow", s.RequireLoginFn(s.FollowCreate))
	r.With(s.RequireCSRF).Post("/users/{username}/unfollow", s.RequireLoginFn(s.FollowDestroy))

	return r
}

func (s *Server) RequireLoginFn(h http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		s.RequireLogin(h).ServeHTTP(w, r)
	}
}

func AppRoot() string {
	// callers pass absolute paths via config; helper for tests
	return filepath.Clean(".")
}
