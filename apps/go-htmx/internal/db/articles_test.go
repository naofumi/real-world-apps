package db_test

import (
	"context"
	"database/sql"
	"path/filepath"
	"testing"

	"github.com/naofumi/real-world-apps/apps/go-htmx/internal/auth"
	"github.com/naofumi/real-world-apps/apps/go-htmx/internal/db"
)

func openTestDB(t *testing.T) (*sql.DB, *db.Queries) {
	t.Helper()
	migrations := filepath.Join("..", "..", "sql", "migrations")
	// unique shared-memory name per test
	name := "file:test-" + t.Name() + "?mode=memory&cache=shared"
	sqlDB, err := sql.Open("sqlite", name)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = sqlDB.Close() })
	sqlDB.SetMaxOpenConns(1)
	if _, err := sqlDB.Exec(`PRAGMA foreign_keys = ON`); err != nil {
		t.Fatal(err)
	}
	if err := migrate(sqlDB, migrations); err != nil {
		t.Fatal(err)
	}
	return sqlDB, db.New(sqlDB)
}

func migrate(sqlDB *sql.DB, dir string) error {
	return db.GooseUp(sqlDB, dir)
}

func TestFavoriteIncrementsCount(t *testing.T) {
	ctx := context.Background()
	sqlDB, q := openTestDB(t)
	hash, _ := auth.HashPassword("password")
	u, err := q.CreateUser(ctx, db.CreateUserParams{
		Email: "a@example.com", Username: "alice", PasswordHash: hash,
	})
	if err != nil {
		t.Fatal(err)
	}
	art, err := q.CreateArticle(ctx, db.CreateArticleParams{
		UserID: u.ID, Title: "T", Description: "D", Body: "B", Slug: "t",
	})
	if err != nil {
		t.Fatal(err)
	}
	n, err := q.InsertFavorite(ctx, db.InsertFavoriteParams{UserID: u.ID, ArticleID: art.ID})
	if err != nil || n != 1 {
		t.Fatalf("insert favorite: n=%d err=%v", n, err)
	}
	if err := q.IncrementFavoritesCount(ctx, art.ID); err != nil {
		t.Fatal(err)
	}
	got, err := q.GetArticleBySlug(ctx, "t")
	if err != nil {
		t.Fatal(err)
	}
	if got.FavoritesCount != 1 {
		t.Fatalf("favorites_count=%d", got.FavoritesCount)
	}
	_ = sqlDB
}

func TestFeedListsFollowedAuthors(t *testing.T) {
	ctx := context.Background()
	_, q := openTestDB(t)
	hash, _ := auth.HashPassword("password")
	alice, _ := q.CreateUser(ctx, db.CreateUserParams{Email: "a@example.com", Username: "alice", PasswordHash: hash})
	bob, _ := q.CreateUser(ctx, db.CreateUserParams{Email: "b@example.com", Username: "bob", PasswordHash: hash})
	_, _ = q.CreateArticle(ctx, db.CreateArticleParams{
		UserID: alice.ID, Title: "From Alice", Description: "d", Body: "b", Slug: "from-alice",
	})
	_, _ = q.CreateArticle(ctx, db.CreateArticleParams{
		UserID: bob.ID, Title: "From Bob", Description: "d", Body: "b", Slug: "from-bob",
	})
	_ = q.InsertFollow(ctx, db.InsertFollowParams{FollowerID: bob.ID, FollowedID: alice.ID})

	rows, err := q.ListFeedArticles(ctx, db.ListFeedArticlesParams{FollowerID: bob.ID, Limit: 10, Offset: 0})
	if err != nil {
		t.Fatal(err)
	}
	if len(rows) != 1 || rows[0].Slug != "from-alice" {
		t.Fatalf("feed=%+v", rows)
	}
}
