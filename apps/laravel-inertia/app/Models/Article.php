<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Article extends Model
{
    protected $fillable = [
        'title',
        'description',
        'body',
        'slug',
        'favorites_count',
    ];

    protected $casts = [
        'favorites_count' => 'integer',
    ];

    protected ?string $pendingTagList = null;

    protected static function booted(): void
    {
        static::saving(function (Article $article): void {
            if ($article->title && ($article->isDirty('title') || blank($article->slug))) {
                $article->slug = $article->uniqueSlugFromTitle($article->title);
            }
        });

        static::saved(function (Article $article): void {
            if ($article->pendingTagList !== null) {
                $article->syncTags($article->pendingTagList);
                $article->pendingTagList = null;
            }
        });
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class, 'taggings')->withTimestamps();
    }

    public function favorites(): HasMany
    {
        return $this->hasMany(Favorite::class);
    }

    public function favoriters(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'favorites')->withTimestamps();
    }

    public function scopeRecent(Builder $query): Builder
    {
        return $query->orderByDesc('created_at');
    }

    public function scopeTaggedWith(Builder $query, string $name): Builder
    {
        $tag = Tag::query()->where('name', Str::lower(trim($name)))->first();

        if (! $tag) {
            return $query->whereRaw('0 = 1');
        }

        return $query->whereHas('tags', fn (Builder $q) => $q->where('tags.id', $tag->id));
    }

    public function scopeFromFollowedBy(Builder $query, User $user): Builder
    {
        return $query->whereIn(
            'user_id',
            Follow::query()->where('follower_id', $user->id)->select('followed_id')
        );
    }

    public function authoredBy(?User $author): bool
    {
        return $author !== null && $this->user_id === $author->id;
    }

    public function favoritedBy(?User $user): bool
    {
        if ($user === null) {
            return false;
        }

        return $this->favorites()->where('user_id', $user->id)->exists();
    }

    public function getTagListAttribute(): string
    {
        if ($this->pendingTagList !== null) {
            return $this->pendingTagList;
        }

        return $this->tags->pluck('name')->implode(', ');
    }

    public function setTagListAttribute(?string $value): void
    {
        $this->pendingTagList = (string) $value;
    }

    public function syncTags(string $tagList): void
    {
        $names = collect(explode(',', $tagList))
            ->map(fn (string $name) => Str::lower(trim($name)))
            ->filter()
            ->unique()
            ->values();

        $ids = $names->map(function (string $name) {
            return Tag::query()->firstOrCreate(['name' => $name])->id;
        });

        $this->tags()->sync($ids->all());
    }

    protected function uniqueSlugFromTitle(string $title): string
    {
        $base = Str::slug($title) ?: 'article';
        $candidate = $base;
        $suffix = 2;

        while (
            static::query()
                ->where('slug', $candidate)
                ->when($this->exists, fn (Builder $q) => $q->whereKeyNot($this->id))
                ->exists()
        ) {
            $candidate = "{$base}-{$suffix}";
            $suffix++;
        }

        return $candidate;
    }

    public function toFeedInertia(?User $viewer = null): array
    {
        return [
            'slug' => $this->slug,
            'title' => $this->title,
            'description' => $this->description,
            'createdAt' => $this->created_at?->toIso8601String(),
            'favoritesCount' => $this->favorites_count,
            'favorited' => $this->favoritedBy($viewer),
            'tagList' => $this->tags->pluck('name')->values()->all(),
            'author' => $this->user->toPublicInertia(),
        ];
    }
}
