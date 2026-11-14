<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('repetitions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')->constrained('program_sessions')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->foreignId('hizb_id')->constrained('ahzab')->restrictOnDelete();
            $table->foreignId('tester_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('tester_student_id')->nullable()->constrained('students')->nullOnDelete();
            $table->enum('overall_rating', ['good', 'mid', 'bad'])->nullable();
            $table->text('remark')->nullable();
            $table->timestamps();

            $table->index(['session_id', 'student_id']);
            $table->index(['student_id', 'hizb_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('repetitions');
    }
};
