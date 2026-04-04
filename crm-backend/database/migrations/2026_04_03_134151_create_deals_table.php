<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('deals', function (Blueprint $table) {
            $table->id();

            $table->string('title');

            $table->foreignId('contact_id')
                ->nullable()
                ->constrained('contacts')
                ->nullOnDelete();

            $table->foreignId('lead_id')
                ->nullable()
                ->constrained('leads')
                ->nullOnDelete();

            $table->enum('stage', [
                'Prospecting',
                'Proposal',
                'Negotiation',
                'Closed Won',
                'Closed Lost'
            ])->default('Prospecting');

            $table->decimal('value', 12, 2)->default(0);

            $table->date('expected_close_date')->nullable();

            $table->foreignId('owner_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['stage']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('deals');
    }
};