<?php

namespace App\Http\Controllers;

use App\Models\Article;
use App\Models\Comment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    public function store(Request $request, Article $article): RedirectResponse
    {
        $validated = $request->validate([
            'body' => ['required', 'string'],
        ]);

        $article->comments()->create([
            'user_id' => $request->user()->id,
            'body' => $validated['body'],
        ]);

        return redirect()->route('articles.show', $article);
    }

    public function destroy(Article $article, Comment $comment): RedirectResponse
    {
        abort_unless($comment->article_id === $article->id, 404);
        $this->authorize('delete', $comment);
        $comment->delete();

        return redirect()->route('articles.show', $article);
    }
}
