package httpx

import (
	"net/http"

	"github.com/naofumi/real-world-apps/apps/go-htmx/internal/auth"
	"github.com/naofumi/real-world-apps/apps/go-htmx/internal/db"
)

func (s *Server) Home(w http.ResponseWriter, r *http.Request) error {
	ctx := r.Context()
	tag := r.URL.Query().Get("tag")
	offset := pageOffset(r)

	var (
		rows []db.ArticlePreview
		err  error
	)
	if tag == "" {
		rows, err = s.Q.ListGlobalArticles(ctx, db.ListGlobalArticlesParams{Limit: pageSize, Offset: offset})
	} else {
		rows, err = s.Q.ListGlobalArticlesByTag(ctx, db.ListGlobalArticlesByTagParams{Name: tag, Limit: pageSize, Offset: offset})
	}
	if err != nil {
		return err
	}

	view := homeView{Mode: "global", Tag: tag}
	if tag != "" {
		view.Mode = "tag"
	}
	return s.renderHome(w, r, "Conduit", view, rows)
}

func (s *Server) Feed(w http.ResponseWriter, r *http.Request) error {
	ctx := r.Context()
	rows, err := s.Q.ListFeedArticles(ctx, db.ListFeedArticlesParams{
		FollowerID: auth.ViewerFrom(ctx).ID,
		Limit:      pageSize,
		Offset:     pageOffset(r),
	})
	if err != nil {
		return err
	}
	return s.renderHome(w, r, "Your Feed — Conduit", homeView{Mode: "feed"}, rows)
}

func (s *Server) renderHome(w http.ResponseWriter, r *http.Request, title string, view homeView, rows []db.ArticlePreview) error {
	var err error
	if view.Articles, err = s.previews(r.Context(), rows); err != nil {
		return err
	}
	if view.Tags, err = s.popularTags(r.Context()); err != nil {
		return err
	}
	return s.R.HTML(w, r, "home", title, view)
}
