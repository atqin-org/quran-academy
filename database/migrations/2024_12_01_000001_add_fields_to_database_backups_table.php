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
        Schema::table('database_backups', function (Blueprint $table) {
            $table->bigInteger('size')->nullable()->after('path');
            $table->string('type')->default('manual')->after('size'); // manual, scheduled
            $table->boolean('is_scheduled')->default(false)->after('type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('database_backups', function (Blueprint $table) {
            $table->dropColumn(['size', 'type', 'is_scheduled']);
        });
    }
};
