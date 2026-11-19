<?php

use App\Http\Controllers\ArticleController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\FavoriteController;
use App\Http\Controllers\FeedController;
use App\Http\Controllers\FollowController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SettingsController;
use Illuminate\Support\Facades\Route;

Route::get('/', [ArticleController::class, 'index'])->name('home');
Route::get('/articles', [ArticleController::class, 'index'])->name('articles.index');
Route::get('/articles/{article}', [ArticleController::class, 'show'])->name('articles.show');

Route::middleware('auth')->group(function () {
    Route::get('/feed', [FeedController::class, 'show'])->name('feed');

    Route::get('/editor', [ArticleController::class, 'create'])->name('articles.create');
    Route::post('/articles', [ArticleController::class, 'store'])->name('articles.store');
    Route::get('/editor/{article}', [ArticleController::class, 'edit'])->name('articles.edit');
    Route::put('/articles/{article}', [ArticleController::class, 'update'])->name('articles.update');
    Route::delete('/articles/{article}', [ArticleController::class, 'destroy'])->name('articles.destroy');

    Route::post('/articles/{article}/comments', [CommentController::class, 'store'])->name('comments.store');
    Route::delete('/articles/{article}/comments/{comment}', [CommentController::class, 'destroy'])->name('comments.destroy');

    Route::post('/articles/{article}/favorite', [FavoriteController::class, 'store'])->name('favorites.store');
    Route::delete('/articles/{article}/favorite', [FavoriteController::class, 'destroy'])->name('favorites.destroy');

    Route::get('/settings', [SettingsController::class, 'edit'])->name('settings.edit');
    Route::put('/settings', [SettingsController::class, 'update'])->name('settings.update');
    Route::post('/settings/logout', [SettingsController::class, 'destroy'])->name('settings.logout');

    Route::post('/users/{user}/follow', [FollowController::class, 'store'])->name('follows.store');
    Route::delete('/users/{user}/follow', [FollowController::class, 'destroy'])->name('follows.destroy');
});

Route::get('/users/{user}', [ProfileController::class, 'show'])->name('profiles.show');
Route::get('/users/{user}/favorites', [ProfileController::class, 'favorites'])->name('profiles.favorites');

require __DIR__.'/auth.php';
