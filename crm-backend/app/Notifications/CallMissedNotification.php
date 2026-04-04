<?php
namespace App\Notifications;

use App\Models\CallQueue;
use Illuminate\Notifications\Notification;

class CallMissedNotification extends Notification
{
    public function __construct(public CallQueue $call) {}
    public function via($notifiable) { return ['database']; }
    public function toArray($notifiable)
    {
        return [
            'type'    => 'call_missed',
            'call_id' => $this->call->id,
            'title'   => "❌ Call missed: {$this->call->title}",
            'message' => "Caller: {$this->call->caller_name}. All {$this->call->current_attempt} attempts failed.",
            'url'     => "/calls/{$this->call->id}",
        ];
    }
}