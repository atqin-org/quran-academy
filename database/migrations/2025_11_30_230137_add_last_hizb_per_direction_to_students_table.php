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
        Schema::table('students', function (Blueprint $table) {
            // Track last hizb for each direction separately
            // For ascending: 1→60, stores the highest hizb reached (e.g., 20 means memorized 1-20)
            // For descending: 60→1, stores the lowest hizb reached (e.g., 40 means memorized 60-40)
            $table->unsignedTinyInteger('last_hizb_ascending')->nullable();
            $table->unsignedTinyInteger('last_hizb_descending')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn(['last_hizb_ascending', 'last_hizb_descending']);
        });
    }
};
