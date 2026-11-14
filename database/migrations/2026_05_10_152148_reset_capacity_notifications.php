<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * One-shot purge of capacity notifications stored with absolute manage_url.
     * The next scheduled scan re-creates them with relative URLs.
     */
    public function up(): void
    {
        if (Schema::hasTable('notifications')) {
            DB::table('notifications')
                ->where('type', 'class_over_capacity')
                ->delete();
        }
    }

    public function down(): void
    {
        // No reverse — purge cannot be reconstructed.
    }
};
