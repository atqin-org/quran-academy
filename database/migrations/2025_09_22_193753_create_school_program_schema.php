<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // جدول المواد
        Schema::create('subjects', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->timestamps();
        });

        // جدول البرامج
        Schema::create('programs', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->foreignId('subject_id')->constrained('subjects')->onDelete('cascade');
            $table->foreignId('club_id')->constrained('clubs')->onDelete('cascade');
            $table->foreignId('category_id')->constrained('categories')->onDelete('cascade');
            $table->unsignedBigInteger('section_id')->nullable(); // ضع جدول sections إذا كان موجود
            $table->date('start_date');
            $table->date('end_date');
            $table->json('days_of_week'); // مثال: ["Mon","Wed","Fri"]
            $table->timestamps();
        });

        // جدول الحصص الخاص بالبرنامج (program_sessions)
        Schema::create('program_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('program_id')->constrained('programs')->onDelete('cascade');
            $table->date('session_date');
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();
            // add status 
            $table->enum('status', ['scheduled', 'completed', 'canceled'])->default('scheduled');
            $table->timestamps();
        });

        // جدول الأحزاب
        Schema::create('ahzab', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('number');   // رقم الحزب (1..60)
            $table->string('start')->nullable(); // بداية الحزب (مرجع نصي فقط)
            $table->timestamps();
        });

        // جدول الأثمان
        Schema::create('athman', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hizb_id')->constrained('ahzab')->onDelete('cascade');
            $table->unsignedTinyInteger('number'); // من 1 إلى 8
            $table->string('start')->nullable();   // بداية الثمن (مرجع نصي فقط)
            $table->timestamps();
        });

        // جدول الحضور والغياب
        Schema::create('attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')->constrained('program_sessions')->onDelete('cascade');
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->enum('status', ['present', 'absent', 'excused'])->default('absent');
            $table->string('excusedReason')->nullable();

            // ربط بالحزب والثمن
            $table->foreignId('hizb_id')->nullable()->constrained('ahzab')->onDelete('set null');
            $table->foreignId('thoman_id')->nullable()->constrained('athman')->onDelete('set null');


            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendances');
        Schema::dropIfExists('program_sessions');
        Schema::dropIfExists('programs');
        Schema::dropIfExists('subjects');
        Schema::dropIfExists('athman');
        Schema::dropIfExists('ahzab');
    }
};
