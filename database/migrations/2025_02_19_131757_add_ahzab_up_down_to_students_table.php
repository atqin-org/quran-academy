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
            $table->integer('ahzab')->default(0)->change();

            $table->integer('ahzab_up')->default(0)->after('ahzab');
            $table->integer('ahzab_down')->default(0)->after('ahzab_up');
            // add an is_active column
            $table->boolean('is_active')->default(1)->after('ahzab_down');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->string('ahzab')->default(0)->change();
            $table->dropColumn(['ahzab_up', 'ahzab_down']);
            $table->dropColumn('is_active');
        });
    }
};
