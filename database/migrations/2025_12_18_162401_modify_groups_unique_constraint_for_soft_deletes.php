<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Modify unique constraint to allow reusing deleted group names.
     * The new constraint includes deleted_at so that:
     * - Active groups (deleted_at = NULL) have unique names per club+category
     * - Deleted groups can have names that are reused by new active groups
     */
    public function up(): void
    {
        Schema::table('groups', function (Blueprint $table) {
            // Drop the existing unique constraint
            $table->dropUnique(['club_id', 'category_id', 'name']);

            // Add new unique constraint that includes deleted_at
            // This allows reusing names of soft-deleted groups
            $table->unique(['club_id', 'category_id', 'name', 'deleted_at'], 'groups_unique_active_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('groups', function (Blueprint $table) {
            $table->dropUnique('groups_unique_active_name');
            $table->unique(['club_id', 'category_id', 'name']);
        });
    }
};
