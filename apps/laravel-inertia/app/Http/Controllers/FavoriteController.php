<?php

namespace App\Http\Controllers;

use App\Models\Article;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FavoriteController extends Controller
{
    public function store(Request $request, Article $article): RedirectResponse
    {
        $user = $request->user();

        DB::transaction(function () use ($user, $article): void {
            $created = $user->favorites()->firstOrCreate(['article_id' => $article->id]);
            if ($created->wasRecentlyCreated) {
                $article->increment('favorites_count');
            }
        });

        return back();
    }

    public function destroy(Request $request, Article $article): RedirectResponse
    {
        $user = $request->user();

        DB::transaction(function () use ($user, $article): void {
            $deleted = $user->favorites()->where('article_id', $article->id)->delete();
            if ($deleted > 0) {
                $article->decrement('favorites_count');
            }
        });

        return back();
    }
}
