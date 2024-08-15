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
            $table->enum('club', ['1', '2', '3']); //foreign key to clubs table
            $table->string('firstName');
            $table->string('lastName');
            $table->enum('gender', ['male', 'female']);
            $table->date('birthDate');
            $table->enum('socialStatus', ['good', 'mid', 'low']);
            $table->enum('hasCronicDisease', ['yes', 'no']);
            $table->string('cronicDisease')->nullable();
            $table->string('familyStatus')->nullable();
            $table->string('fatherJob');
            $table->string('motherJob');
            $table->string('fatherPhone')->nullable();
            $table->string('motherPhone')->nullable();
            $table->enum('category', ['1', '2', '3']); //foreign
            $table->string('subscription');
            $table->date('insurance'); //expiration date
            $table->string('picture')->nullable();
            $table->string('file')->nullable();
            $table->timestamps();
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
