<?php

namespace App\Http\Controllers;

use App\Models\Article;
use App\Models\Tag;
use App\Support\Markdown;
use App\Support\Pagination;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ArticleController extends Controller
{
    public function index(Request $request): Response
    {
        $tag = $request->string('tag')->toString() ?: null;

        $query = Article::query()
            ->recent()
            ->with(['user', 'tags']);

        if ($tag) {
            $query->taggedWith($tag);
        }

        $articles = $query->paginate(10)->withQueryString();
        $viewer = Auth::user();

        return Inertia::render('Articles/Index', [
            'mode' => $tag ? 'tag' : 'global',
            'tag' => $tag,
            'tags' => Tag::popular(),
            'articles' => Pagination::toInertia(
                $articles,
                fn (Article $article) => $article->toFeedInertia($viewer),
            ),
        ]);
    }

    public function show(Article $article): Response
    {
        $article->load(['user', 'tags', 'comments.user']);
        $viewer = Auth::user();

        return Inertia::render('Articles/Show', [
            'article' => [
                ...$article->toFeedInertia($viewer),
                'bodyHtml' => Markdown::toHtml($article->body),
                'canEdit' => $viewer ? $viewer->can('update', $article) : false,
                'canDelete' => $viewer ? $viewer->can('delete', $article) : false,
            ],
            'comments' => $article->comments()
                ->oldest()
                ->with('user')
                ->get()
                ->map(fn ($comment) => [
                    ...$comment->toInertia(),
                    'canDelete' => $viewer ? $viewer->can('delete', $comment) : false,
                ])
                ->values(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Articles/Form', [
            'article' => null,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'body' => ['required', 'string'],
            'tagList' => ['nullable', 'string', 'max:255'],
        ]);

        $article = $request->user()->articles()->make([
            'title' => $validated['title'],
            'description' => $validated['description'],
            'body' => $validated['body'],
        ]);
        $article->tag_list = $validated['tagList'] ?? '';
        $article->save();

        return redirect()->route('articles.show', $article)->with('success', 'Article published.');
    }

    public function edit(Article $article): Response
    {
        $this->authorize('update', $article);
        $article->load('tags');

        return Inertia::render('Articles/Form', [
            'article' => [
                'slug' => $article->slug,
                'title' => $article->title,
                'description' => $article->description,
                'body' => $article->body,
                'tagList' => $article->tag_list,
            ],
        ]);
    }

    public function update(Request $request, Article $article): RedirectResponse
    {
        $this->authorize('update', $article);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'body' => ['required', 'string'],
            'tagList' => ['nullable', 'string', 'max:255'],
        ]);

        $article->fill([
            'title' => $validated['title'],
            'description' => $validated['description'],
            'body' => $validated['body'],
        ]);
        $article->tag_list = $validated['tagList'] ?? '';
        $article->save();

        return redirect()->route('articles.show', $article)->with('success', 'Article updated.');
    }

    public function destroy(Article $article): RedirectResponse
    {
        $this->authorize('delete', $article);
        $article->delete();

        return redirect()->route('home')->with('success', 'Article deleted.');
    }
}
