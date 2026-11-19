package slug

import (
	"regexp"
	"strings"
	"unicode"
)

var nonSlug = regexp.MustCompile(`[^a-z0-9]+`)

// From turns a title into a URL slug (lowercase, hyphenated).
func From(title string) string {
	s := strings.ToLower(strings.TrimSpace(title))
	var b strings.Builder
	for _, r := range s {
		if unicode.IsLetter(r) || unicode.IsDigit(r) || r == ' ' || r == '-' {
			b.WriteRune(r)
		}
	}
	s = nonSlug.ReplaceAllString(b.String(), "-")
	s = strings.Trim(s, "-")
	if s == "" {
		return "article"
	}
	return s
}
