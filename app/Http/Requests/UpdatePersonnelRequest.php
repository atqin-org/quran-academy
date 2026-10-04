<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePersonnelRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, mixed>|string>
     */
    public function rules(): array
    {
        return [
            'firstName' => ['required', 'string', 'max:255'],
            'lastName' => ['required', 'string', 'max:255'],
            'clubs' => ['nullable', 'array', 'required_unless:role,admin'],
            'clubs.*' => ['integer', 'exists:clubs,id'],
            'club_categories' => ['nullable', 'array'],
            'club_categories.*' => ['nullable', 'array'],
            'club_categories.*.*' => ['integer', 'exists:categories,id'],
            'role' => ['required', 'in:admin,moderator,staff,teacher'],
            'phone' => ['required', 'string'],
            'mail' => ['required', 'email', Rule::unique('users', 'email')->ignore($this->route('personnel'))],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'firstName.required' => 'الاسم مطلوب',
            'lastName.required' => 'اللقب مطلوب',
            'clubs.required_unless' => 'يجب اختيار نادٍ واحد على الأقل',
            'club_categories.*.*.exists' => 'القسم المختار غير موجود',
            'role.required' => 'الدور مطلوب',
            'role.in' => 'الدور غير صالح',
            'phone.required' => 'رقم الهاتف مطلوب',
            'mail.required' => 'البريد الإلكتروني مطلوب',
            'mail.email' => 'البريد الإلكتروني غير صالح',
            'mail.unique' => 'هذا البريد الإلكتروني مسجّل مسبقًا',
        ];
    }
}
