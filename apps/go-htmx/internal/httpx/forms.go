package httpx

import (
	"net/http"
	"strings"
)

const minPasswordLen = 8

type articleForm struct {
	Title       string
	Description string
	Body        string
	TagList     string
}

func parseArticleForm(r *http.Request) articleForm {
	return articleForm{
		Title:       strings.TrimSpace(r.FormValue("title")),
		Description: strings.TrimSpace(r.FormValue("description")),
		Body:        strings.TrimSpace(r.FormValue("body")),
		TagList:     strings.TrimSpace(r.FormValue("tagList")),
	}
}

func (f articleForm) errors() []string {
	var errs []string
	if f.Title == "" {
		errs = append(errs, "title can't be blank")
	}
	if f.Description == "" {
		errs = append(errs, "description can't be blank")
	}
	if f.Body == "" {
		errs = append(errs, "body can't be blank")
	}
	return errs
}

// tags splits the tag field on commas and whitespace, lowercased and deduplicated.
func (f articleForm) tags() []string {
	parts := strings.FieldsFunc(f.TagList, func(r rune) bool {
		return r == ',' || r == ' ' || r == '\n' || r == '\t'
	})
	seen := map[string]bool{}
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		p = strings.ToLower(p)
		if !seen[p] {
			seen[p] = true
			out = append(out, p)
		}
	}
	return out
}

type registerForm struct {
	Username string
	Email    string
	Password string
}

func parseRegisterForm(r *http.Request) registerForm {
	return registerForm{
		Username: strings.TrimSpace(r.FormValue("username")),
		Email:    strings.TrimSpace(r.FormValue("email")),
		Password: r.FormValue("password"),
	}
}

func (f registerForm) errors() []string {
	var errs []string
	if f.Username == "" {
		errs = append(errs, "username can't be blank")
	}
	if f.Email == "" {
		errs = append(errs, "email can't be blank")
	}
	if len(f.Password) < minPasswordLen {
		errs = append(errs, "password is too short (minimum is 8 characters)")
	}
	return errs
}

type settingsForm struct {
	Email    string
	Username string
	Bio      string
	Image    string
	Password string
}

func parseSettingsForm(r *http.Request) settingsForm {
	return settingsForm{
		Email:    strings.TrimSpace(r.FormValue("email")),
		Username: strings.TrimSpace(r.FormValue("username")),
		Bio:      strings.TrimSpace(r.FormValue("bio")),
		Image:    strings.TrimSpace(r.FormValue("image")),
		Password: r.FormValue("password"),
	}
}

// errors allows an empty password, which keeps the current one.
func (f settingsForm) errors() []string {
	var errs []string
	if f.Username == "" {
		errs = append(errs, "username can't be blank")
	}
	if f.Email == "" {
		errs = append(errs, "email can't be blank")
	}
	if f.Password != "" && len(f.Password) < minPasswordLen {
		errs = append(errs, "password is too short (minimum is 8 characters)")
	}
	return errs
}
