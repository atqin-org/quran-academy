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
            $table->boolean('has_cronic_disease');
            $table->string('cronic_disease')->nullable();
            $table->string('family_status')->nullable();
            $table->string('father_job')->nullable();
            $table->string('mother_job')->nullable();
            $table->string('father_phone')->nullable();
            $table->string('mother_phone')->nullable();
            $table->string('subscription')->nullable();
            $table->date('subscription_expire_at')->nullable();
            $table->date('insurance_expire_at')->nullable();

            $table->string('picture')->nullable();
            $table->string('file')->nullable();

            $table->foreignId('id_club');
            $table->foreignId('id_category');

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
