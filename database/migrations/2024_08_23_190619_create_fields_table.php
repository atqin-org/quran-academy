<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::create('fields', function (Blueprint $table) {
            $table->id();
            $table->foreignId('form_id')->constrained()->onDelete('cascade');
            $table->string('label');
            $table->unsignedTinyInteger('width');
            $table->string('type');
            $table->text('options')->nullable();
            $table->string('table_reference')->nullable();
            $table->boolean('is_required')->default(false);
            $table->boolean('is_multiple')->default(false);
            $table->unsignedInteger('order')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('fields');
    }
};
