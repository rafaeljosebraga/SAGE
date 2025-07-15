<?php

use App\Http\Controllers\UserController;
use App\Http\Controllers\EspacoController;
use App\Http\Controllers\LocalizacaoController;
use App\Http\Controllers\RecursoController;
use App\Http\Controllers\EspacoUserController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return redirect()->route('login');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    // Rotas para gerenciar usuários (APENAS para usuários com permissão de administrador)
    Route::middleware(['can-manage-users'])->group(function () {
        Route::resource('users', UserController::class)->except(['show']);
    });

    // Rotas para gerenciamento de espaços, localizações e recursos (APENAS Diretor Geral)
    Route::middleware(['diretor-geral'])->group(function () {
        Route::resource('espacos', EspacoController::class);
        Route::resource('localizacoes', LocalizacaoController::class);
        Route::resource('recursos', RecursoController::class);
        Route::resource('espaco-users', EspacoUserController::class);
        Route::get('atribuir-permissoes', [EspacoUserController::class, 'index'])->name('atribuir-permissoes.index');
    });
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
