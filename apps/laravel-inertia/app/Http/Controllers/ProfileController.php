<?php

namespace App\Http\Controllers;

use App\Models\Article;
use App\Models\User;
use App\Support\Pagination;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function show(User $user): Response
    {
        return $this->renderProfile($user, 'articles');
    }

    public function favorites(User $user): Response
    {
        return $this->renderProfile($user, 'favorites');
    }

    protected function renderProfile(User $user, string $tab): Response
    {
        $viewer = Auth::user();

        $query = $tab === 'favorites'
            ? $user->favoriteArticles()->recent()->with(['user', 'tags'])
            : $user->articles()->recent()->with(['user', 'tags']);

        $articles = $query->paginate(10)->withQueryString();

        return Inertia::render('Profiles/Show', [
            'profile' => [
                ...$user->toPublicInertia(),
                'following' => $viewer?->following($user) ?? false,
                'isSelf' => $viewer?->is($user) ?? false,
            ],
            'tab' => $tab,
            'articles' => Pagination::toInertia(
                $articles,
                fn (Article $article) => $article->toFeedInertia($viewer),
            ),
        ]);
    }
}
