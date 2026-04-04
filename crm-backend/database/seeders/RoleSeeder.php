<?php
namespace Database\Seeders;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;

class RoleSeeder extends Seeder
{
    public function run()
    {
        $roles = ['Admin', 'Manager', 'Sales', 'Support'];
        foreach ($roles as $role) {
            Role::firstOrCreate(['name' => $role]);
        }

        $permissions = [
            'manage-users', 'manage-roles',
            'manage-contacts', 'view-contacts',
            'manage-leads', 'view-leads',
            'manage-deals', 'view-deals',
            'manage-activities', 'view-activities',
            'manage-emails', 'send-emails',
            'view-reports', 'manage-settings',
            'manage-invoices', 'manage-files',
            'manage-teams',
        ];
        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['name' => $perm]);
        }

        Role::findByName('Admin')->syncPermissions(Permission::all());
        Role::findByName('Manager')->syncPermissions([
            'manage-contacts','view-contacts','manage-leads','view-leads',
            'manage-deals','view-deals','manage-activities','view-activities',
            'send-emails','view-reports','manage-files','manage-teams',
        ]);
        Role::findByName('Sales')->syncPermissions([
            'manage-contacts','view-contacts','manage-leads','view-leads',
            'manage-deals','view-deals','manage-activities','view-activities',
            'send-emails','manage-files',
        ]);
        Role::findByName('Support')->syncPermissions([
            'view-contacts','view-leads','view-deals','view-activities','manage-activities',
        ]);

        // Create admin user
        $admin = User::firstOrCreate(
            ['email' => 'admin@crm.com'],
            ['name' => 'Admin', 'password' => bcrypt('password')]
        );
        $admin->assignRole('Admin');
    }
}