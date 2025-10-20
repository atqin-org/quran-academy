<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Student;
use App\Models\Club;
use App\Models\Category;

class StudentSeeder extends Seeder
{
    public function run(): void
    {
        $firstNames = ['أحمد', 'محمد', 'يوسف', 'عبد الله', 'خالد', 'سلمان', 'أنس', 'إبراهيم', 'حمزة', 'مصعب'];
        $lastNames  = ['بن صالح', 'العربي', 'التميمي', 'بوزيد', 'الهاشمي', 'قدور', 'بوعلام', 'العقبي', 'بن ناصر', 'رحماني'];

        $clubs = Club::all();
        $categories = Category::all();

        foreach ($clubs as $clubIndex => $club) {
            foreach (range(1, 10) as $i) {
                $category = $categories[$clubIndex % $categories->count()];

                // ⚠️ استخدم insertRaw بدلاً من create() لتفادي override method
                $student = new Student([
                    'club_id' => $club->id,
                    'category_id' => $category->id,
                    'first_name' => $firstNames[array_rand($firstNames)],
                    'last_name' => $lastNames[array_rand($lastNames)],
                    'gender' => rand(0, 1) ? 'male' : 'female',
                    'birthdate' => now()->subYears(rand(6, 12))->subDays(rand(0, 365)),
                    'social_status' => 'mid',
                    'cronic_disease' => rand(0, 1) ? 'لا يوجد' : 'حساسية موسمية',
                    'family_status' => 'مستقر',
                    'subscription' => rand(0, 1) ? 'سارية' : 'منتهية',
                    'subscription_expire_at' => now()->addMonths(rand(1, 6)),
                    'insurance_expire_at' => now()->addMonths(rand(6, 12)),
                    'picture' => null,
                    'file' => null,
                    'ahzab' => rand(0, 60),
                    'ahzab_up' => rand(0, 30),
                    'ahzab_down' => rand(0, 30),
                ]);

                $student->save(); // ✅ هذا يستدعي Eloquent افتراضيًا وليس دالتك المخصصة
            }
        }
    }
}
