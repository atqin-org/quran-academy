<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AhzabAthmanSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('athman')->delete();
        DB::table('ahzab')->delete();

        // إنشاء 60 حزب
        for ($hizb = 1; $hizb <= 60; $hizb++) {
            $hizbId = DB::table('ahzab')->insertGetId([
                'number'     => $hizb,
                'start'      => "بداية الحزب {$hizb}", // مرجع نصي فقط
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // إنشاء 8 أثمان لكل حزب
            for ($thoman = 1; $thoman <= 8; $thoman++) {
                DB::table('athman')->insert([
                    'hizb_id'    => $hizbId,
                    'number'     => $thoman,
                    'start'      => "بداية الثمن {$hizb}-{$thoman}", // مرجع نصي فقط
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }
}
