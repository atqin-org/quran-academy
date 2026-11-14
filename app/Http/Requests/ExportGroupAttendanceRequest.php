<?php

namespace App\Http\Requests;

use App\Exports\GroupAttendanceExport;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ExportGroupAttendanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'from' => ['required', 'date_format:Y-m-d'],
            'to' => ['required', 'date_format:Y-m-d', 'after_or_equal:from'],
            'layout' => ['required', 'string', Rule::in(GroupAttendanceExport::LAYOUTS)],
            'group_ids' => ['nullable', 'array'],
            'group_ids.*' => ['integer', 'exists:groups,id'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'from.required' => 'تاريخ البداية مطلوب',
            'from.date_format' => 'تاريخ البداية غير صالح',
            'to.required' => 'تاريخ النهاية مطلوب',
            'to.date_format' => 'تاريخ النهاية غير صالح',
            'to.after_or_equal' => 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية أو مساويًا له',
            'layout.required' => 'طريقة تقسيم الأوراق مطلوبة',
            'layout.in' => 'طريقة تقسيم الأوراق غير صالحة',
            'group_ids.array' => 'قائمة الأفواج غير صالحة',
            'group_ids.*.integer' => 'الفوج المحدد غير صالح',
            'group_ids.*.exists' => 'الفوج المحدد غير موجود',
        ];
    }

    /**
     * Selected group ids, or null when the whole class is exported.
     *
     * @return list<int>|null
     */
    public function groupIds(): ?array
    {
        $groupIds = $this->validated('group_ids');

        if (empty($groupIds)) {
            return null;
        }

        return array_values(array_unique(array_map('intval', $groupIds)));
    }
}
