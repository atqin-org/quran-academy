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
        Schema::table('club_category_sessions', function (Blueprint $table) {
            $table->unsignedInteger('capacity')->nullable()->after('sessions_per_month');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('club_category_sessions', function (Blueprint $table) {
            $table->dropColumn('capacity');
        });
    }
};
