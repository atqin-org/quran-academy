<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Form;

class FormWithFieldsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $form = Form::factory()->create([
            'name' => 'Create Form',
            'description' => 'This is for creating a form.',
        ]);

        $form->fields()->createMany([
            [
                'label' => 'النادي',
                'name' => 'club',
                'width' => 100,
                'type' => 'select',
                'options' => json_encode(['النادي الاهلي', 'النادي الزمالك']),
                'is_required' => true,
                'order' => 1,
            ],
            [
                'label' => 'الإسم',
                'name' => 'name',
                'width' => 33,
                'type' => 'text',
                'is_required' => true,
                'order' => 2,
            ],
            [
                'label' => 'اللقب',
                'name' => 'nickname',
                'width' => 33,
                'type' => 'text',
                'is_required' => true,
                'order' => 3,
            ],
            [
                'label' => 'الجنس',
                'name' => 'gender',
                'width' => 33,
                'type' => 'select',
                'options' => json_encode(['ذكر', 'أنثى']),
                'is_required' => true,
                'order' => 4,
            ],
            [
                'label' => 'تاريخ الميلاد',
                'name' => 'dob',
                'width' => 50,
                'type' => 'date',
                'is_required' => true,
                'order' => 5,
            ],
            [
                'label' => 'الحالة الإجتماعية',
                'name' => 'social_status',
                'options' => json_encode(['متوسطة', 'ميسورة','فقيرة']),
                'width' => 50,
                'type' => 'select',
                'is_required' => true,
                'order' => 6,
            ],
            [
                'label' => 'هل يعاني من مرض مزمن؟ إذا نعم ما هو؟',
                'name' => 'chronic_disease',
                'width' => 50,
                'type' => 'text',
                'is_required' => true,
                'order' => 7,
            ],
            [
                'label' => 'الحالة العائلية',
                'name' => 'family_status',
                'options' => json_encode(['متوسطة', 'ميسورة','فقيرة']),
                'width' => 50,
                'type' => 'select',
                'is_required' => true,
                'order' => 8,
            ],
            [
                'label' => 'وظيفة الأب',
                'name' => 'father_job',
                'width' => 50,
                'type' => 'text',
                'is_required' => true,
                'order' => 9,
            ],
            [
                'label' => 'رقم هاتف الأب',
                'name' => 'father_phone',
                'width' => 50,
                'type' => 'text',
                'is_required' => true,
                'order' => 10,
            ],
            [
                'label' => 'وظيفة الأم',
                'name' => 'mother_job',
                'width' => 50,
                'type' => 'text',
                'is_required' => true,
                'order' => 11,
            ],
            [
                'label' => 'رقم هاتف الأم',
                'name' => 'mother_phone',
                'width' => 50,
                'type' => 'text',
                'is_required' => true,
                'order' => 12,
            ],
            [
                'label' => 'الفئة',
                'name' => 'category',
                'width' => 33,
                'type' => 'select',
                'options' => json_encode(['الفئة 1', 'الفئة 2', 'الفئة 3']),
                'is_required' => true,
                'order' => 13,
            ],
            [
                'label' => 'الاشتراك الشهري',
                'name' => 'monthly_subscription',
                'width' => 33,
                'type' => 'text',
                'is_required' => true,
                'order' => 14,
            ],
            [
                'label' => 'التأمين',
                'name' => 'insurance',
                'width' => 33,
                'type' => 'switch',
                'is_required' => true,
                'order' => 15,
            ],
            [
                'label' => 'الصورة الشخصية',
                'name' => 'profile_picture',
                'width' => 50,
                'type' => 'file',
                'is_required' => true,
                'order' => 16,
            ],
            [
                'label' => 'شهادة الميلاد',
                'name' => 'birth_certificate',
                'width' => 50,
                'type' => 'file',
                'is_required' => true,
                'order' => 17,
            ]
        ]);
    }
}
