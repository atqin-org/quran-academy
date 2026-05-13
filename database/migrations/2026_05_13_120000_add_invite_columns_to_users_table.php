<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('password')->nullable()->change();
            $table->enum('status', ['pending', 'active'])->default('active')->after('email_verified_at');
            $table->boolean('must_change_password')->default(false)->after('status');
            $table->timestamp('invited_at')->nullable()->after('must_change_password');
            $table->timestamp('password_set_at')->nullable()->after('invited_at');
        });

        DB::table('users')->update(['must_change_password' => true]);
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['status', 'must_change_password', 'invited_at', 'password_set_at']);
            $table->string('password')->nullable(false)->change();
        });
    }
};
