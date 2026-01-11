<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Student extends Model
{
    use HasFactory, LogsActivity, SoftDeletes;

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
        'group_id',
        'ahzab',
        'ahzab_up',
        'ahzab_down',
        'subscription',
        'subscription_expire_at',
        'sessions_credit',
        'insurance_expire_at',
        'picture',
        'file',
        'memorization_direction',
        'last_hizb_ascending',
        'last_hizb_descending',
    ];

    protected $casts = [
        'birthdate' => 'date',
        'subscription_expire_at' => 'date',
        'insurance_expire_at' => 'date',
        'memorization_direction' => 'string',
        'last_hizb_ascending' => 'integer',
        'last_hizb_descending' => 'integer',
        'sessions_credit' => 'integer',
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

    public function group()
    {
        return $this->belongsTo(Group::class, 'group_id');
    }

    /**
     * Check if student has infinite sessions (subscription = 0)
     */
    public function hasInfiniteSessions(): bool
    {
        return $this->subscription == 0;
    }

    /**
     * Deduct session credit
     * Only deducts if student doesn't have infinite sessions
     *
     * @param  int  $amount  Number of credits to deduct (default 1)
     * @return bool Whether deduction was performed
     */
    public function deductCredit(int $amount = 1): bool
    {
        if ($this->hasInfiniteSessions()) {
            return false;
        }

        $this->sessions_credit -= $amount;
        $this->save();

        return true;
    }

    /**
     * Add session credits
     *
     * @param  int  $amount  Number of credits to add
     */
    public function addCredit(int $amount): void
    {
        if ($this->hasInfiniteSessions()) {
            return;
        }
        $this->sessions_credit += $amount;
        $this->save();
    }

    protected static function booted()
    {
        static::saving(function ($student) {
            $student->ahzab = $student->ahzab_up + $student->ahzab_down;
        });
    }

    public function getSiblings()
    {
        // Get the father's and mother's phone numbers
        $fatherPhone = $this->father ? $this->father->phone : null;
        $motherPhone = $this->mother ? $this->mother->phone : null;

        $siblings = Student::select('id', 'father_id', 'mother_id', 'first_name', 'last_name', 'gender', 'birthdate', 'subscription', 'ahzab', 'subscription_expire_at', 'category_id')
            ->where('id', '!=', $this->id)
            ->where('club_id', $this->club_id)
            ->where(function ($query) use ($fatherPhone, $motherPhone) {
                if ($fatherPhone) {
                    $query->whereHas('father', function ($query) use ($fatherPhone) {
                        $query->where('phone', $fatherPhone);
                    });
                }
                if ($motherPhone) {
                    $query->orWhereHas('mother', function ($query) use ($motherPhone) {
                        $query->where('phone', $motherPhone);
                    });
                }
            })
            ->with(['category', 'father', 'mother'])
            ->get();

        // Add shared_guardian attribute
        foreach ($siblings as $sibling) {
            $sharedGuardian = '';
            if ($sibling->father && $sibling->father->phone === $fatherPhone) {
                $sharedGuardian = 'father';
            }
            if ($sibling->mother && $sibling->mother->phone === $motherPhone) {
                if ($sharedGuardian === '') {
                    $sharedGuardian = 'mother';
                } else {
                    $sharedGuardian = 'both';
                }
            }
            $sibling->shared_guardian = $sharedGuardian;
        }

        return $siblings;
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

        $student = new Student;

        $student->club_id = $attributes['club'];
        $student->first_name = $attributes['firstName'];
        $student->last_name = $attributes['lastName'];
        $student->gender = $attributes['gender'];
        $student->birthdate = $attributes['birthdate'];
        $student->social_status = $attributes['socialStatus'];
        $student->cronic_disease = $attributes['cronicDisease'];
        $student->family_status = $attributes['familyStatus'];
        $student->category_id = $attributes['category'];
        $student->group_id = $attributes['group_id'] ?? null;
        $student->subscription = $attributes['subscription'];
        $student->father_id = $attributes['father_id'];
        $student->mother_id = $attributes['mother_id'];
        $student->memorization_direction = $attributes['memorizationDirection'] ?? 'descending';
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
                'user_id' => Auth::id(),
                'student_id' => $student->id,
                'status' => 'in_time',
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
            'group_id' => $attributes['group_id'] ?? null,
            'subscription' => $attributes['subscription'],
            'memorization_direction' => $attributes['memorizationDirection'] ?? $this->memorization_direction,
        ]);

        $this->save();
    }

    private function handleFileAttribute(array &$attributes, string $attributeName, string $storagePath)
    {
        if (! isset($attributes[$attributeName]) || $attributes[$attributeName] === null) {
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

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly([
                'first_name',
                'last_name',
                'gender',
                'birthdate',
                'social_status',
                'cronic_disease',
                'family_status',
                'ahzab',
                'subscription',
                'sessions_credit',
                'club_id',
                'category_id',
                'group_id',
                'father_id',
                'mother_id',
            ])
            ->logOnlyDirty()
            ->setDescriptionForEvent(function (string $eventName) {
                $events = [
                    'created' => 'تم إنشاء الطالب',
                    'updated' => 'تم تحديث الطالب',
                    'deleted' => 'تم حذف الطالب',
                ];

                return $events[$eventName] ?? "تم {$eventName} الطالب";
            })
            ->useLogName('student');
    }

    public function getLogs()
    {
        return $this->activities()->orderBy('created_at', 'desc')->get();
    }

    public static function getActivityLogs()
    {
        return ActivityLog::getLogsByType('student');
    }

    public function attendances()
    {
        return $this->hasMany(Attendance::class, 'student_id');
    }

    public function lastAttendance()
    {
        return $this->hasOne(Attendance::class)->latestOfMany();
    }

    public function lastHizbAttendance()
    {
        return $this->hasOne(Attendance::class)
            ->where('status', 'present')
            ->whereNotNull('hizb_id')
            ->latest(); // يأخذ آخر واحد فقط
    }

    public function lastThomanAttendance()
    {
        return $this->hasOne(Attendance::class)
            ->where('status', 'present')
            ->whereNotNull('thoman_id')
            ->latest();
    }

    /**
     * Get hizbs ordered by student's memorization direction
     *
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getOrderedHizbs()
    {
        $hizbs = Hizb::orderBy('number')->get();

        return $this->memorization_direction === 'descending'
            ? $hizbs->sortByDesc('number')->values()
            : $hizbs;
    }

    /**
     * Update last hizb for the current direction
     * Called when attendance is recorded
     *
     * @param  int  $hizbNumber  The hizb number (1-60)
     */
    public function updateLastHizbForCurrentDirection(int $hizbNumber): void
    {
        if ($this->memorization_direction === 'ascending') {
            // For ascending, we store the highest hizb reached
            if ($this->last_hizb_ascending === null || $hizbNumber > $this->last_hizb_ascending) {
                $this->last_hizb_ascending = $hizbNumber;
            }
        } else {
            // For descending, we store the lowest hizb reached
            if ($this->last_hizb_descending === null || $hizbNumber < $this->last_hizb_descending) {
                $this->last_hizb_descending = $hizbNumber;
            }
        }
        $this->save();
    }

    /**
     * Get the last hizb for the current direction
     */
    public function getLastHizbForCurrentDirection(): ?int
    {
        return $this->memorization_direction === 'ascending'
            ? $this->last_hizb_ascending
            : $this->last_hizb_descending;
    }

    /**
     * Calculate total memorization progress from both directions
     * Returns array with ascending count, descending count, and total percentage
     *
     * @return array{ascending: int, descending: int, total: int, percentage: float}
     */
    public function calculateDualDirectionProgress(): array
    {
        // Ascending: memorized from 1 to last_hizb_ascending
        // e.g., if last_hizb_ascending = 20, means memorized hizbs 1-20 (20 hizbs)
        $ascendingCount = $this->last_hizb_ascending ?? 0;

        // Descending: memorized from 60 down to last_hizb_descending
        // e.g., if last_hizb_descending = 40, means memorized hizbs 60-40 (21 hizbs)
        $descendingCount = $this->last_hizb_descending
            ? (60 - $this->last_hizb_descending + 1)
            : 0;

        // Check for overlap (if both directions meet in the middle)
        // If ascending reached 30 and descending reached 30, they overlap at 30
        $overlap = 0;
        if ($this->last_hizb_ascending && $this->last_hizb_descending) {
            if ($this->last_hizb_ascending >= $this->last_hizb_descending) {
                // They've met or crossed - calculate overlap
                $overlap = $this->last_hizb_ascending - $this->last_hizb_descending + 1;
            }
        }

        $total = $ascendingCount + $descendingCount - $overlap;
        $total = min(60, max(0, $total)); // Clamp to 0-60

        return [
            'ascending' => $ascendingCount,
            'descending' => $descendingCount,
            'overlap' => $overlap,
            'total' => $total,
            'percentage' => round(($total / 60) * 100, 1),
            'last_hizb_ascending' => $this->last_hizb_ascending,
            'last_hizb_descending' => $this->last_hizb_descending,
        ];
    }
}
