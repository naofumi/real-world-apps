<?php

namespace Tests\Feature;

use App\Models\Article;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ArticleTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_can_view_global_feed(): void
    {
        $author = User::factory()->create();
        $article = $author->articles()->make([
            'title' => 'Hello World',
            'description' => 'Desc',
            'body' => 'Body',
        ]);
        $article->tag_list = 'laravel';
        $article->save();

        $this->get('/')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Articles/Index')
                ->has('articles.data', 1)
                ->where('articles.data.0.slug', 'hello-world'));
    }

    public function test_author_can_create_and_update_article(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->post('/articles', [
                'title' => 'My Post',
                'description' => 'About it',
                'body' => 'Longer body',
                'tagList' => 'php, laravel',
            ])
            ->assertRedirect('/articles/my-post');

        $article = Article::query()->where('slug', 'my-post')->firstOrFail();
        $this->assertSame(['laravel', 'php'], $article->tags()->orderBy('name')->pluck('name')->all());

        $this->actingAs($user)
            ->put("/articles/{$article->slug}", [
                'title' => 'My Post Updated',
                'description' => 'About it',
                'body' => 'Updated body',
                'tagList' => 'laravel',
            ])
            ->assertRedirect('/articles/my-post-updated');
    }

    public function test_non_author_cannot_edit_article(): void
    {
        $author = User::factory()->create();
        $other = User::factory()->create();
        $article = $author->articles()->create([
            'title' => 'Owned',
            'description' => 'Desc',
            'body' => 'Body',
        ]);

        $this->actingAs($other)
            ->get("/editor/{$article->slug}")
            ->assertForbidden();
    }
}
