<?php

namespace Database\Seeders;

use App\Models\Article;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $alice = User::query()->create([
            'username' => 'alice',
            'email' => 'alice@example.com',
            'password' => 'password',
            'bio' => 'I write about Laravel.',
        ]);
        $bob = User::query()->create([
            'username' => 'bob',
            'email' => 'bob@example.com',
            'password' => 'password',
            'bio' => 'Dragons, mostly.',
            'image' => 'https://i.pravatar.cc/150?u=bob',
        ]);
        $cara = User::query()->create([
            'username' => 'cara',
            'email' => 'cara@example.com',
            'password' => 'password',
            'bio' => 'Notes from the editor.',
        ]);

        $alice->follow($bob);
        $bob->follow($cara);
        $cara->follow($alice);

        $posts = [
            [$alice, 'A vanilla Laravel stack', 'Inertia pages, cookie sessions, and Policies.', "Laravel already includes the pieces this blog needs.\n\n- Inertia + React for the UI\n- SQLite for the database\n- **CommonMark** for article text", 'laravel, inertia'],
            [$bob, 'How to train your dragon', 'Ever wonder how?', "You have to believe.\n\nDragons respond to patience, meat, and a calm voice.", 'dragons, training'],
            [$cara, 'Editing is a second draft', 'What to cut before you publish.', 'Leave the explanation that the reader can infer.', 'writing'],
            [$alice, 'Pagination without a gem', 'Ten articles per page is enough.', 'Offset and limit cover a blog feed.', 'laravel'],
            [$bob, 'Favorite buttons', 'A heart, a count, and a join table.', 'Favoriting is a create and a destroy. The count lives on the article.', 'laravel, dragons'],
            [$cara, 'Comments stay plain text', 'Markdown is for the article.', 'Comments are short. Escaping them is the whole security story.', 'writing'],
            [$alice, 'Following people', 'Your feed is the articles of people you follow.', 'You cannot follow yourself. The button is hidden on your own profile.', 'laravel, inertia'],
            [$bob, 'Slugs follow the title', 'Rename the article and the URL changes.', 'Duplicate titles get a numeric suffix. The old address 404s.', 'laravel'],
            [$cara, 'A smiley for a missing face', 'Profile images are URLs.', 'An empty image shows the default avatar.', 'writing'],
            [$alice, 'Password reset is built in', 'Breeze already sends the email.', 'Settings can change the password too. A blank password field leaves the current one alone.', 'laravel'],
            [$bob, 'Global feed', 'Newest articles first.', 'Tag filters narrow the same list.', 'dragons'],
            [$cara, 'One more for page two', 'This is here so the home page paginates.', 'Page size is 10.', 'writing'],
        ];

        foreach ($posts as $index => [$author, $title, $description, $body, $tags]) {
            /** @var User $author */
            $article = $author->articles()->make([
                'title' => $title,
                'description' => $description,
                'body' => $body,
            ]);
            $article->tag_list = $tags;
            $article->save();
            $article->forceFill([
                'created_at' => now()->subDays($index),
                'updated_at' => now()->subDays($index),
            ])->save();
        }

        $dragon = Article::query()->where('slug', 'how-to-train-your-dragon')->firstOrFail();
        $dragon->comments()->create(['user_id' => $alice->id, 'body' => 'His name was my name too.']);
        $dragon->comments()->create(['user_id' => $cara->id, 'body' => 'Patience, then meat.']);

        $alice->favorites()->create(['article_id' => $dragon->id]);
        $dragon->increment('favorites_count');

        $rails = Article::query()->where('slug', 'a-vanilla-laravel-stack')->firstOrFail();
        $bob->favorites()->create(['article_id' => $rails->id]);
        $rails->increment('favorites_count');
    }
}
