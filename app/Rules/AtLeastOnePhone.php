<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class AtLeastOnePhone implements ValidationRule
{
    protected $otherField;

    public function __construct($otherField)
    {
        $this->otherField = $otherField;
    }

    /**
     * Run the validation rule.
     *
     * @param  \Closure(string): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $otherValue = request($this->otherField);
        if (empty($value) && empty($otherValue)) {
            $fail('At least one of the phone fields (fatherPhone or motherPhone) must be provided.');
        }
    }
}
