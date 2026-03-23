<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePaymentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\Rule|array|string>
     */
    public function rules(): array
    {
        return [
            'type' => ['required', 'string', 'in:sub,ins'],
            'value' => ['required', 'numeric', 'min:0'],
            'status' => ['required', 'string'],
            'discount' => ['nullable', 'numeric'],
            'user_id' => ['required', 'exists:users,id'],
            'student_id' => ['required', 'exists:students,id'],
            'expect.duration' => ['required', 'integer'],
            'expect.sessions' => ['required', 'integer'],
            'expect.change' => ['required', 'numeric'],
            'expect.start_at' => ['required', 'date'],
            'expect.end_at' => ['required', 'date'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'value.required' => 'المبلغ مطلوب',
            'value.numeric' => 'المبلغ يجب أن يكون رقمًا',
            'value.min' => 'المبلغ يجب أن يكون أكبر من أو يساوي 0',
            'type.required' => 'نوع الدفع مطلوب',
            'type.in' => 'نوع الدفع غير صالح',
            'student_id.required' => 'الطالب مطلوب',
            'student_id.exists' => 'الطالب غير موجود',
            'user_id.required' => 'المستخدم مطلوب',
            'user_id.exists' => 'المستخدم غير موجود',
            'expect.duration.required' => 'مدة الاشتراك مطلوبة',
            'expect.sessions.required' => 'عدد الحصص مطلوب',
            'expect.start_at.required' => 'تاريخ البدء مطلوب',
            'expect.start_at.date' => 'تاريخ البدء غير صالح',
            'expect.end_at.required' => 'تاريخ الانتهاء مطلوب',
            'expect.end_at.date' => 'تاريخ الانتهاء غير صالح',
        ];
    }
}
