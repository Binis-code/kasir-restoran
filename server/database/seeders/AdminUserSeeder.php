<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@kasa.local'],
            [
                'name' => 'Admin KASA',
                'password' => Hash::make('kasa-admin-2026'),
            ],
        );
    }
}
