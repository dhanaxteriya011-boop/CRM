<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('call_routing_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('team_id')->nullable()->constrained()->nullOnDelete();
            $table->string('routing_type')->default('round-robin');
            $table->integer('timeout_minutes')->default(5);
            $table->integer('max_attempts')->default(3);
            $table->boolean('escalate_to_manager')->default(true);
            $table->boolean('active')->default(true);
            // Ordered list of users for priority routing (JSON)
            $table->json('user_order')->nullable();
            // Round-robin state
            $table->integer('last_assigned_index')->default(0);
            $table->timestamps();
        });
    }

    public function down() { Schema::dropIfExists('call_routing_rules'); }
};