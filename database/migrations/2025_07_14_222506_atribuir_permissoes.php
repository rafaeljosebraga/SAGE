<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('espaco_user', function (Blueprint $table) {
            $table->foreignId("espaco_id")
                ->constrained("espacos")
                ->onDelete("cascade");
            $table->foreignId("user_id")
                ->constrained("users")
                ->onDelete("cascade");
            $table->primary(['espaco_id', 'user_id']); // composite key
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('espaco_permissao');
    }
};
