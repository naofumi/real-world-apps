package httpx

import (
	"context"
	"net/http"
	"strconv"

	"github.com/naofumi/real-world-apps/apps/go-htmx/internal/auth"
	"github.com/naofumi/real-world-apps/apps/go-htmx/internal/db"
)

const pageSize = 20

// articlePreview is one row of an article list. The template also passes it
// to the favorite_button partial, which reads the promoted Slug, Title and
// FavoritesCount fields alongside Favorited, CSRF and Compact.
type articlePreview struct {
	db.ArticlePreview
	Tags      []string
	Favorited bool
	CSRF      string
	Compact   bool
}

// previews adds tags to list rows and, for a signed-in viewer, the favorited
// state and CSRF token that the compact favorite buttons need. Guests get no
// CSRF token, so the template hides their favorite buttons.
func (s *Server) previews(ctx context.Context, rows []db.ArticlePreview) ([]articlePreview, error) {
	out := make([]articlePreview, len(rows))
	ids := make([]int64, len(rows))
	for i, row := range rows {
		out[i] = articlePreview{ArticlePreview: row, Tags: []string{}}
		ids[i] = row.ID
	}
	if len(rows) == 0 {
		return out, nil
	}

	tagRows, err := s.Q.ListTagsForArticles(ctx, ids)
	if err != nil {
		return nil, err
	}
	tags := map[int64][]string{}
	for _, t := range tagRows {
		tags[t.ArticleID] = append(tags[t.ArticleID], t.Name)
	}
	for i := range out {
		if t, ok := tags[out[i].ID]; ok {
			out[i].Tags = t
		}
	}

	v := auth.ViewerFrom(ctx)
	if v == nil {
		return out, nil
	}
	favIDs, err := s.Q.ListFavoritedArticleIDs(ctx, db.ListFavoritedArticleIDsParams{UserID: v.ID, ArticleIds: ids})
	if err != nil {
		return nil, err
	}
	favorited := make(map[int64]bool, len(favIDs))
	for _, id := range favIDs {
		favorited[id] = true
	}
	csrf := auth.CSRFFrom(ctx)
	for i := range out {
		out[i].Favorited = favorited[out[i].ID]
		out[i].CSRF = csrf
		out[i].Compact = true
	}
	return out, nil
}

func (s *Server) popularTags(ctx context.Context) ([]string, error) {
	rows, err := s.Q.ListPopularTags(ctx, 20)
	if err != nil {
		return nil, err
	}
	names := make([]string, len(rows))
	for i, t := range rows {
		names[i] = t.Name
	}
	return names, nil
}

func pageOffset(r *http.Request) int64 {
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page < 1 {
		page = 1
	}
	return int64(page-1) * pageSize
}
