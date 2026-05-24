<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->enum('memorization_rating', ['good', 'mid', 'bad'])->nullable()->after('thoman_id');
            $table->text('memorization_remark')->nullable()->after('memorization_rating');
        });
    }

    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropColumn(['memorization_rating', 'memorization_remark']);
        });
    }
};
