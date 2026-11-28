APP_ROOT := $(CURDIR)
export APP_ROOT
export PATH := $(shell go env GOPATH)/bin:$(PATH)

.PHONY: sqlc migrate seed run test lint test-e2e tidy

sqlc:
	sqlc generate

migrate:
	go run ./cmd/server -h >/dev/null 2>&1 || true
	@mkdir -p storage
	@# migrations run on server/seed open; this target just ensures DB exists via seed-less open
	go run ./cmd/seed

seed:
	go run ./cmd/seed

run:
	go run ./cmd/server

test:
	go test ./...

lint:
	go vet ./...
	go run github.com/kisielk/errcheck@v1.30.0 -ignore 'database/sql:Close|Rollback,io:Close' ./...

test-e2e:
	npm test

tidy:
	go mod tidy
