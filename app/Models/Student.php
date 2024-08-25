<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class Student extends Model
{
    use HasFactory, SoftDeletes;

    // Define the fillable properties
    protected $fillable = [
        'id_club',
        'first_name',
        'last_name',
        'gender',
        'birthdate',
        'social_status',
        'has_cronic_disease',
        'cronic_disease',
        'family_status',
        'father_job',
        'mother_job',
        'father_phone',
        'mother_phone',
        'id_category',
        'subscription',
        'subscription_expire_at',
        'insurance_expire_at',
        'picture',
        'file',
    ];

    protected $casts = [
        'birthdate' => 'date',
        'subscription_expire_at' => 'date',
        'insurance_expire_at' => 'date',
    ];

    public function club()
    {
        return $this->belongsTo(Club::class, 'id_club');
    }

    public function category()
    {
        return $this->belongsTo(Category::class, 'id_category');
    }

    // override the default create method
    public static function create(array $attributes = [])
    {
        if (isset($attributes['picture']) && $attributes['picture'] !== null) {
            $originalName = pathinfo($attributes['picture']->getClientOriginalName(), PATHINFO_FILENAME);
            $fileType = $attributes['picture']->getClientOriginalExtension();
            $fileSize = $attributes['picture']->getSize();
            $uniqueChars = bin2hex(random_bytes(5));

            $customFileName = "{$fileSize}___{$originalName}___{$uniqueChars}.{$fileType}";
            $attributes['picture'] = $attributes['picture']->storeAs('students/pictures', $customFileName, 'public');
        }

        if (isset($attributes['file']) && $attributes['file'] !== null) {
            $originalName = pathinfo($attributes['file']->getClientOriginalName(), PATHINFO_FILENAME);
            $fileType = $attributes['file']->getClientOriginalExtension();
            $fileSize = $attributes['file']->getSize();
            $uniqueChars = bin2hex(random_bytes(5));

            $customFileName = "{$fileSize}___{$originalName}___{$uniqueChars}.{$fileType}";
            $attributes['file'] = $attributes['file']->storeAs('students/files', $customFileName, 'public');
        }

        $student = new Student();

        $student->id_club = $attributes['club'];
        $student->first_name = $attributes['firstName'];
        $student->last_name = $attributes['lastName'];
        $student->gender = $attributes['gender'];
        $student->birthdate = $attributes['birthdate'];
        $student->social_status = $attributes['socialStatus'];
        $student->has_cronic_disease = $attributes['hasCronicDisease'] === 'yes';
        $student->cronic_disease = $attributes['cronicDisease'];
        $student->family_status = $attributes['familyStatus'];
        $student->father_job = $attributes['fatherJob'];
        $student->mother_job = $attributes['motherJob'];
        $student->father_phone = $attributes['fatherPhone'];
        $student->mother_phone = $attributes['motherPhone'];
        $student->id_category = $attributes['category'];
        $student->subscription = $attributes['subscription'];
        if ($attributes['insurance'] === 'yes') {
            $student->insurance_expire_at = now()->addYear();
        }
        if (isset($attributes['picture']) && $attributes['picture'] !== null) {
            $student->picture = $attributes['picture'];
        }
        if (isset($attributes['file']) && $attributes['file'] !== null) {
            $student->file = $attributes['file'];
        }

        $student->save();
        if ($attributes['insurance'] === 'yes') {
            $paymentInsurance = new Payment([
                'type' => 'insurance',
                'value' => 200,
                'start_at' => now(),
                'end_at' => now()->addYear(),
                //TODO: get the user id
                'id_user' => 1,
                'id_student' => $student->id,
            ]);
            $paymentInsurance->save();
        }
    }

    // Override the default update method
    public function update(array $attributes = [], array $options = [])
    {
        // Handle picture attribute
        $this->handleFileAttribute($attributes, 'picture', 'students/pictures');

        // Handle file attribute
        $this->handleFileAttribute($attributes, 'file', 'students/files');

         // Update other attributes
         $this->fill([
            'id_club' => $attributes['club'],
            'first_name' => $attributes['firstName'],
            'last_name' => $attributes['lastName'],
            'gender' => $attributes['gender'],
            'birthdate' => $attributes['birthdate'],
            'social_status' => $attributes['socialStatus'],
            'has_cronic_disease' => $attributes['hasCronicDisease'] === 'yes',
            'cronic_disease' => $attributes['cronicDisease'],
            'family_status' => $attributes['familyStatus'],
            'father_job' => $attributes['fatherJob'],
            'mother_job' => $attributes['motherJob'],
            'father_phone' => $attributes['fatherPhone'],
            'mother_phone' => $attributes['motherPhone'],
            'id_category' => $attributes['category'],
            'subscription' => $attributes['subscription'],
        ]);

        $this->save();
    }
    private function handleFileAttribute(array &$attributes, string $attributeName, string $storagePath)
    {
            if (!isset($attributes[$attributeName]) || $attributes[$attributeName] === null) {
                if ($this->$attributeName) {
                    Storage::disk('public')->delete($this->$attributeName);
                    $this->$attributeName = null;
                }
            } elseif (isset($attributes[$attributeName]) && $attributes[$attributeName] instanceof \Illuminate\Http\UploadedFile) {
                if ($this->$attributeName) {
                    Storage::disk('public')->delete($this->$attributeName);
                }
                $originalName = pathinfo($attributes[$attributeName]->getClientOriginalName(), PATHINFO_FILENAME);
                $fileType = $attributes[$attributeName]->getClientOriginalExtension();
                $fileSize = $attributes[$attributeName]->getSize();
                $uniqueChars = bin2hex(random_bytes(5));

                $customFileName = "{$fileSize}___{$originalName}___{$uniqueChars}.{$fileType}";
                $attributes[$attributeName] = $attributes[$attributeName]->storeAs($storagePath, $customFileName, 'public');
                $this->$attributeName = $attributes[$attributeName];
            }

    }
}
