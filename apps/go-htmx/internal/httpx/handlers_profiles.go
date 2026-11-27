package httpx

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/naofumi/real-world-apps/apps/go-htmx/internal/auth"
	"github.com/naofumi/real-world-apps/apps/go-htmx/internal/db"
)

func (s *Server) ProfileShow(w http.ResponseWriter, r *http.Request) error {
	return s.renderProfile(w, r, false)
}

func (s *Server) ProfileFavorites(w http.ResponseWriter, r *http.Request) error {
	return s.renderProfile(w, r, true)
}

func (s *Server) renderProfile(w http.ResponseWriter, r *http.Request, favoritesTab bool) error {
	ctx := r.Context()
	user, err := s.Q.GetUserByUsername(ctx, chi.URLParam(r, "username"))
	if err != nil {
		return orNotFound(err, "profile")
	}

	var rows []db.ArticlePreview
	if favoritesTab {
		rows, err = s.Q.ListArticlesFavoritedBy(ctx, db.ListArticlesFavoritedByParams{UserID: user.ID, Limit: pageSize, Offset: pageOffset(r)})
	} else {
		rows, err = s.Q.ListArticlesByAuthor(ctx, db.ListArticlesByAuthorParams{UserID: user.ID, Limit: pageSize, Offset: pageOffset(r)})
	}
	if err != nil {
		return err
	}
	previews, err := s.previews(ctx, rows)
	if err != nil {
		return err
	}

	var following bool
	v := auth.ViewerFrom(ctx)
	isSelf := v != nil && v.ID == user.ID
	if v != nil && !isSelf {
		fol, err := s.Q.IsFollowing(ctx, db.IsFollowingParams{FollowerID: v.ID, FollowedID: user.ID})
		if err != nil {
			return err
		}
		following = fol != 0
	}

	return s.R.HTML(w, r, "profile", user.Username+" — Conduit", profileView{
		Profile:      user,
		Articles:     previews,
		FavoritesTab: favoritesTab,
		IsSelf:       isSelf,
		Follow:       followButton{Username: user.Username, Following: following, CSRF: auth.CSRFFrom(ctx)},
	})
}

func (s *Server) FollowCreate(w http.ResponseWriter, r *http.Request) error {
	return s.toggleFollow(w, r, true)
}

func (s *Server) FollowDestroy(w http.ResponseWriter, r *http.Request) error {
	return s.toggleFollow(w, r, false)
}

func (s *Server) toggleFollow(w http.ResponseWriter, r *http.Request, follow bool) error {
	ctx := r.Context()
	user, err := s.Q.GetUserByUsername(ctx, chi.URLParam(r, "username"))
	if err != nil {
		return orNotFound(err, "profile")
	}
	viewerID := auth.ViewerFrom(ctx).ID
	if user.ID == viewerID {
		return badRequest("cannot follow yourself")
	}
	if follow {
		err = s.Q.InsertFollow(ctx, db.InsertFollowParams{FollowerID: viewerID, FollowedID: user.ID})
	} else {
		err = s.Q.DeleteFollow(ctx, db.DeleteFollowParams{FollowerID: viewerID, FollowedID: user.ID})
	}
	if err != nil {
		return err
	}
	if !isHTMX(r) {
		return redirect(w, r, "/users/"+user.Username)
	}
	return s.R.Partial(w, "follow_button", followButton{Username: user.Username, Following: follow, CSRF: auth.CSRFFrom(ctx)})
}
