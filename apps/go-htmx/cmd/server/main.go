package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"

	"github.com/naofumi/real-world-apps/apps/go-htmx/internal/config"
	"github.com/naofumi/real-world-apps/apps/go-htmx/internal/db"
	"github.com/naofumi/real-world-apps/apps/go-htmx/internal/httpx"
)

func main() {
	appRoot := findAppRoot()
	cfg := config.Load(appRoot)

	sqlDB, err := db.Open(cfg.DatabasePath, cfg.MigrationsDir)
	if err != nil {
		log.Fatalf("db: %v", err)
	}
	defer sqlDB.Close()

	srv := httpx.NewServer(sqlDB, cfg)
	log.Printf("conduit go-htmx listening on http://%s (db=%s)", cfg.Addr, cfg.DatabasePath)
	if err := http.ListenAndServe(cfg.Addr, srv.Router()); err != nil {
		log.Fatal(err)
	}
}

func findAppRoot() string {
	if v := os.Getenv("APP_ROOT"); v != "" {
		return v
	}
	wd, err := os.Getwd()
	if err != nil {
		return "."
	}
	// allow running from repo root or apps/go-htmx
	if _, err := os.Stat(filepath.Join(wd, "sql", "migrations")); err == nil {
		return wd
	}
	if _, err := os.Stat(filepath.Join(wd, "apps", "go-htmx", "sql", "migrations")); err == nil {
		return filepath.Join(wd, "apps", "go-htmx")
	}
	return wd
}
