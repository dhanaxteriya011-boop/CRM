<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('files', function (Blueprint $table) {
            $table->id();

            $table->string('name');
            $table->string('path');
            $table->string('mime_type')->nullable();

            $table->foreignId('uploaded_by')
                ->constrained('users')
                ->cascadeOnDelete();

            // Polymorphic relation (contact, lead, deal)
            $table->morphs('fileable');

            $table->timestamps();

            $table->index(['mime_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('files');
    }
};