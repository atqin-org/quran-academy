<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('personnel_invite_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->json('value')->nullable();
            $table->timestamps();
        });

        DB::table('personnel_invite_settings')->insert([
            'key' => 'delivery_channel',
            'value' => json_encode('both'),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('personnel_invite_settings');
    }
};
