<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::factory()->create([
            'name' => 'محمد',
            'last_name' => 'المشرف',
            'role' => 'admin',
            'email' => 'admin@oulamamaghnia.com',
            'password' => Hash::make('8$Lp1mC2gmYhhWtL'),
        ]);

        $this->call([
            ClubSeeder::class,
            CategorySeeder::class,
            //StudentSeeder::class,
        ]);
    }
}
