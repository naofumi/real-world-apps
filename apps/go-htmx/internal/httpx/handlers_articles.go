package httpx

import (
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/naofumi/real-world-apps/apps/go-htmx/internal/auth"
	"github.com/naofumi/real-world-apps/apps/go-htmx/internal/db"
)

func (s *Server) ArticleNewForm(w http.ResponseWriter, r *http.Request) {
	s.R.HTML(w, r, "article_form", "New Article — Conduit", map[string]any{
		"Article": map[string]string{},
		"Tags":    "",
		"Errors":  []string{},
		"Action":  "/articles",
		"IsNew":   true,
	})
}

func (s *Server) ArticleCreate(w http.ResponseWriter, r *http.Request) {
	v := auth.ViewerFrom(r.Context())
	title := strings.TrimSpace(r.FormValue("title"))
	description := strings.TrimSpace(r.FormValue("description"))
	body := strings.TrimSpace(r.FormValue("body"))
	tags := parseTags(r.FormValue("tagList"))
	var errs []string
	if title == "" {
		errs = append(errs, "title can't be blank")
	}
	if description == "" {
		errs = append(errs, "description can't be blank")
	}
	if body == "" {
		errs = append(errs, "body can't be blank")
	}
	if len(errs) > 0 {
		s.R.HTML(w, r, "article_form", "New Article — Conduit", map[string]any{
			"Article": map[string]string{"Title": title, "Description": description, "Body": body},
			"Tags":    r.FormValue("tagList"),
			"Errors":  errs,
			"Action":  "/articles",
			"IsNew":   true,
		})
		return
	}
	slugVal, err := s.uniqueSlug(r.Context(), title, 0)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	tx, err := s.DB.BeginTx(r.Context(), nil)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()
	q := s.Q.WithTx(tx)
	art, err := q.CreateArticle(r.Context(), db.CreateArticleParams{
		UserID:      v.ID,
		Title:       title,
		Description: description,
		Body:        body,
		Slug:        slugVal,
	})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if err := s.syncTags(r.Context(), q, art.ID, tags); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if err := tx.Commit(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	http.Redirect(w, r, "/articles/"+art.Slug, http.StatusSeeOther)
}

func (s *Server) ArticleShow(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	slugParam := chi.URLParam(r, "slug")
	row, err := s.Q.GetArticleBySlug(ctx, slugParam)
	if err != nil {
		http.Error(w, "article not found", http.StatusNotFound)
		return
	}
	tags, _ := s.Q.ListTagsForArticle(ctx, row.ID)
	detail := ArticleDetail{
		ID:             row.ID,
		UserID:         row.UserID,
		Title:          row.Title,
		Description:    row.Description,
		Body:           row.Body,
		Slug:           row.Slug,
		FavoritesCount: row.FavoritesCount,
		CreatedAt:      row.CreatedAt,
		UpdatedAt:      row.UpdatedAt,
		AuthorUsername: row.AuthorUsername,
		AuthorBio:      nullStr(row.AuthorBio),
		AuthorImage:    nullStr(row.AuthorImage),
		Tags:           tags,
	}
	viewer := auth.ViewerFrom(ctx)
	if viewer != nil {
		fav, _ := s.Q.IsFavorited(ctx, db.IsFavoritedParams{UserID: viewer.ID, ArticleID: row.ID})
		fol, _ := s.Q.IsFollowing(ctx, db.IsFollowingParams{FollowerID: viewer.ID, FollowedID: row.UserID})
		detail.Favorited = fav != 0
		detail.Following = fol != 0
	}
	commentsRows, _ := s.Q.ListCommentsForArticle(ctx, row.ID)
	type commentView struct {
		ID             int64
		Body           string
		CreatedAt      string
		UserID         int64
		AuthorUsername string
		AuthorImage    string
	}
	comments := make([]commentView, 0, len(commentsRows))
	for _, c := range commentsRows {
		comments = append(comments, commentView{
			ID: c.ID, Body: c.Body, CreatedAt: c.CreatedAt, UserID: c.UserID,
			AuthorUsername: c.AuthorUsername, AuthorImage: nullStr(c.AuthorImage),
		})
	}
	csrf := auth.CSRFFrom(ctx)
	s.R.HTML(w, r, "article_show", row.Title+" — Conduit", map[string]any{
		"Article":  detail,
		"Comments": comments,
		"CSRF":     csrf,
		"IsOwner":  viewer != nil && viewer.ID == row.UserID,
		"Favorite": map[string]any{
			"Slug": detail.Slug, "Title": detail.Title,
			"FavoritesCount": detail.FavoritesCount, "Favorited": detail.Favorited,
			"CSRF": csrf, "Compact": false,
		},
		"Follow": map[string]any{
			"Username": detail.AuthorUsername, "Following": detail.Following, "CSRF": csrf,
		},
	})
}

func (s *Server) ArticleEditForm(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	v := auth.ViewerFrom(ctx)
	row, err := s.Q.GetArticleBySlug(ctx, chi.URLParam(r, "slug"))
	if err != nil || row.UserID != v.ID {
		http.Error(w, "forbidden", http.StatusForbidden)
		return
	}
	tags, _ := s.Q.ListTagsForArticle(ctx, row.ID)
	s.R.HTML(w, r, "article_form", "Edit Article — Conduit", map[string]any{
		"Article": map[string]string{
			"Title":       row.Title,
			"Description": row.Description,
			"Body":        row.Body,
			"Slug":        row.Slug,
		},
		"Tags":   strings.Join(tags, " "),
		"Errors": []string{},
		"Action": "/articles/" + row.Slug,
		"IsNew":  false,
	})
}

func (s *Server) ArticleUpdate(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	v := auth.ViewerFrom(ctx)
	row, err := s.Q.GetArticleBySlug(ctx, chi.URLParam(r, "slug"))
	if err != nil || row.UserID != v.ID {
		http.Error(w, "forbidden", http.StatusForbidden)
		return
	}
	title := strings.TrimSpace(r.FormValue("title"))
	description := strings.TrimSpace(r.FormValue("description"))
	body := strings.TrimSpace(r.FormValue("body"))
	tags := parseTags(r.FormValue("tagList"))
	slugVal, err := s.uniqueSlug(ctx, title, row.ID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	tx, err := s.DB.BeginTx(ctx, nil)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()
	q := s.Q.WithTx(tx)
	art, err := q.UpdateArticle(ctx, db.UpdateArticleParams{
		Title:       title,
		Description: description,
		Body:        body,
		Slug:        slugVal,
		ID:          row.ID,
	})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if err := s.syncTags(ctx, q, art.ID, tags); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if err := tx.Commit(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	http.Redirect(w, r, "/articles/"+art.Slug, http.StatusSeeOther)
}

func (s *Server) ArticleDelete(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	v := auth.ViewerFrom(ctx)
	row, err := s.Q.GetArticleBySlug(ctx, chi.URLParam(r, "slug"))
	if err != nil || row.UserID != v.ID {
		http.Error(w, "forbidden", http.StatusForbidden)
		return
	}
	_ = s.Q.DeleteArticle(ctx, row.ID)
	http.Redirect(w, r, "/", http.StatusSeeOther)
}

func (s *Server) FavoriteCreate(w http.ResponseWriter, r *http.Request) {
	s.toggleFavorite(w, r, true)
}

func (s *Server) FavoriteDestroy(w http.ResponseWriter, r *http.Request) {
	s.toggleFavorite(w, r, false)
}

func (s *Server) toggleFavorite(w http.ResponseWriter, r *http.Request, favorite bool) {
	ctx := r.Context()
	v := auth.ViewerFrom(ctx)
	row, err := s.Q.GetArticleBySlug(ctx, chi.URLParam(r, "slug"))
	if err != nil {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}
	tx, err := s.DB.BeginTx(ctx, nil)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()
	q := s.Q.WithTx(tx)
	if favorite {
		n, err := q.InsertFavorite(ctx, db.InsertFavoriteParams{UserID: v.ID, ArticleID: row.ID})
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		if n > 0 {
			_ = q.IncrementFavoritesCount(ctx, row.ID)
		}
	} else {
		n, err := q.DeleteFavorite(ctx, db.DeleteFavoriteParams{UserID: v.ID, ArticleID: row.ID})
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		if n > 0 {
			_ = q.DecrementFavoritesCount(ctx, row.ID)
		}
	}
	if err := tx.Commit(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	updated, _ := s.Q.GetArticleBySlug(ctx, row.Slug)
	fav := favorite
	if !favorite {
		fav = false
	} else {
		fav = true
	}
	data := map[string]any{
		"Slug":           updated.Slug,
		"Title":          updated.Title,
		"FavoritesCount": updated.FavoritesCount,
		"Favorited":      fav,
		"CSRF":           auth.CSRFFrom(ctx),
		"Compact":        r.URL.Query().Get("compact") == "1" || r.FormValue("compact") == "1",
	}
	if r.Header.Get("HX-Request") == "true" {
		s.R.Partial(w, "favorite_button", data)
		return
	}
	http.Redirect(w, r, "/articles/"+updated.Slug, http.StatusSeeOther)
}

func (s *Server) CommentCreate(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	v := auth.ViewerFrom(ctx)
	row, err := s.Q.GetArticleBySlug(ctx, chi.URLParam(r, "slug"))
	if err != nil {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}
	body := strings.TrimSpace(r.FormValue("body"))
	if body == "" {
		http.Redirect(w, r, "/articles/"+row.Slug, http.StatusSeeOther)
		return
	}
	_, err = s.Q.CreateComment(ctx, db.CreateCommentParams{
		ArticleID: row.ID,
		UserID:    v.ID,
		Body:      body,
	})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	http.Redirect(w, r, "/articles/"+row.Slug, http.StatusSeeOther)
}

func (s *Server) CommentDelete(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	v := auth.ViewerFrom(ctx)
	idStr := chi.URLParam(r, "id")
	var id int64
	for _, ch := range idStr {
		if ch < '0' || ch > '9' {
			http.Error(w, "bad id", http.StatusBadRequest)
			return
		}
		id = id*10 + int64(ch-'0')
	}
	c, err := s.Q.GetCommentByID(ctx, id)
	if err != nil {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}
	if c.UserID != v.ID {
		http.Error(w, "forbidden", http.StatusForbidden)
		return
	}
	art, err := s.Q.GetArticlePreviewByID(ctx, c.ArticleID)
	if err != nil {
		_ = s.Q.DeleteComment(ctx, id)
		http.Redirect(w, r, "/", http.StatusSeeOther)
		return
	}
	_ = s.Q.DeleteComment(ctx, id)
	http.Redirect(w, r, "/articles/"+art.Slug, http.StatusSeeOther)
}
