<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('barcode', 32)->unique();
            $table->string('name');
            $table->string('description', 500)->default('');
            $table->unsignedBigInteger('price');
            $table->string('category', 32)->index();
            $table->string('kind', 16)->default('Makanan');
            $table->unsignedTinyInteger('prep_minutes')->default(5);
            $table->string('badge')->nullable();
            $table->string('image')->default('');
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
