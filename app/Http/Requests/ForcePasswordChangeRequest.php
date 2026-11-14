<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class ForcePasswordChangeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, array<int, mixed>|string>
     */
    public function rules(): array
    {
        return [
            'current_password' => ['required', 'current_password'],
            'password' => [
                'required',
                'confirmed',
                'different:current_password',
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
            'current_password.required' => 'كلمة المرور الحالية مطلوبة',
            'current_password.current_password' => 'كلمة المرور الحالية غير صحيحة',
            'password.required' => 'كلمة المرور الجديدة مطلوبة',
            'password.confirmed' => 'تأكيد كلمة المرور غير مطابق',
            'password.different' => 'كلمة المرور الجديدة يجب أن تختلف عن الحالية',
            'password.min' => 'يجب أن تتكون كلمة المرور من 8 خانات على الأقل.',
            'password.mixed' => 'يجب أن تحتوي كلمة المرور على حروف كبيرة وصغيرة.',
            'password.numbers' => 'يجب أن تحتوي كلمة المرور على رقم واحد على الأقل.',
            'password.symbols' => 'يجب أن تحتوي كلمة المرور على رمز خاص واحد على الأقل.',
        ];
    }
}
