<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SubscriptionPlan;

class PlanSeeder extends Seeder
{
    public function run()
    {
        $plans = [
            [
                'name'        => 'Basic',
                'price'       => 999.00,
                'max_members' => 5,
                'features'    => json_encode(['Call Management', 'Contact Management', 'Basic Reports']),
                'active'      => true,
            ],
            [
                'name'        => 'Pro',
                'price'       => 2499.00,
                'max_members' => 20,
                'features'    => json_encode(['All Basic Features', 'Lead & Deal Management', 'Email Integration', 'Advanced Reports']),
                'active'      => true,
            ],
            [
                'name'        => 'Enterprise',
                'price'       => 5999.00,
                'max_members' => -1, // unlimited
                'features'    => json_encode(['All Pro Features', 'Unlimited Members', 'Priority Support', 'Custom Routing Rules', 'API Access']),
                'active'      => true,
            ],
        ];

        foreach ($plans as $plan) {
            SubscriptionPlan::firstOrCreate(['name' => $plan['name']], $plan);
        }
    }
}