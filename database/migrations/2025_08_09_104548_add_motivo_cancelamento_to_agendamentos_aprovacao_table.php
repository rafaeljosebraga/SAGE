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
        Schema::table('agendamentos_aprovacao', function (Blueprint $table) {
            $table->text('motivo_cancelamento')->nullable()->after('motivo_rejeicao');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('agendamentos_aprovacao', function (Blueprint $table) {
            $table->dropColumn('motivo_cancelamento');
        });
    }
};
