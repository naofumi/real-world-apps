package httpx

import "github.com/naofumi/real-world-apps/apps/go-htmx/internal/db"

// View structs are the .Content of each page template. Field names are what
// the templates read, so renaming one means editing the matching template.

type homeView struct {
	Mode     string // "global", "tag" or "feed"
	Tag      string
	Articles []articlePreview
	Tags     []string
}

type articleShowView struct {
	Article  db.GetArticleBySlugRow
	Tags     []string
	Comments []db.ListCommentsForArticleRow
	IsOwner  bool
	Favorite favoriteButton
	Follow   followButton
}

type articleFormView struct {
	Form   articleForm
	Errors []string
	Action string
	IsNew  bool
}

type profileView struct {
	Profile      db.User
	Articles     []articlePreview
	FavoritesTab bool
	IsSelf       bool
	Follow       followButton
}

// authView backs both the login and register pages.
type authView struct {
	Username string
	Email    string
	Errors   []string
}

type settingsView struct {
	User   db.User
	Errors []string
}

type favoriteButton struct {
	Slug           string
	Title          string
	FavoritesCount int64
	Favorited      bool
	CSRF           string
	Compact        bool
}

func newFavoriteButton(a db.GetArticleBySlugRow, favorited bool, csrf string) favoriteButton {
	return favoriteButton{
		Slug:           a.Slug,
		Title:          a.Title,
		FavoritesCount: a.FavoritesCount,
		Favorited:      favorited,
		CSRF:           csrf,
	}
}

type followButton struct {
	Username  string
	Following bool
	CSRF      string
}
