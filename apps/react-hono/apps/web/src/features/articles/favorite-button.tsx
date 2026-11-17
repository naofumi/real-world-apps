import type { Article, ArticleCard } from "@conduit/contracts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { api, type ArticleList } from "../../lib/client.js";
import { loginLocationState } from "../../lib/login-state.js";

type ArticleQueryData = { article: Article };

function toggle(article: ArticleCard | Article, favorited: boolean) {
  const delta = favorited === article.favorited ? 0 : favorited ? 1 : -1;
  return {
    ...article,
    favorited,
    favoritesCount: Math.max(0, article.favoritesCount + delta),
  };
}

export function FavoriteButton({
  slug,
  favorited,
  favoritesCount,
  canFavorite,
  variant,
}: Pick<ArticleCard, "slug" | "favorited" | "favoritesCount"> & {
  canFavorite: boolean;
  variant: "preview" | "detail";
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => (favorited ? api.unfavorite(slug) : api.favorite(slug)),
    onSuccess: ({ article }) => {
      queryClient.setQueryData<ArticleQueryData>(["article", slug], { article });
      queryClient.setQueriesData<ArticleList>({ queryKey: ["articles"] }, (current) => {
        if (!current) return current;
        return {
          ...current,
          articles: current.articles.map((item) => (item.slug === slug ? toggle(item, article.favorited) : item)),
        };
      });
    },
  });

  function onClick() {
    if (!canFavorite) {
      navigate("/login", { state: loginLocationState(location.pathname, location.search) });
      return;
    }
    mutation.mutate();
  }

  const className = `btn btn-sm ${favorited ? "btn-primary" : "btn-outline-primary"}${variant === "preview" ? " pull-xs-right" : ""}`;
  return (
    <button type="button" className={className} onClick={onClick} disabled={mutation.isPending} aria-pressed={favorited}>
      <i className="ion-heart" />
      {variant === "detail" ? (
        <>
          &nbsp; {favorited ? "Unfavorite" : "Favorite"} Article <span className="counter">({favoritesCount})</span>
        </>
      ) : (
        <> {favoritesCount}</>
      )}
    </button>
  );
}
