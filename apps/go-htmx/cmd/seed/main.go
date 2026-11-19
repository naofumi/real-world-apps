package main

import (
	"context"
	"database/sql"
	"log"
	"os"
	"path/filepath"
	"time"

	"github.com/naofumi/real-world-apps/apps/go-htmx/internal/auth"
	"github.com/naofumi/real-world-apps/apps/go-htmx/internal/config"
	"github.com/naofumi/real-world-apps/apps/go-htmx/internal/db"
)

func main() {
	appRoot := findAppRoot()
	cfg := config.Load(appRoot)
	sqlDB, err := db.Open(cfg.DatabasePath, cfg.MigrationsDir)
	if err != nil {
		log.Fatalf("db: %v", err)
	}
	defer sqlDB.Close()

	ctx := context.Background()
	if err := reset(sqlDB); err != nil {
		log.Fatalf("reset: %v", err)
	}
	q := db.New(sqlDB)
	hash, err := auth.HashPassword("password")
	if err != nil {
		log.Fatal(err)
	}

	alice, err := q.CreateUser(ctx, db.CreateUserParams{
		Email: "alice@example.com", Username: "alice", PasswordHash: hash,
		Bio: sql.NullString{String: "Go + HTMX explorer", Valid: true},
	})
	must(err)
	bob, err := q.CreateUser(ctx, db.CreateUserParams{
		Email: "bob@example.com", Username: "bob", PasswordHash: hash,
		Bio: sql.NullString{String: "Writes about feeds", Valid: true},
	})
	must(err)
	cara, err := q.CreateUser(ctx, db.CreateUserParams{
		Email: "cara@example.com", Username: "cara", PasswordHash: hash,
		Bio: sql.NullString{String: "Tags everything", Valid: true},
	})
	must(err)

	a1 := mustArt(q.CreateArticle(ctx, db.CreateArticleParams{
		UserID: alice.ID, Title: "A Go HTMX stack", Description: "chi, sqlc, plain templates.",
		Body: "Resourceful HTML routes with HTMX partials for favorite and follow.\n\nEnough for Conduit.",
		Slug: "a-go-htmx-stack",
	}))
	a2 := mustArt(q.CreateArticle(ctx, db.CreateArticleParams{
		UserID: bob.ID, Title: "Global feed", Description: "Newest articles first.",
		Body: "Tag filters can narrow the same list later.", Slug: "global-feed",
	}))
	a3 := mustArt(q.CreateArticle(ctx, db.CreateArticleParams{
		UserID: cara.ID, Title: "Following people", Description: "Your feed is the articles of people you follow.",
		Body: "You cannot follow yourself. Hide the button on your own profile.", Slug: "following-people",
	}))

	// stamp created_at for stable ordering in demos
	_, _ = sqlDB.Exec(`UPDATE articles SET created_at = ?, updated_at = ? WHERE id = ?`, "2026-11-01 10:00:00", "2026-11-01 10:00:00", a1.ID)
	_, _ = sqlDB.Exec(`UPDATE articles SET created_at = ?, updated_at = ? WHERE id = ?`, "2026-11-02 12:00:00", "2026-11-02 12:00:00", a2.ID)
	_, _ = sqlDB.Exec(`UPDATE articles SET created_at = ?, updated_at = ? WHERE id = ?`, "2026-11-03 09:30:00", "2026-11-03 09:30:00", a3.ID)

	tagGo := mustTag(q.GetOrCreateTag(ctx, "go"))
	tagSQLite := mustTag(q.GetOrCreateTag(ctx, "sqlite"))
	tagDragons := mustTag(q.GetOrCreateTag(ctx, "dragons"))
	_ = q.AddArticleTag(ctx, db.AddArticleTagParams{ArticleID: a1.ID, TagID: tagGo.ID})
	_ = q.AddArticleTag(ctx, db.AddArticleTagParams{ArticleID: a1.ID, TagID: tagSQLite.ID})
	_ = q.AddArticleTag(ctx, db.AddArticleTagParams{ArticleID: a2.ID, TagID: tagDragons.ID})
	_ = q.AddArticleTag(ctx, db.AddArticleTagParams{ArticleID: a3.ID, TagID: tagGo.ID})

	n, _ := q.InsertFavorite(ctx, db.InsertFavoriteParams{UserID: bob.ID, ArticleID: a1.ID})
	if n > 0 {
		_ = q.IncrementFavoritesCount(ctx, a1.ID)
	}
	_ = q.InsertFollow(ctx, db.InsertFollowParams{FollowerID: bob.ID, FollowedID: alice.ID})
	_, _ = q.CreateComment(ctx, db.CreateCommentParams{
		ArticleID: a1.ID, UserID: bob.ID, Body: "Nice stack choice.",
	})

	log.Printf("seeded %s at %s", cfg.DatabasePath, time.Now().Format(time.RFC3339))
	_ = cara
}

func reset(sqlDB *sql.DB) error {
	stmts := []string{
		`DELETE FROM article_tags`, `DELETE FROM tags`, `DELETE FROM favorites`,
		`DELETE FROM comments`, `DELETE FROM articles`, `DELETE FROM follows`,
		`DELETE FROM sessions`, `DELETE FROM users`,
	}
	for _, s := range stmts {
		if _, err := sqlDB.Exec(s); err != nil {
			return err
		}
	}
	return nil
}

func must(err error) {
	if err != nil {
		log.Fatal(err)
	}
}

func mustArt(a db.Article, err error) db.Article {
	must(err)
	return a
}

func mustTag(t db.Tag, err error) db.Tag {
	must(err)
	return t
}

func findAppRoot() string {
	if v := os.Getenv("APP_ROOT"); v != "" {
		return v
	}
	wd, _ := os.Getwd()
	if _, err := os.Stat(filepath.Join(wd, "sql", "migrations")); err == nil {
		return wd
	}
	return wd
}
