package httpx

import (
	"net/http"
	"strconv"

	"github.com/naofumi/real-world-apps/apps/go-htmx/internal/auth"
	"github.com/naofumi/real-world-apps/apps/go-htmx/internal/db"
)

const pageSize = 20

func (s *Server) Home(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tag := r.URL.Query().Get("tag")
	offset := pageOffset(r)

	var (
		previews []ArticlePreview
		total    int64
		err      error
	)
	if tag != "" {
		rows, e := s.Q.ListGlobalArticlesByTag(ctx, db.ListGlobalArticlesByTagParams{
			Name:   tag,
			Limit:  pageSize,
			Offset: int64(offset),
		})
		err = e
		for _, row := range rows {
			previews = append(previews, previewFromTag(row))
		}
		total, _ = s.Q.CountGlobalArticlesByTag(ctx, tag)
	} else {
		rows, e := s.Q.ListGlobalArticles(ctx, db.ListGlobalArticlesParams{
			Limit:  pageSize,
			Offset: int64(offset),
		})
		err = e
		for _, row := range rows {
			previews = append(previews, previewFromGlobal(row))
		}
		total, _ = s.Q.CountGlobalArticles(ctx)
	}
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	previews, err = s.attachTags(ctx, previews)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	csrf := auth.CSRFFrom(ctx)
	if v := auth.ViewerFrom(ctx); v != nil {
		previews, _ = s.markFavorited(ctx, v.ID, previews)
		previews = stampCSRF(previews, csrf)
	}
	tags, _ := s.Q.ListPopularTags(ctx, 20)
	tagNames := make([]string, 0, len(tags))
	for _, t := range tags {
		tagNames = append(tagNames, t.Name)
	}
	mode := "global"
	if tag != "" {
		mode = "tag"
	}
	s.R.HTML(w, r, "home", "Conduit", map[string]any{
		"Mode":     mode,
		"Tag":      tag,
		"Articles": previews,
		"Tags":     tagNames,
		"Total":    total,
		"CSRF":     csrf,
	})
}

func (s *Server) Feed(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	v := auth.ViewerFrom(ctx)
	offset := pageOffset(r)
	rows, err := s.Q.ListFeedArticles(ctx, db.ListFeedArticlesParams{
		FollowerID: v.ID,
		Limit:      pageSize,
		Offset:     int64(offset),
	})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	previews := make([]ArticlePreview, 0, len(rows))
	for _, row := range rows {
		previews = append(previews, previewFromFeed(row))
	}
	previews, _ = s.attachTags(ctx, previews)
	previews, _ = s.markFavorited(ctx, v.ID, previews)
	csrf := auth.CSRFFrom(ctx)
	previews = stampCSRF(previews, csrf)
	total, _ := s.Q.CountFeedArticles(ctx, v.ID)
	tags, _ := s.Q.ListPopularTags(ctx, 20)
	tagNames := make([]string, 0, len(tags))
	for _, t := range tags {
		tagNames = append(tagNames, t.Name)
	}
	s.R.HTML(w, r, "home", "Your Feed — Conduit", map[string]any{
		"Mode":     "feed",
		"Tag":      "",
		"Articles": previews,
		"Tags":     tagNames,
		"Total":    total,
		"CSRF":     csrf,
	})
}

func pageOffset(r *http.Request) int {
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page < 1 {
		page = 1
	}
	return (page - 1) * pageSize
}
