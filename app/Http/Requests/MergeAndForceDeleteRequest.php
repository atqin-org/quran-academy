<?php

namespace App\Http\Requests;

use App\Models\Payment;
use App\Models\Student;
use Illuminate\Contracts\Validation\Rule;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

class MergeAndForceDeleteRequest extends FormRequest
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
            'transfer_payment_ids' => ['array'],
            'transfer_payment_ids.*' => ['integer', 'exists:payments,id'],
            'delete_payment_ids' => ['array'],
            'delete_payment_ids.*' => ['integer', 'exists:payments,id'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'transfer_payment_ids.array' => 'قائمة المدفوعات للنقل غير صالحة',
            'transfer_payment_ids.*.exists' => 'إحدى الدفعات المراد نقلها غير موجودة',
            'delete_payment_ids.array' => 'قائمة المدفوعات للحذف غير صالحة',
            'delete_payment_ids.*.exists' => 'إحدى الدفعات المراد حذفها غير موجودة',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $duplicateId = (int) $this->route('trashed');
            $duplicate = Student::onlyTrashed()->find($duplicateId);

            if (! $duplicate) {
                $validator->errors()->add('trashed', 'الطالب المكرر غير موجود في الأرشيف');

                return;
            }

            $transferIds = collect($this->input('transfer_payment_ids', []))
                ->map(fn ($id) => (int) $id);
            $deleteIds = collect($this->input('delete_payment_ids', []))
                ->map(fn ($id) => (int) $id);

            if ($transferIds->intersect($deleteIds)->isNotEmpty()) {
                $validator->errors()->add(
                    'transfer_payment_ids',
                    'لا يمكن نقل وحذف نفس الدفعة'
                );

                return;
            }

            $submitted = $transferIds->merge($deleteIds);
            $duplicatePaymentIds = Payment::query()
                ->where('student_id', $duplicate->id)
                ->pluck('id')
                ->map(fn ($id) => (int) $id);

            $missing = $duplicatePaymentIds->diff($submitted);
            if ($missing->isNotEmpty()) {
                $validator->errors()->add(
                    'transfer_payment_ids',
                    'يجب تحديد كل دفعة من دفعات الطالب المكرر إما للنقل أو للحذف'
                );
            }

            $foreign = $submitted->diff($duplicatePaymentIds);
            if ($foreign->isNotEmpty()) {
                $validator->errors()->add(
                    'transfer_payment_ids',
                    'إحدى الدفعات المحددة لا تنتمي إلى الطالب المكرر'
                );
            }
        });
    }
}
