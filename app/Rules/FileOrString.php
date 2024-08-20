<?php

namespace App\Rules;

use Illuminate\Contracts\Validation\ValidationRule;

class FileOrString implements ValidationRule
{
    public function validate(string $attribute, mixed $value, \Closure $fail): void
    {
        // Check if the value is a valid file
        if (request()->hasFile($attribute)) {
            $file = request()->file($attribute);
            $allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];
            $maxFileSize = 6144 * 1024; // 6144 KB = 6 MB

            if (!in_array($file->getMimeType(), $allowedMimeTypes) || $file->getSize() > $maxFileSize) {
                $fail('The ' . $attribute . ' must be a valid file.');
                return;
            }
            return;
        }

        // Check if the value is a valid base64-encoded string
        if (is_string($value)) {
            $decoded = base64_decode($value, true);
            if ($decoded !== false) {
                return;
            }

            // Check if the value is a normal string
            return;
        }

        $fail('The ' . $attribute . ' must be a valid file, a valid base64-encoded string, or a normal string.');
    }
}
