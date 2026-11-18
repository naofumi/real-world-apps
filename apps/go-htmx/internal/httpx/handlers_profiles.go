package httpx

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/naofumi/real-world-apps/apps/go-htmx/internal/auth"
	"github.com/naofumi/real-world-apps/apps/go-htmx/internal/db"
)

func (s *Server) ProfileShow(w http.ResponseWriter, r *http.Request) {
	s.renderProfile(w, r, false)
}

func (s *Server) ProfileFavorites(w http.ResponseWriter, r *http.Request) {
	s.renderProfile(w, r, true)
}

func (s *Server) renderProfile(w http.ResponseWriter, r *http.Request, favoritesTab bool) {
	ctx := r.Context()
	username := chi.URLParam(r, "username")
	user, err := s.Q.GetUserByUsername(ctx, username)
	if err != nil {
		http.Error(w, "profile not found", http.StatusNotFound)
		return
	}
	offset := pageOffset(r)
	var previews []ArticlePreview
	if favoritesTab {
		rows, e := s.Q.ListArticlesFavoritedBy(ctx, db.ListArticlesFavoritedByParams{
			UserID: user.ID,
			Limit:  pageSize,
			Offset: int64(offset),
		})
		if e != nil {
			http.Error(w, e.Error(), http.StatusInternalServerError)
			return
		}
		for _, row := range rows {
			previews = append(previews, previewFromFavorited(row))
		}
	} else {
		rows, e := s.Q.ListArticlesByAuthor(ctx, db.ListArticlesByAuthorParams{
			UserID: user.ID,
			Limit:  pageSize,
			Offset: int64(offset),
		})
		if e != nil {
			http.Error(w, e.Error(), http.StatusInternalServerError)
			return
		}
		for _, row := range rows {
			previews = append(previews, previewFromAuthor(row))
		}
	}
	previews, _ = s.attachTags(ctx, previews)
	viewer := auth.ViewerFrom(ctx)
	csrf := auth.CSRFFrom(ctx)
	following := false
	isSelf := false
	if viewer != nil {
		previews, _ = s.markFavorited(ctx, viewer.ID, previews)
		isSelf = viewer.ID == user.ID
		if !isSelf {
			fol, _ := s.Q.IsFollowing(ctx, db.IsFollowingParams{
				FollowerID: viewer.ID,
				FollowedID: user.ID,
			})
			following = fol != 0
		}
	}
	previews = stampCSRF(previews, csrf)
	s.R.HTML(w, r, "profile", user.Username+" — Conduit", map[string]any{
		"Profile":      user,
		"Articles":     previews,
		"FavoritesTab": favoritesTab,
		"Following":    following,
		"IsSelf":       isSelf,
		"CSRF":         csrf,
	})
}

func (s *Server) FollowCreate(w http.ResponseWriter, r *http.Request) {
	s.toggleFollow(w, r, true)
}

func (s *Server) FollowDestroy(w http.ResponseWriter, r *http.Request) {
	s.toggleFollow(w, r, false)
}

func (s *Server) toggleFollow(w http.ResponseWriter, r *http.Request, follow bool) {
	ctx := r.Context()
	v := auth.ViewerFrom(ctx)
	username := chi.URLParam(r, "username")
	user, err := s.Q.GetUserByUsername(ctx, username)
	if err != nil {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}
	if user.ID == v.ID {
		http.Error(w, "cannot follow yourself", http.StatusBadRequest)
		return
	}
	if follow {
		_ = s.Q.InsertFollow(ctx, db.InsertFollowParams{FollowerID: v.ID, FollowedID: user.ID})
	} else {
		_ = s.Q.DeleteFollow(ctx, db.DeleteFollowParams{FollowerID: v.ID, FollowedID: user.ID})
	}
	data := map[string]any{
		"Username":  user.Username,
		"Following": follow,
		"CSRF":      auth.CSRFFrom(ctx),
	}
	if r.Header.Get("HX-Request") == "true" {
		s.R.Partial(w, "follow_button", data)
		return
	}
	http.Redirect(w, r, "/users/"+user.Username, http.StatusSeeOther)
}
