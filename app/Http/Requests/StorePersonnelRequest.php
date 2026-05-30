<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePersonnelRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, string>|string>
     */
    public function rules(): array
    {
        return [
            'firstName' => ['required', 'string', 'max:255'],
            'lastName' => ['required', 'string', 'max:255'],
            'clubs' => ['array', 'required_unless:role,admin'],
            'clubs.*' => ['integer', 'exists:clubs,id'],
            'role' => ['required', 'in:admin,moderator,staff,teacher'],
            'phone' => ['required', 'string'],
            'mail' => ['required', 'email', 'unique:users,email'],
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
            'role.required' => 'الدور مطلوب',
            'role.in' => 'الدور غير صالح',
            'phone.required' => 'رقم الهاتف مطلوب',
            'mail.required' => 'البريد الإلكتروني مطلوب',
            'mail.email' => 'البريد الإلكتروني غير صالح',
            'mail.unique' => 'هذا البريد الإلكتروني مسجّل مسبقًا',
        ];
    }
}
