<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Facades\DB;

class Tag extends Model
{
    protected $fillable = ['name'];

    public function articles(): BelongsToMany
    {
        return $this->belongsToMany(Article::class, 'taggings')->withTimestamps();
    }

    public static function popular(int $limit = 20): array
    {
        return static::query()
            ->select('tags.name', DB::raw('COUNT(taggings.id) as articles_count'))
            ->join('taggings', 'taggings.tag_id', '=', 'tags.id')
            ->groupBy('tags.id', 'tags.name')
            ->orderByDesc('articles_count')
            ->orderBy('tags.name')
            ->limit($limit)
            ->pluck('name')
            ->all();
    }
}
