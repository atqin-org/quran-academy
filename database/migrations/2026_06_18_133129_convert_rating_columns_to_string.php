<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Drop the enum/CHECK constraint on the rating columns so new rating values
     * (e.g. "great", "not_memorized") can be stored without a schema change.
     * Allowed values are enforced at the application layer (FormRequest + Action).
     *
     * Done via a temp-column swap so it works on both MySQL (prod) and SQLite
     * (tests) without requiring doctrine/dbal.
     */
    public function up(): void
    {
        Schema::table('repetitions', function (Blueprint $table) {
            $table->string('overall_rating_new')->nullable();
        });
        DB::statement('UPDATE repetitions SET overall_rating_new = overall_rating');
        Schema::table('repetitions', function (Blueprint $table) {
            $table->dropColumn('overall_rating');
        });
        Schema::table('repetitions', function (Blueprint $table) {
            $table->renameColumn('overall_rating_new', 'overall_rating');
        });

        Schema::table('attendances', function (Blueprint $table) {
            $table->string('memorization_rating_new')->nullable();
        });
        DB::statement('UPDATE attendances SET memorization_rating_new = memorization_rating');
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropColumn('memorization_rating');
        });
        Schema::table('attendances', function (Blueprint $table) {
            $table->renameColumn('memorization_rating_new', 'memorization_rating');
        });
    }

    /**
     * Restore the original enum('good','mid','bad') columns, mapping the new
     * values down to the closest legacy value first.
     */
    public function down(): void
    {
        DB::table('repetitions')->where('overall_rating', 'great')->update(['overall_rating' => 'good']);
        DB::table('repetitions')->where('overall_rating', 'not_memorized')->update(['overall_rating' => 'bad']);
        DB::table('attendances')->where('memorization_rating', 'great')->update(['memorization_rating' => 'good']);
        DB::table('attendances')->where('memorization_rating', 'not_memorized')->update(['memorization_rating' => 'bad']);

        Schema::table('repetitions', function (Blueprint $table) {
            $table->enum('overall_rating_old', ['good', 'mid', 'bad'])->nullable();
        });
        DB::statement('UPDATE repetitions SET overall_rating_old = overall_rating');
        Schema::table('repetitions', function (Blueprint $table) {
            $table->dropColumn('overall_rating');
        });
        Schema::table('repetitions', function (Blueprint $table) {
            $table->renameColumn('overall_rating_old', 'overall_rating');
        });

        Schema::table('attendances', function (Blueprint $table) {
            $table->enum('memorization_rating_old', ['good', 'mid', 'bad'])->nullable();
        });
        DB::statement('UPDATE attendances SET memorization_rating_old = memorization_rating');
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropColumn('memorization_rating');
        });
        Schema::table('attendances', function (Blueprint $table) {
            $table->renameColumn('memorization_rating_old', 'memorization_rating');
        });
    }
};
