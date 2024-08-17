<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

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
        //upload the picture
        $attributes['picture'] = $attributes['picture']->store('students', 'public');
        //upload the file (the file is the birth certificate secret)
        $attributes['file'] = $attributes['file']->store('students', 'public');
        
        // create a new student
        $student = new Student();

        // set the student properties
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
        $student->subscription_expire_at = now();
        $student->insurance_expire_at = now()->addYear();
        $student->picture = $attributes['picture'];
        $student->file = $attributes['file'];

        // save the student
        $student->save();

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
