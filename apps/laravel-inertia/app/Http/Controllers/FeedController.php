<?php

namespace App\Http\Controllers;

use App\Models\Article;
use App\Models\Tag;
use App\Support\Pagination;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class FeedController extends Controller
{
    public function show(Request $request): Response
    {
        $viewer = Auth::user();

        $articles = Article::query()
            ->fromFollowedBy($viewer)
            ->recent()
            ->with(['user', 'tags'])
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Articles/Index', [
            'mode' => 'feed',
            'tag' => null,
            'tags' => Tag::popular(),
            'articles' => Pagination::toInertia(
                $articles,
                fn (Article $article) => $article->toFeedInertia($viewer),
            ),
        ]);
    }
}
