<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('backup_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->json('value')->nullable();
            $table->timestamps();
        });

        // Insert default settings
        DB::table('backup_settings')->insert([
            [
                'key' => 'schedule_enabled',
                'value' => json_encode(false),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'schedule_frequency',
                'value' => json_encode('daily'),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'schedule_time',
                'value' => json_encode('02:00'),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'max_backups',
                'value' => json_encode(10),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'retention_days',
                'value' => json_encode(14),
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('backup_settings');
    }
};
