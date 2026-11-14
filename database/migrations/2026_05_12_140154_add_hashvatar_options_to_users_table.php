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
        Schema::table('users', function (Blueprint $table) {
            $table->string('hashvatar_mode', 10)->nullable();
            $table->boolean('hashvatar_animated')->nullable();
            $table->string('hashvatar_tones', 32)->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'hashvatar_mode',
                'hashvatar_animated',
                'hashvatar_tones',
            ]);
        });
    }
};
