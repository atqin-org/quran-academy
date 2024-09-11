<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateStudentsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->string('first_name');
            $table->string('last_name');
            $table->enum('gender', ['male', 'female']);
            $table->date('birthdate');
            $table->enum('social_status', ['good', 'mid', 'low']);
            $table->string('cronic_disease')->nullable();
            $table->string('family_status')->nullable();
            $table->string('subscription')->nullable();
            $table->string('ahzab')->default(0);
            $table->date('subscription_expire_at')->nullable();
            $table->date('insurance_expire_at')->nullable();

            $table->string('picture')->nullable();
            $table->string('file')->nullable();

            $table->foreignId('father_id')->nullable();
            $table->foreignId('mother_id')->nullable();
            $table->foreignId('club_id');
            $table->foreignId('category_id');

            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('students');
    }
}
