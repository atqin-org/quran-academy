<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Category;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            [
                'name' => 'تمهيدي',
            ],
            [
                'name' => 'تحضيري',
            ],
            [
                'name' => 'التلقين',
            ],
            [
                'name' => 'أقل من 10 سنوات',
                'gender' => 'male',
            ],
            [
                'name' => 'أقل من 10 سنوات',
                'gender' => 'female',
            ],
            [
                'name' => 'أكبر من 10 سنوات',
                'gender' => 'male',
            ],
            [
                'name' => 'أكبر من 10 سنوات',
                'gender' => 'female',
            ],
            [
                'name' => 'النساء',
                'gender' => 'female',
            ],
            [
                'name' => 'الرجال والشباب',
                'gender' => 'male',
            ],
            [
                'name' => 'محو الأمية',
                'gender' => 'female',
            ],
        ];

        foreach ($categories as $category) {
            Category::create($category);
        }
    }
}
