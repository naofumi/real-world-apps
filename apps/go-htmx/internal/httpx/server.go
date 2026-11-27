package httpx

import (
	"database/sql"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/naofumi/real-world-apps/apps/go-htmx/internal/config"
	"github.com/naofumi/real-world-apps/apps/go-htmx/internal/db"
)

type Server struct {
	DB  *sql.DB
	Q   *db.Queries
	R   *Renderer
	Cfg config.Config
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

	r.Get("/", s.h(s.Home))
	r.Get("/login", s.h(s.LoginForm))
	r.Get("/register", s.h(s.RegisterForm))
	r.Get("/articles/{slug}", s.h(s.ArticleShow))
	r.Get("/users/{username}", s.h(s.ProfileShow))
	r.Get("/users/{username}/favorites", s.h(s.ProfileFavorites))

	r.Group(func(r chi.Router) {
		r.Use(s.RequireCSRF)
		r.Post("/login", s.h(s.Login))
		r.Post("/register", s.h(s.Register))
		r.Post("/logout", s.h(s.Logout))
	})

	r.Group(func(r chi.Router) {
		r.Use(s.RequireLogin)
		r.Get("/feed", s.h(s.Feed))
		r.Get("/settings", s.h(s.SettingsForm))
		r.Get("/articles/new", s.h(s.ArticleNewForm))
		r.Get("/articles/{slug}/edit", s.h(s.ArticleEditForm))

		r.Group(func(r chi.Router) {
			r.Use(s.RequireCSRF)
			r.Post("/settings", s.h(s.SettingsUpdate))
			r.Post("/articles", s.h(s.ArticleCreate))
			r.Post("/articles/{slug}", s.h(s.ArticleUpdate))
			r.Post("/articles/{slug}/delete", s.h(s.ArticleDelete))
			r.Post("/articles/{slug}/favorite", s.h(s.FavoriteCreate))
			r.Post("/articles/{slug}/unfavorite", s.h(s.FavoriteDestroy))
			r.Post("/articles/{slug}/comments", s.h(s.CommentCreate))
			r.Post("/comments/{id}/delete", s.h(s.CommentDelete))
			r.Post("/users/{username}/follow", s.h(s.FollowCreate))
			r.Post("/users/{username}/unfollow", s.h(s.FollowDestroy))
		})
	})

	return r
}
