<?php

use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\ProfileController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware('auth')->group(function () {
    Route::redirect('configuracoes', '/configuracoes/perfil');

    Route::get('configuracoes/perfil', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('configuracoes/perfil', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('configuracoes/perfil/foto', [ProfileController::class, 'removePhoto'])->name('profile.photo.remove');
    Route::delete('configuracoes/perfil', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('configuracoes/senha', [PasswordController::class, 'edit'])->name('password.edit');
    Route::put('configuracoes/senha', [PasswordController::class, 'update'])->name('password.update');

    Route::get('configuracoes/aparencia', function () {
        return Inertia::render('settings/appearance');
    })->name('appearance');
});
