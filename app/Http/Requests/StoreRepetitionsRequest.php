<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Rule;
use Illuminate\Foundation\Http\FormRequest;

class StoreRepetitionsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, Rule|array|string>
     */
    public function rules(): array
    {
        return [
            'student_id' => ['required', 'exists:students,id'],
            'sections' => ['present', 'array'],
            'sections.*.hizb_id' => ['required', 'exists:ahzab,id'],
            'sections.*.tester_user_id' => ['nullable', 'exists:users,id', 'required_without:sections.*.tester_student_id'],
            'sections.*.tester_student_id' => [
                'nullable',
                'exists:students,id',
                'required_without:sections.*.tester_user_id',
                'different:student_id',
            ],
            'sections.*.overall_rating' => ['nullable', 'in:good,great,mid,bad,not_memorized'],
            'sections.*.remark' => ['nullable', 'string', 'max:1000'],
            'sections.*.thumns' => ['nullable', 'array', 'max:8'],
            'sections.*.thumns.*.thoman_id' => ['required', 'exists:athman,id'],
            'sections.*.thumns.*.result' => ['required', 'in:good,bad'],
            'sections.*.thumns.*.mistakes_count' => ['nullable', 'integer', 'min:0', 'max:999'],
            'sections.*.thumns.*.note' => ['nullable', 'string', 'max:500'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'student_id.required' => 'الطالب مطلوب',
            'student_id.exists' => 'الطالب غير موجود',
            'sections.present' => 'قائمة المقاطع مطلوبة',
            'sections.array' => 'صيغة المقاطع غير صالحة',
            'sections.*.hizb_id.required' => 'الحزب مطلوب',
            'sections.*.hizb_id.exists' => 'الحزب المختار غير موجود',
            'sections.*.tester_user_id.exists' => 'المسؤول المختار غير موجود',
            'sections.*.tester_user_id.required_without' => 'يجب اختيار المستظهر',
            'sections.*.tester_student_id.exists' => 'الطالب المختار غير موجود',
            'sections.*.tester_student_id.required_without' => 'يجب اختيار المستظهر',
            'sections.*.tester_student_id.different' => 'لا يمكن للطالب أن يختبر نفسه',
            'sections.*.overall_rating.in' => 'تقييم المقطع غير صالح',
            'sections.*.remark.max' => 'ملاحظات المعلم طويلة جدًا',
            'sections.*.thumns.max' => 'لا يمكن أن يحتوي المقطع على أكثر من 8 أثمان',
            'sections.*.thumns.*.thoman_id.required' => 'الثمن مطلوب',
            'sections.*.thumns.*.thoman_id.exists' => 'الثمن المختار غير موجود',
            'sections.*.thumns.*.result.required' => 'نتيجة الثمن مطلوبة',
            'sections.*.thumns.*.result.in' => 'نتيجة الثمن غير صالحة',
            'sections.*.thumns.*.mistakes_count.integer' => 'عدد الأخطاء يجب أن يكون رقمًا',
            'sections.*.thumns.*.mistakes_count.min' => 'عدد الأخطاء لا يمكن أن يكون سالبًا',
            'sections.*.thumns.*.note.max' => 'ملاحظة الثمن طويلة جدًا',
        ];
    }
}
