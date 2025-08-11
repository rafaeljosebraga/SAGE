<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'perfil_acesso',
        'profile_photo',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array
     */
    protected $appends = [
        'profile_photo_url',
        'perfil_acesso_name',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Verifica se o usuário é diretor geral
     */
    public function isDiretorGeral(): bool
    {
        return $this->perfil_acesso === 'diretor_geral';
    }

    /**
     * Verifica se o usuário é administrador
     */
    public function isAdministrador(): bool
    {
        return $this->perfil_acesso === 'administrador';
    }

    /**
     * Verifica se o usuário tem permissão para gerenciar usuários
     */
    public function canManageUsers(): bool
    {
        return $this->perfil_acesso === 'administrador';
    }

    /**
     * Retorna o nome formatado do perfil de acesso do usuário
     */
    public function getPerfilAcessoNameAttribute(): string
    {
        return match ($this->perfil_acesso) {
            'administrador' => 'Administrador',
            'diretor_geral' => 'Diretor Geral',
            'coordenador' => 'Coordenador',
            'servidores' => 'Servidores',
            default => 'Servidores'
        };
    }

    public function espacos()
    {
        return $this->belongsToMany(Espaco::class, 'espaco_user')
            ->withPivot('created_by', 'updated_by')
            ->withTimestamps();
    }

    /**
     * Retorna a URL da foto de perfil do usuário
     */
    public function getProfilePhotoUrlAttribute(): ?string
    {
        if ($this->profile_photo) {
            return asset('storage/' . $this->profile_photo);
        }
        
        return null;
    }
}
