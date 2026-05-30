<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class PersonnelSetPasswordRequest extends FormRequest
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
            'password' => [
                'required',
                'confirmed',
                Password::min(8)->mixedCase()->numbers()->symbols(),
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'password.required' => 'كلمة المرور مطلوبة',
            'password.confirmed' => 'تأكيد كلمة المرور غير مطابق',
            'password.min' => 'يجب أن تتكون كلمة المرور من 8 خانات على الأقل.',
            'password.mixed' => 'يجب أن تحتوي كلمة المرور على حروف كبيرة وصغيرة.',
            'password.numbers' => 'يجب أن تحتوي كلمة المرور على رقم واحد على الأقل.',
            'password.symbols' => 'يجب أن تحتوي كلمة المرور على رمز خاص واحد على الأقل.',
        ];
    }
}
