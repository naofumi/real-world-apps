package config

import (
	"os"
	"path/filepath"
)

type Config struct {
	Addr           string
	DatabasePath   string
	MigrationsDir  string
	TemplatesDir   string
	StaticDir      string
}

func Load(appRoot string) Config {
	dbPath := envOr("APP_DATABASE_PATH", filepath.Join(appRoot, "storage", "conduit.sqlite3"))
	return Config{
		Addr:          envOr("APP_ADDR", "127.0.0.1:8090"),
		DatabasePath:  dbPath,
		MigrationsDir: filepath.Join(appRoot, "sql", "migrations"),
		TemplatesDir:  filepath.Join(appRoot, "templates"),
		StaticDir:     filepath.Join(appRoot, "static"),
	}
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
