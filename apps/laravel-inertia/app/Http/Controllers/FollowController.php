<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class FollowController extends Controller
{
    public function store(Request $request, User $user): RedirectResponse
    {
        $request->user()->follow($user);

        return back();
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        $request->user()->unfollow($user);

        return back();
    }
}
