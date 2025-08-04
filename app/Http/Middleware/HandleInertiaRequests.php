<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $request->user() ? (function() use ($request) {
                    $freshUser = $request->user()->fresh();
                    
                    return [
                        'id' => $freshUser->id,
                        'name' => $freshUser->name,
                        'email' => $freshUser->email,
                        'perfil_acesso' => $freshUser->perfil_acesso,
                        'profile_photo' => $freshUser->profile_photo,
                        'avatar' => $freshUser->profile_photo ? asset('storage/' . $freshUser->profile_photo . '?v=' . strtotime($freshUser->updated_at)) : null,
                        'email_verified_at' => $freshUser->email_verified_at,
                        'created_at' => $freshUser->created_at,
                        'updated_at' => $freshUser->updated_at,
                    ];
                })() : null,
            ],
            'ziggy' => fn (): array => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }
}