<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    public function edit(Request $request): Response
    {
        return Inertia::render('Settings/Edit', [
            'user' => $request->user()->toInertia(),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $user = $request->user();
        $this->authorize('update', $user);

        $validated = $request->validate([
            'username' => [
                'required',
                'string',
                'max:50',
                'regex:/^[A-Za-z0-9_]+$/',
                Rule::unique('users', 'username')->ignore($user->id),
            ],
            'email' => [
                'required',
                'string',
                'lowercase',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
            'bio' => ['nullable', 'string'],
            'image' => ['nullable', 'string', 'url', 'max:255'],
            'password' => ['nullable', 'string', Password::defaults()],
        ]);

        $user->fill([
            'username' => $validated['username'],
            'email' => $validated['email'],
            'bio' => $validated['bio'] ?? null,
            'image' => $validated['image'] ?? null,
        ]);

        if (! empty($validated['password'])) {
            $user->password = $validated['password'];
        }

        $user->save();

        return redirect()->route('settings.edit')->with('success', 'Settings updated.');
    }
}
