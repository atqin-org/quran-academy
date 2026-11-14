<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('repetition_thumns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('repetition_id')->constrained('repetitions')->cascadeOnDelete();
            $table->foreignId('thoman_id')->constrained('athman')->restrictOnDelete();
            $table->enum('result', ['good', 'bad']);
            $table->unsignedSmallInteger('mistakes_count')->nullable();
            $table->text('note')->nullable();
            $table->timestamps();

            $table->unique(['repetition_id', 'thoman_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('repetition_thumns');
    }
};
