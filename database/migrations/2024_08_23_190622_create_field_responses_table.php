<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('field_responses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('field_id')->constrained()->onDelete('cascade');
            $table->unsignedBigInteger('response_id');
            $table->text('response_value');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('field_responses');
    }
};
