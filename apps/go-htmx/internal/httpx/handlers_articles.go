package httpx

import (
	"context"
	"net/http"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/naofumi/real-world-apps/apps/go-htmx/internal/auth"
	"github.com/naofumi/real-world-apps/apps/go-htmx/internal/db"
	"github.com/naofumi/real-world-apps/apps/go-htmx/internal/slug"
)

func (s *Server) ArticleNewForm(w http.ResponseWriter, r *http.Request) error {
	return s.renderArticleForm(w, r, articleForm{}, nil, "")
}

func (s *Server) ArticleCreate(w http.ResponseWriter, r *http.Request) error {
	ctx := r.Context()
	f := parseArticleForm(r)
	if errs := f.errors(); len(errs) > 0 {
		return s.renderArticleForm(w, r, f, errs, "")
	}
	slugVal, err := s.uniqueSlug(ctx, f.Title, 0)
	if err != nil {
		return err
	}
	err = s.inTx(ctx, func(q *db.Queries) error {
		art, err := q.CreateArticle(ctx, db.CreateArticleParams{
			UserID:      auth.ViewerFrom(ctx).ID,
			Title:       f.Title,
			Description: f.Description,
			Body:        f.Body,
			Slug:        slugVal,
		})
		if err != nil {
			return err
		}
		return syncTags(ctx, q, art.ID, f.tags())
	})
	if err != nil {
		return err
	}
	return redirect(w, r, "/articles/"+slugVal)
}

func (s *Server) ArticleShow(w http.ResponseWriter, r *http.Request) error {
	ctx := r.Context()
	art, err := s.articleBySlug(r)
	if err != nil {
		return err
	}
	tags, err := s.Q.ListTagsForArticle(ctx, art.ID)
	if err != nil {
		return err
	}
	comments, err := s.Q.ListCommentsForArticle(ctx, art.ID)
	if err != nil {
		return err
	}

	var favorited, following bool
	v := auth.ViewerFrom(ctx)
	if v != nil {
		fav, err := s.Q.IsFavorited(ctx, db.IsFavoritedParams{UserID: v.ID, ArticleID: art.ID})
		if err != nil {
			return err
		}
		fol, err := s.Q.IsFollowing(ctx, db.IsFollowingParams{FollowerID: v.ID, FollowedID: art.UserID})
		if err != nil {
			return err
		}
		favorited, following = fav != 0, fol != 0
	}

	csrf := auth.CSRFFrom(ctx)
	return s.R.HTML(w, r, "article_show", art.Title+" — Conduit", articleShowView{
		Article:  art,
		Tags:     tags,
		Comments: comments,
		IsOwner:  v != nil && v.ID == art.UserID,
		Favorite: newFavoriteButton(art, favorited, csrf),
		Follow:   followButton{Username: art.AuthorUsername, Following: following, CSRF: csrf},
	})
}

func (s *Server) ArticleEditForm(w http.ResponseWriter, r *http.Request) error {
	art, err := s.ownedArticle(r)
	if err != nil {
		return err
	}
	tags, err := s.Q.ListTagsForArticle(r.Context(), art.ID)
	if err != nil {
		return err
	}
	f := articleForm{
		Title:       art.Title,
		Description: art.Description,
		Body:        art.Body,
		TagList:     strings.Join(tags, " "),
	}
	return s.renderArticleForm(w, r, f, nil, art.Slug)
}

func (s *Server) ArticleUpdate(w http.ResponseWriter, r *http.Request) error {
	ctx := r.Context()
	art, err := s.ownedArticle(r)
	if err != nil {
		return err
	}
	f := parseArticleForm(r)
	if errs := f.errors(); len(errs) > 0 {
		return s.renderArticleForm(w, r, f, errs, art.Slug)
	}
	slugVal, err := s.uniqueSlug(ctx, f.Title, art.ID)
	if err != nil {
		return err
	}
	err = s.inTx(ctx, func(q *db.Queries) error {
		_, err := q.UpdateArticle(ctx, db.UpdateArticleParams{
			Title:       f.Title,
			Description: f.Description,
			Body:        f.Body,
			Slug:        slugVal,
			ID:          art.ID,
		})
		if err != nil {
			return err
		}
		return syncTags(ctx, q, art.ID, f.tags())
	})
	if err != nil {
		return err
	}
	return redirect(w, r, "/articles/"+slugVal)
}

func (s *Server) ArticleDelete(w http.ResponseWriter, r *http.Request) error {
	art, err := s.ownedArticle(r)
	if err != nil {
		return err
	}
	if err := s.Q.DeleteArticle(r.Context(), art.ID); err != nil {
		return err
	}
	return redirect(w, r, "/")
}

func (s *Server) FavoriteCreate(w http.ResponseWriter, r *http.Request) error {
	return s.toggleFavorite(w, r, true)
}

func (s *Server) FavoriteDestroy(w http.ResponseWriter, r *http.Request) error {
	return s.toggleFavorite(w, r, false)
}

func (s *Server) toggleFavorite(w http.ResponseWriter, r *http.Request, favorite bool) error {
	ctx := r.Context()
	art, err := s.articleBySlug(r)
	if err != nil {
		return err
	}
	userID := auth.ViewerFrom(ctx).ID
	err = s.inTx(ctx, func(q *db.Queries) error {
		if favorite {
			n, err := q.InsertFavorite(ctx, db.InsertFavoriteParams{UserID: userID, ArticleID: art.ID})
			if err != nil || n == 0 {
				return err
			}
			return q.IncrementFavoritesCount(ctx, art.ID)
		}
		n, err := q.DeleteFavorite(ctx, db.DeleteFavoriteParams{UserID: userID, ArticleID: art.ID})
		if err != nil || n == 0 {
			return err
		}
		return q.DecrementFavoritesCount(ctx, art.ID)
	})
	if err != nil {
		return err
	}
	if !isHTMX(r) {
		return redirect(w, r, "/articles/"+art.Slug)
	}

	updated, err := s.Q.GetArticleBySlug(ctx, art.Slug)
	if err != nil {
		return err
	}
	button := newFavoriteButton(updated, favorite, auth.CSRFFrom(ctx))
	button.Compact = r.FormValue("compact") == "1"
	return s.R.Partial(w, "favorite_button", button)
}

func (s *Server) CommentCreate(w http.ResponseWriter, r *http.Request) error {
	ctx := r.Context()
	art, err := s.articleBySlug(r)
	if err != nil {
		return err
	}
	if body := strings.TrimSpace(r.FormValue("body")); body != "" {
		_, err := s.Q.CreateComment(ctx, db.CreateCommentParams{
			ArticleID: art.ID,
			UserID:    auth.ViewerFrom(ctx).ID,
			Body:      body,
		})
		if err != nil {
			return err
		}
	}
	return redirect(w, r, "/articles/"+art.Slug)
}

func (s *Server) CommentDelete(w http.ResponseWriter, r *http.Request) error {
	ctx := r.Context()
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		return badRequest("bad comment id")
	}
	c, err := s.Q.GetCommentByID(ctx, id)
	if err != nil {
		return orNotFound(err, "comment")
	}
	if c.UserID != auth.ViewerFrom(ctx).ID {
		return errForbidden
	}
	articleSlug, err := s.Q.GetArticleSlugByID(ctx, c.ArticleID)
	if err != nil {
		return err
	}
	if err := s.Q.DeleteComment(ctx, id); err != nil {
		return err
	}
	return redirect(w, r, "/articles/"+articleSlug)
}

func (s *Server) articleBySlug(r *http.Request) (db.GetArticleBySlugRow, error) {
	art, err := s.Q.GetArticleBySlug(r.Context(), chi.URLParam(r, "slug"))
	return art, orNotFound(err, "article")
}

// ownedArticle is articleBySlug restricted to the signed-in author.
func (s *Server) ownedArticle(r *http.Request) (db.GetArticleBySlugRow, error) {
	art, err := s.articleBySlug(r)
	if err != nil {
		return art, err
	}
	if art.UserID != auth.ViewerFrom(r.Context()).ID {
		return art, errForbidden
	}
	return art, nil
}

// renderArticleForm shows the editor; an empty articleSlug means a new article.
func (s *Server) renderArticleForm(w http.ResponseWriter, r *http.Request, f articleForm, errs []string, articleSlug string) error {
	view := articleFormView{Form: f, Errors: errs, Action: "/articles", IsNew: articleSlug == ""}
	title := "New Article — Conduit"
	if !view.IsNew {
		view.Action = "/articles/" + articleSlug
		title = "Edit Article — Conduit"
	}
	return s.R.HTML(w, r, "article_form", title, view)
}

// uniqueSlug derives a slug from title, appending -2, -3, ... until no other
// article (excluding excludeID) uses it.
func (s *Server) uniqueSlug(ctx context.Context, title string, excludeID int64) (string, error) {
	base := slug.From(title)
	candidate := base
	for i := 2; ; i++ {
		exists, err := s.Q.ArticleSlugExists(ctx, db.ArticleSlugExistsParams{Slug: candidate, ID: excludeID})
		if err != nil {
			return "", err
		}
		if exists == 0 {
			return candidate, nil
		}
		candidate = base + "-" + strconv.Itoa(i)
	}
}

func syncTags(ctx context.Context, q *db.Queries, articleID int64, tags []string) error {
	if err := q.ClearArticleTags(ctx, articleID); err != nil {
		return err
	}
	for _, name := range tags {
		tag, err := q.GetOrCreateTag(ctx, name)
		if err != nil {
			return err
		}
		if err := q.AddArticleTag(ctx, db.AddArticleTagParams{ArticleID: articleID, TagID: tag.ID}); err != nil {
			return err
		}
	}
	return nil
}
