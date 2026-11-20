<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SocialTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_favorite_and_follow(): void
    {
        $alice = User::factory()->create(['username' => 'alice']);
        $bob = User::factory()->create(['username' => 'bob']);
        $article = $bob->articles()->create([
            'title' => 'Dragon Notes',
            'description' => 'Desc',
            'body' => 'Body',
        ]);

        $this->actingAs($alice)
            ->post("/articles/{$article->slug}/favorite")
            ->assertRedirect();

        $this->assertDatabaseHas('favorites', [
            'user_id' => $alice->id,
            'article_id' => $article->id,
        ]);
        $this->assertSame(1, $article->fresh()->favorites_count);

        $this->actingAs($alice)
            ->post("/users/{$bob->username}/follow")
            ->assertRedirect();

        $this->assertTrue($alice->fresh()->following($bob));

        $this->actingAs($alice)
            ->get('/feed')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Articles/Index')
                ->where('mode', 'feed')
                ->has('articles.data', 1));
    }

    public function test_user_can_comment_on_article(): void
    {
        $author = User::factory()->create();
        $commenter = User::factory()->create();
        $article = $author->articles()->create([
            'title' => 'Commentable',
            'description' => 'Desc',
            'body' => 'Body',
        ]);

        $this->actingAs($commenter)
            ->post("/articles/{$article->slug}/comments", [
                'body' => 'Nice post',
            ])
            ->assertRedirect("/articles/{$article->slug}");

        $this->assertDatabaseHas('comments', [
            'article_id' => $article->id,
            'user_id' => $commenter->id,
            'body' => 'Nice post',
        ]);
    }

    public function test_settings_can_be_updated(): void
    {
        $user = User::factory()->create(['username' => 'oldname']);

        $this->actingAs($user)
            ->put('/settings', [
                'username' => 'newname',
                'email' => $user->email,
                'bio' => 'Updated bio',
                'image' => 'https://example.com/avatar.png',
                'password' => '',
            ])
            ->assertRedirect('/settings');

        $this->assertSame('newname', $user->fresh()->username);
        $this->assertSame('Updated bio', $user->fresh()->bio);
    }
}
