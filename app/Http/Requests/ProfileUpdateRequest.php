<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProfileUpdateRequest extends FormRequest
{
    /**
     * Strip spaces and dashes from the phone before validation.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('phone') && is_string($this->input('phone'))) {
            $this->merge([
                'phone' => preg_replace('/[\s\-]/', '', $this->input('phone')),
            ]);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\Rule|array|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'regex:/^(?:\+213|0)[2-7]\d{8}$/'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', Rule::unique(User::class)->ignore($this->user()->id)],
            'avatar_style' => ['nullable', 'in:initials,hashvatar,boring'],
            'avatar_color' => ['nullable', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'avatar_variant' => ['nullable', 'in:beam,marble,pixel,sunset,ring,bauhaus'],
            'hashvatar_mode' => ['nullable', 'in:gradient,dither'],
            'hashvatar_animated' => ['nullable', 'boolean'],
            'hashvatar_tones' => ['nullable', 'in:auto,ocean,sunset,forest,candy,warm,mono'],
        ];
    }

    /**
     * Strip avatar fields that don't apply to the chosen style so stale
     * values from a previous selection don't linger in the DB.
     */
    public function validated($key = null, $default = null)
    {
        $data = parent::validated();

        $style = $data['avatar_style'] ?? null;

        if ($style !== 'initials') {
            $data['avatar_color'] = null;
        }

        if ($style !== 'boring') {
            $data['avatar_variant'] = null;
        }

        if ($style !== 'hashvatar') {
            $data['hashvatar_mode'] = null;
            $data['hashvatar_animated'] = null;
            $data['hashvatar_tones'] = null;
        }

        return $key === null ? $data : data_get($data, $key, $default);
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'phone.regex' => 'رقم الهاتف غير صالح. الرجاء إدخال رقم جزائري (مثال: 0555123456 أو +213555123456).',
            'avatar_color.regex' => 'لون الصورة الرمزية غير صالح.',
        ];
    }
}
