<?php
namespace App\Notifications;

use App\Models\CallQueue;
use Illuminate\Notifications\Notification;

class CallAssignedNotification extends Notification
{
    public function __construct(public CallQueue $call) {}

    public function via($notifiable) { return ['database']; }

    public function toArray($notifiable)
    {
        return [
            'type'    => 'call_assigned',
            'call_id' => $this->call->id,
            'title'   => "📞 New call assigned: {$this->call->title}",
            'message' => "Caller: {$this->call->caller_name} ({$this->call->caller_phone}). You have {$this->call->timeout_minutes} minutes to attend.",
            'url'     => "/calls/{$this->call->id}",
            'priority'=> $this->call->priority,
        ];
    }
}