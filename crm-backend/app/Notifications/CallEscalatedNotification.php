<?php
namespace App\Notifications;

use App\Models\CallQueue;
use Illuminate\Notifications\Notification;

class CallEscalatedNotification extends Notification
{
    public function __construct(public CallQueue $call) {}
    public function via($notifiable) { return ['database']; }
    public function toArray($notifiable)
    {
        return [
            'type'    => 'call_escalated',
            'call_id' => $this->call->id,
            'title'   => "⚠️ Call escalated to you: {$this->call->title}",
            'message' => "All team members missed this call. Caller: {$this->call->caller_name}. Attempts: {$this->call->current_attempt}",
            'url'     => "/calls/{$this->call->id}",
        ];
    }
}