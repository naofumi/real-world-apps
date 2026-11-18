package db

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/pressly/goose/v3"
	_ "modernc.org/sqlite"
)

// Open opens (or creates) a SQLite database, enables foreign keys, and runs goose migrations.
func Open(path string, migrationsDir string) (*sql.DB, error) {
	dsn := path
	switch {
	case path == ":memory:":
		dsn = "file:conduit?mode=memory&cache=shared"
	case strings.HasPrefix(path, "file:") && strings.Contains(path, "mode=memory"):
		// already a shared in-memory DSN
	default:
		if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
			return nil, fmt.Errorf("create db dir: %w", err)
		}
	}

	sqlDB, err := sql.Open("sqlite", dsn)
	if err != nil {
		return nil, err
	}
	sqlDB.SetMaxOpenConns(1)

	if _, err := sqlDB.Exec(`PRAGMA foreign_keys = ON`); err != nil {
		_ = sqlDB.Close()
		return nil, err
	}

	if migrationsDir != "" {
		if err := GooseUp(sqlDB, migrationsDir); err != nil {
			_ = sqlDB.Close()
			return nil, err
		}
	}

	return sqlDB, nil
}

// GooseUp applies SQL migrations from dir.
func GooseUp(sqlDB *sql.DB, migrationsDir string) error {
	if err := goose.SetDialect("sqlite3"); err != nil {
		return err
	}
	if err := goose.Up(sqlDB, migrationsDir); err != nil {
		return fmt.Errorf("migrate: %w", err)
	}
	return nil
}
