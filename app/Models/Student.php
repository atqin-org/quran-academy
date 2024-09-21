<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class Student extends Model
{
    use HasFactory, SoftDeletes;

    // Define the fillable properties
    protected $fillable = [
        'club_id',
        'first_name',
        'last_name',
        'gender',
        'birthdate',
        'social_status',
        'cronic_disease',
        'family_status',
        'father_id',
        'mother_id',
        'category_id',
        'ahzab',
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
    // Relationship students has father_id and mother_id are guardians
    public function father()
    {
        return $this->belongsTo(Guardian::class, 'father_id');
    }
    public function mother()
    {
        return $this->belongsTo(Guardian::class, 'mother_id');
    }
    public function payments()
    {
        return $this->hasMany(Payment::class, 'student_id');
    }
    public function club()
    {
        return $this->belongsTo(Club::class, 'club_id');
    }
    public function category()
    {
        return $this->belongsTo(Category::class, 'category_id');
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

        $now = Carbon::now();
        $nextOctober31 = Carbon::create($now->year, 10, 31, 0, 0, 0);

        if ($now->greaterThan($nextOctober31)) {
            $nextOctober31->addYear();
        }

        $student = new Student();

        $student->club_id = $attributes['club'];
        $student->first_name = $attributes['firstName'];
        $student->last_name = $attributes['lastName'];
        $student->gender = $attributes['gender'];
        $student->birthdate = $attributes['birthdate'];
        $student->social_status = $attributes['socialStatus'];
        $student->cronic_disease = $attributes['cronicDisease'];
        $student->family_status = $attributes['familyStatus'];
        $student->category_id = $attributes['category'];
        $student->subscription = $attributes['subscription'];
        $student->father_id = $attributes['father_id'];
        $student->mother_id = $attributes['mother_id'];
        if ($attributes['insurance']) {
            $student->insurance_expire_at = $nextOctober31;
        }
        if (isset($attributes['picture']) && $attributes['picture'] !== null) {
            $student->picture = $attributes['picture'];
        }
        if (isset($attributes['file']) && $attributes['file'] !== null) {
            $student->file = $attributes['file'];
        }

        $student->save();
        if ($attributes['insurance']) {
            $paymentInsurance = new Payment([
                'type' => 'ins',
                'value' => 200,
                'start_at' => now(),
                'end_at' => $nextOctober31,
                //TODO: get the user id
                'user_id' => 1,
                'student_id' => $student->id,
                'status' => "in_time",
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
            'club_id' => $attributes['club'],
            'first_name' => $attributes['firstName'],
            'last_name' => $attributes['lastName'],
            'gender' => $attributes['gender'],
            'birthdate' => $attributes['birthdate'],
            'social_status' => $attributes['socialStatus'],
            'cronic_disease' => $attributes['cronicDisease'] ?? null,
            'family_status' => $attributes['familyStatus'] ?? null,
            'category_id' => $attributes['category'],
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
