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
            ],
            [
                'name' => 'أكبر من 10 سنوات',
            ],
            [
                'name' => 'النساء',
            ],
            [
                'name' => 'الرجال والشباب',
            ],
            [
                'name' => 'محو الأمية',
            ],
        ];

        foreach ($categories as $category) {
            Category::create($category);
        }
    }
}
