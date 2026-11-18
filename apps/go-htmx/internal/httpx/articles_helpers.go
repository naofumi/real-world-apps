package httpx

import (
	"context"
	"database/sql"
	"strings"

	"github.com/naofumi/real-world-apps/apps/go-htmx/internal/db"
	"github.com/naofumi/real-world-apps/apps/go-htmx/internal/slug"
)

type ArticlePreview struct {
	ID             int64
	Title          string
	Description    string
	Slug           string
	FavoritesCount int64
	CreatedAt      string
	AuthorUsername string
	AuthorImage    string
	Tags           []string
	Favorited      bool
	CSRF           string
	Compact        bool
}

type ArticleDetail struct {
	ID             int64
	UserID         int64
	Title          string
	Description    string
	Body           string
	Slug           string
	FavoritesCount int64
	CreatedAt      string
	UpdatedAt      string
	AuthorUsername string
	AuthorBio      string
	AuthorImage    string
	Tags           []string
	Favorited      bool
	Following      bool
}

func (s *Server) attachTags(ctx context.Context, previews []ArticlePreview) ([]ArticlePreview, error) {
	if len(previews) == 0 {
		return previews, nil
	}
	rows, err := s.Q.ListAllArticleTags(ctx)
	if err != nil {
		return nil, err
	}
	byID := map[int64][]string{}
	for _, row := range rows {
		byID[row.ArticleID] = append(byID[row.ArticleID], row.Name)
	}
	for i := range previews {
		previews[i].Tags = byID[previews[i].ID]
		if previews[i].Tags == nil {
			previews[i].Tags = []string{}
		}
	}
	return previews, nil
}

func previewFromGlobal(row db.ListGlobalArticlesRow) ArticlePreview {
	return ArticlePreview{
		ID:             row.ID,
		Title:          row.Title,
		Description:    row.Description,
		Slug:           row.Slug,
		FavoritesCount: row.FavoritesCount,
		CreatedAt:      row.CreatedAt,
		AuthorUsername: row.AuthorUsername,
		AuthorImage:    nullStr(row.AuthorImage),
	}
}

func previewFromTag(row db.ListGlobalArticlesByTagRow) ArticlePreview {
	return ArticlePreview{
		ID:             row.ID,
		Title:          row.Title,
		Description:    row.Description,
		Slug:           row.Slug,
		FavoritesCount: row.FavoritesCount,
		CreatedAt:      row.CreatedAt,
		AuthorUsername: row.AuthorUsername,
		AuthorImage:    nullStr(row.AuthorImage),
	}
}

func previewFromFeed(row db.ListFeedArticlesRow) ArticlePreview {
	return ArticlePreview{
		ID:             row.ID,
		Title:          row.Title,
		Description:    row.Description,
		Slug:           row.Slug,
		FavoritesCount: row.FavoritesCount,
		CreatedAt:      row.CreatedAt,
		AuthorUsername: row.AuthorUsername,
		AuthorImage:    nullStr(row.AuthorImage),
	}
}

func previewFromAuthor(row db.ListArticlesByAuthorRow) ArticlePreview {
	return ArticlePreview{
		ID:             row.ID,
		Title:          row.Title,
		Description:    row.Description,
		Slug:           row.Slug,
		FavoritesCount: row.FavoritesCount,
		CreatedAt:      row.CreatedAt,
		AuthorUsername: row.AuthorUsername,
		AuthorImage:    nullStr(row.AuthorImage),
	}
}

func previewFromFavorited(row db.ListArticlesFavoritedByRow) ArticlePreview {
	return ArticlePreview{
		ID:             row.ID,
		Title:          row.Title,
		Description:    row.Description,
		Slug:           row.Slug,
		FavoritesCount: row.FavoritesCount,
		CreatedAt:      row.CreatedAt,
		AuthorUsername: row.AuthorUsername,
		AuthorImage:    nullStr(row.AuthorImage),
	}
}

func nullStr(ns sql.NullString) string {
	if ns.Valid {
		return ns.String
	}
	return ""
}

func parseTags(raw string) []string {
	parts := strings.FieldsFunc(raw, func(r rune) bool {
		return r == ',' || r == ' ' || r == '\n' || r == '\t'
	})
	seen := map[string]struct{}{}
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(strings.ToLower(p))
		if p == "" {
			continue
		}
		if _, ok := seen[p]; ok {
			continue
		}
		seen[p] = struct{}{}
		out = append(out, p)
	}
	return out
}

func (s *Server) uniqueSlug(ctx context.Context, title string, excludeID int64) (string, error) {
	base := slug.From(title)
	candidate := base
	for i := 2; ; i++ {
		exists, err := s.Q.ArticleSlugExists(ctx, db.ArticleSlugExistsParams{
			Slug: candidate,
			ID:   excludeID,
		})
		if err != nil {
			return "", err
		}
		if exists == 0 {
			return candidate, nil
		}
		candidate = base + "-" + itoa(i)
	}
}

func itoa(n int) string {
	const digits = "0123456789"
	if n == 0 {
		return "0"
	}
	var b [20]byte
	i := len(b)
	for n > 0 {
		i--
		b[i] = digits[n%10]
		n /= 10
	}
	return string(b[i:])
}

func (s *Server) syncTags(ctx context.Context, q *db.Queries, articleID int64, tags []string) error {
	if err := q.ClearArticleTags(ctx, articleID); err != nil {
		return err
	}
	for _, name := range tags {
		tag, err := q.GetOrCreateTag(ctx, name)
		if err != nil {
			return err
		}
		if err := q.AddArticleTag(ctx, db.AddArticleTagParams{
			ArticleID: articleID,
			TagID:     tag.ID,
		}); err != nil {
			return err
		}
	}
	return nil
}

func (s *Server) markFavorited(ctx context.Context, viewerID int64, previews []ArticlePreview) ([]ArticlePreview, error) {
	if viewerID == 0 {
		return previews, nil
	}
	for i := range previews {
		fav, err := s.Q.IsFavorited(ctx, db.IsFavoritedParams{
			UserID:    viewerID,
			ArticleID: previews[i].ID,
		})
		if err != nil {
			return nil, err
		}
		previews[i].Favorited = fav != 0
		previews[i].Compact = true
	}
	return previews, nil
}

func stampCSRF(previews []ArticlePreview, csrf string) []ArticlePreview {
	for i := range previews {
		previews[i].CSRF = csrf
		previews[i].Compact = true
	}
	return previews
}
