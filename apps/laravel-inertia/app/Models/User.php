<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;

#[Fillable(['username', 'email', 'password', 'bio', 'image'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (User $user): void {
            if ($user->email !== null) {
                $user->email = Str::lower(trim($user->email));
            }
            if ($user->username !== null) {
                $user->username = trim($user->username);
            }
        });
    }

    public function getRouteKeyName(): string
    {
        return 'username';
    }

    public function articles(): HasMany
    {
        return $this->hasMany(Article::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    public function favorites(): HasMany
    {
        return $this->hasMany(Favorite::class);
    }

    public function favoriteArticles(): BelongsToMany
    {
        return $this->belongsToMany(Article::class, 'favorites')->withTimestamps();
    }

    public function follows(): HasMany
    {
        return $this->hasMany(Follow::class, 'follower_id');
    }

    public function followedUsers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'follows', 'follower_id', 'followed_id')->withTimestamps();
    }

    public function followers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'follows', 'followed_id', 'follower_id')->withTimestamps();
    }

    public function follow(User $user): void
    {
        if ($user->is($this)) {
            return;
        }

        $this->followedUsers()->syncWithoutDetaching([$user->id]);
    }

    public function unfollow(User $user): void
    {
        $this->followedUsers()->detach($user->id);
    }

    public function following(?User $user): bool
    {
        if ($user === null || $user->is($this)) {
            return false;
        }

        return $this->follows()->where('followed_id', $user->id)->exists();
    }

    public function toInertia(): array
    {
        return [
            'id' => $this->id,
            'username' => $this->username,
            'email' => $this->email,
            'bio' => $this->bio,
            'image' => $this->image,
        ];
    }

    public function toPublicInertia(): array
    {
        return [
            'username' => $this->username,
            'bio' => $this->bio,
            'image' => $this->image,
        ];
    }
}
