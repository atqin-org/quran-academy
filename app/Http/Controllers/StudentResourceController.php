<?php

namespace App\Http\Controllers;

use App\Exports\StudentsExport;
use App\Helpers\ArabicNormalizer;
use App\Http\Requests\MergeAndForceDeleteRequest;
use App\Models\Category;
use App\Models\Club;
use App\Models\Guardian;
use App\Models\Payment;
use App\Models\Student;
use App\Rules\AtLeastOnePhone;
use App\Rules\FileOrString;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class StudentResourceController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $archived = $request->boolean('archived');
        $query = $archived ? Student::onlyTrashed() : Student::query();
        $user = Auth::user();

        // Apply club restriction first
        $accessibleClubs = $user->accessibleClubs()->pluck('id')->toArray();
        $query->whereIn('club_id', $accessibleClubs);

        // Then apply search filter
        if ($search = $request->input('search')) {
            $connectionType = DB::getDriverName();
            if ($connectionType === 'sqlite') {
                $query->where(function ($q) use ($search) {
                    $q->whereRaw("(first_name || ' ' || last_name) like ?", ["%{$search}%"])
                        ->orWhereRaw("(last_name || ' ' || first_name) like ?", ["%{$search}%"]);
                });
            } elseif ($connectionType === 'mysql') {
                $query->where(function ($q) use ($search) {
                    $q->whereRaw("CONCAT(first_name, ' ', last_name) like ?", ["%{$search}%"])
                        ->orWhereRaw("CONCAT(last_name, ' ', first_name) like ?", ["%{$search}%"]);
                });
            }
        }

        $sortBy = $request->input('sortBy', 'created_at');
        $sortType = $request->input('sortType', 'desc');

        if ($sortBy === 'name') {
            $query->orderBy('first_name', $sortType)->orderBy('last_name', $sortType);
        } else {
            $query->orderBy($sortBy, $sortType);
        }

        if ($genders = $request->input('gender')) {
            $query->whereIn('gender', $genders);
        }

        if ($categories = $request->input('categories')) {
            $query->whereIn('category_id', $categories);
        }

        if ($clubs = $request->input('clubs')) {
            $query->whereIn('club_id', $clubs);
        }
        $query->with([
            'lastHizbAttendance.hizb',
            'lastThomanAttendance.thoman',
        ]);
        $perPage = in_array((int) $request->input('per_page'), [10, 25, 50, 100]) ? (int) $request->input('per_page') : 10;
        $students = $query->paginate($perPage, ['id', 'first_name', 'last_name', 'birthdate', 'ahzab', 'ahzab_up', 'ahzab_down', 'gender', 'insurance_expire_at', 'subscription', 'subscription_expire_at', 'sessions_credit', 'club_id', 'category_id'])->withQueryString();

        $students->getCollection()->transform(function ($student) {
            $student->name = $student->first_name.' '.$student->last_name;
            $birthdate = Carbon::parse($student->birthdate);
            $student->age = (int) $birthdate->diffInYears(Carbon::now());
            $student->club = Club::find($student->club_id)->name;
            $category = Category::find($student->category_id);
            $student->category = $category->name;
            $student->category_gender = $category->gender;
            $student->insurance_expire_at = $student->insurance_expire_at ? Carbon::parse($student->insurance_expire_at)->format('Y-m-d') : null;
            $student->subscription_expire_at = $student->subscription_expire_at ? Carbon::parse($student->subscription_expire_at)->format('Y-m-d') : null;

            return $student;
        });

        // Adjust the counts for gender and categories based on accessible clubs
        $genderCountsQuery = Student::select('gender', DB::raw('count(*) as total'))
            ->whereIn('club_id', $accessibleClubs);
        if ($archived) {
            $genderCountsQuery->onlyTrashed();
        }
        $genderCounts = $genderCountsQuery->groupBy('gender')->get();

        $categoryCounts = Category::withCount(['students' => function ($query) use ($accessibleClubs, $archived) {
            $query->whereIn('club_id', $accessibleClubs);
            if ($archived) {
                $query->onlyTrashed();
            }
        }])->get();

        $clubCounts = Club::withCount(['students' => function ($query) use ($accessibleClubs, $archived) {
            $query->whereIn('club_id', $accessibleClubs);
            if ($archived) {
                $query->onlyTrashed();
            }
        }])->whereIn('id', $accessibleClubs)->get();

        return Inertia::render(
            'Dashboard/Students/Index',
            [
                'students' => $students,
                'archived' => $archived,
                'dataDependencies' => [
                    'clubs' => $clubCounts,
                    'categories' => $categoryCounts,
                    'genders' => $genderCounts,
                ],
            ]
        );
    }

    public function export(Request $request)
    {
        $query = Student::query();
        $user = Auth::user();

        // Apply club restriction
        $accessibleClubs = $user->accessibleClubs()->pluck('id')->toArray();
        $query->whereIn('club_id', $accessibleClubs);

        // Apply search filter
        if ($search = $request->input('search')) {
            $connectionType = DB::getDriverName();
            if ($connectionType === 'sqlite') {
                $query->where(function ($q) use ($search) {
                    $q->whereRaw("(first_name || ' ' || last_name) like ?", ["%{$search}%"])
                        ->orWhereRaw("(last_name || ' ' || first_name) like ?", ["%{$search}%"]);
                });
            } else {
                $query->where(function ($q) use ($search) {
                    $q->whereRaw("CONCAT(first_name, ' ', last_name) like ?", ["%{$search}%"])
                        ->orWhereRaw("CONCAT(last_name, ' ', first_name) like ?", ["%{$search}%"]);
                });
            }
        }
        $sortBy = $request->input('sortBy', 'created_at');
        $sortType = $request->input('sortType', 'desc');

        if ($sortBy === 'name') {
            $query->orderBy('first_name', $sortType)->orderBy('last_name', $sortType);
        } else {
            $query->orderBy($sortBy, $sortType);
        }
        if ($genders = $request->input('gender')) {
            $query->whereIn('gender', $genders);
        }

        if ($categories = $request->input('categories')) {
            $query->whereIn('category_id', $categories);
        }

        if ($clubs = $request->input('clubs')) {
            $query->whereIn('club_id', $clubs);
        }

        // Get the filtered students collection
        $students = $query->get();
        $export = new StudentsExport($students);
        $export->onExport();

        return Excel::download($export, 'students-'.now()->format('Y-m-d').'.xlsx');
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        // get all clubs from the database and pass them to the view
        return Inertia::render(
            'Dashboard/Students/Create',
            [
                'clubs' => Auth::user()->accessibleClubs(),
                'categories' => Category::all(),
            ]
        );
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->merge(['birthdate' => Carbon::parse($request->birthdate)->setTimezone('Africa/Algiers')]);
        $request->validate([
            'firstName' => 'required',
            'lastName' => 'required',
            'gender' => 'required|in:male,female',
            'birthdate' => [
                'required',
                'date',
                'before:'.now()->subYears(3)->format('Y-m-d'),
                'after:'.now()->subYears(100)->format('Y-m-d'),
            ],
            'socialStatus' => 'required|in:good,mid,low',
            'hasCronicDisease' => 'required|in:yes,no',
            'cronicDisease' => 'nullable|string',
            'father.phone' => ['nullable', 'regex:/^0[567]\d{8}$/', new AtLeastOnePhone('motherPhone')],
            'mother.phone' => ['nullable', 'regex:/^0[567]\d{8}$/', new AtLeastOnePhone('fatherPhone')],
            'father.name' => 'nullable|string',
            'mother.name' => 'nullable|string',
            'father.job' => 'nullable|string',
            'mother.job' => 'nullable|string',
            'subscription' => 'required|numeric',
            'club' => 'required|exists:clubs,id',
            'category' => 'required|exists:categories,id',
            'group_id' => 'nullable|exists:groups,id',
            'picture' => 'nullable|mimes:jpg,jpeg,png,pdf|max:6144', // 6144 KB = 6 MB
            'file' => 'nullable|mimes:jpg,jpeg,png,pdf|max:6144',    // 6144 KB = 6 MB
        ]);

        // Check for duplicate students (including archived) by normalized name + birthdate
        $normalizedFirst = ArabicNormalizer::normalize($request->firstName);
        $normalizedLast = ArabicNormalizer::normalize($request->lastName);
        $birthdate = $request->birthdate->format('Y-m-d');

        $duplicates = Student::withTrashed()
            ->whereDate('birthdate', $birthdate)
            ->get(['id', 'first_name', 'last_name', 'deleted_at'])
            ->filter(function ($student) use ($normalizedFirst, $normalizedLast) {
                return ArabicNormalizer::normalize($student->first_name) === $normalizedFirst
                    && ArabicNormalizer::normalize($student->last_name) === $normalizedLast;
            });

        if ($duplicates->isNotEmpty()) {
            $archivedDuplicate = $duplicates->first(fn ($s) => $s->trashed());
            $message = $archivedDuplicate
                ? 'يوجد طالب مؤرشف بنفس الاسم وتاريخ الميلاد. يمكنك استعادته من الأرشيف.'
                : 'يوجد طالب مسجل بالفعل بنفس الاسم وتاريخ الميلاد.';

            return redirect()->back()->withInput()->withErrors(['firstName' => $message]);
        }

        $father_id = Guardian::create([
            'phone' => $request->father['phone'],
            'name' => $request->father['name'],
            'job' => $request->father['job'],
            'gender' => 'male',
        ])->id;
        $mother_id = Guardian::create([
            'phone' => $request->mother['phone'],
            'name' => $request->mother['name'],
            'job' => $request->mother['job'],
            'gender' => 'female',
        ])->id;
        // add $father_id and $mother_id to the student
        $request->merge(['father_id' => $father_id, 'mother_id' => $mother_id]);
        Student::create($request->all());

        // redirect to the students index page
        return redirect()->route('students.index')->with('success', 'تم إضافة الطالب بنجاح');
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, string $id)
    {
        $student = Student::withTrashed()->with([
            'club',
            'category',
            'father',
            'mother',
            'attendances.session',
        ])->findOrFail($id);

        $totalHizb = 60;

        // Get time range filter
        $range = $request->input('range', 'all');
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        // Build base query for attendances with time filter
        $attendanceQuery = $student->attendances();

        if ($range === 'custom' && $startDate && $endDate) {
            $attendanceQuery->whereBetween('created_at', [
                Carbon::parse($startDate)->startOfDay(),
                Carbon::parse($endDate)->endOfDay(),
            ]);
        } elseif ($range === 'week') {
            $attendanceQuery->where('created_at', '>=', Carbon::now()->subWeek());
        } elseif ($range === 'month') {
            $attendanceQuery->where('created_at', '>=', Carbon::now()->subMonth());
        } elseif ($range === '3months') {
            $attendanceQuery->where('created_at', '>=', Carbon::now()->subMonths(3));
        } elseif ($range === '6months') {
            $attendanceQuery->where('created_at', '>=', Carbon::now()->subMonths(6));
        } elseif ($range === 'year') {
            $attendanceQuery->where('created_at', '>=', Carbon::now()->subYear());
        }

        // Clone the query for different stats
        $statsQuery = clone $attendanceQuery;
        $progressQuery = clone $attendanceQuery;

        // إحصائيات عامة
        $attendanceStats = [
            'present' => (clone $statsQuery)->where('status', 'present')->count(),
            'absent' => (clone $statsQuery)->where('status', 'absent')->count(),
            'excused' => (clone $statsQuery)->where('status', 'excused')->count(),
            'total' => (clone $statsQuery)->count(),
        ];

        // Calculate attendance rate
        $attendanceStats['rate'] = $attendanceStats['total'] > 0
            ? round(($attendanceStats['present'] / $attendanceStats['total']) * 100, 1)
            : 0;

        // آخر مستوى تقدّم (legacy single progress)
        $lastHizb = $student->attendances()->whereNotNull('hizb_id')->latest()->first();
        $progress = $lastHizb ? round(($lastHizb->hizb_id / $totalHizb) * 100, 2) : 0;

        // التقدم ثنائي الاتجاه (dual direction progress)
        $dualProgress = $student->calculateDualDirectionProgress();

        // التقدّم بمرور الوقت (with time filter) - dual direction aware
        // We need to track cumulative progress from both directions
        $attendancesWithHizb = $progressQuery
            ->whereNotNull('hizb_id')
            ->with('hizb')
            ->orderBy('created_at')
            ->get();

        // Track running progress from both directions
        $maxAscending = 0;  // Highest hizb reached from ascending direction
        $minDescending = 61; // Lowest hizb reached from descending direction (start at 61 so first real value wins)

        $progressTimeline = $attendancesWithHizb->map(function ($attendance) use ($totalHizb, &$maxAscending, &$minDescending) {
            $hizbNumber = $attendance->hizb ? $attendance->hizb->number : null;

            if ($hizbNumber) {
                // Determine which direction this hizb belongs to based on the hizb number
                // Hizbs 1-30 are typically ascending territory, 31-60 are descending territory
                // But we also use the student's current direction as a hint

                // Update tracking based on the hizb number
                if ($hizbNumber <= 30) {
                    // This is in the ascending range (1-30)
                    $maxAscending = max($maxAscending, $hizbNumber);
                } else {
                    // This is in the descending range (31-60)
                    $minDescending = min($minDescending, $hizbNumber);
                }

                // Calculate cumulative progress
                $ascendingCount = $maxAscending; // Hizbs 1 to maxAscending
                $descendingCount = ($minDescending <= 60) ? (60 - $minDescending + 1) : 0; // Hizbs minDescending to 60

                // Check for overlap (if they meet in the middle)
                $overlap = 0;
                if ($maxAscending > 0 && $minDescending <= 60 && $maxAscending >= $minDescending) {
                    $overlap = $maxAscending - $minDescending + 1;
                }

                $totalProgress = $ascendingCount + $descendingCount - $overlap;
                $totalProgress = min(60, max(0, $totalProgress));

                return [
                    'date' => $attendance->created_at->format('Y-m-d'),
                    'progress' => round(($totalProgress / $totalHizb) * 100, 2),
                ];
            }

            return null;
        })->filter()->values();

        // Monthly attendance breakdown for the chart (database-agnostic)
        $driver = DB::connection()->getDriverName();
        if ($driver === 'sqlite') {
            $yearSelect = "strftime('%Y', created_at) as year";
            $monthSelect = "strftime('%m', created_at) as month";
        } else {
            // MySQL / MariaDB
            $yearSelect = 'YEAR(created_at) as year';
            $monthSelect = 'MONTH(created_at) as month';
        }

        $monthlyAttendance = $student->attendances()
            ->selectRaw("{$yearSelect}, {$monthSelect}, status, COUNT(*) as count")
            ->when($range !== 'all', function ($q) use ($range, $startDate, $endDate) {
                if ($range === 'custom' && $startDate && $endDate) {
                    return $q->whereBetween('created_at', [
                        Carbon::parse($startDate)->startOfDay(),
                        Carbon::parse($endDate)->endOfDay(),
                    ]);
                } elseif ($range === 'week') {
                    return $q->where('created_at', '>=', Carbon::now()->subWeek());
                } elseif ($range === 'month') {
                    return $q->where('created_at', '>=', Carbon::now()->subMonth());
                } elseif ($range === '3months') {
                    return $q->where('created_at', '>=', Carbon::now()->subMonths(3));
                } elseif ($range === '6months') {
                    return $q->where('created_at', '>=', Carbon::now()->subMonths(6));
                } elseif ($range === 'year') {
                    return $q->where('created_at', '>=', Carbon::now()->subYear());
                }
            })
            ->groupBy('year', 'month', 'status')
            ->orderBy('year')
            ->orderBy('month')
            ->get();

        return inertia('Dashboard/Students/Show', [
            'student' => [
                'id' => $student->id,
                'name' => $student->first_name.' '.$student->last_name,
                'first_name' => $student->first_name,
                'last_name' => $student->last_name,
                'birthdate' => $student->birthdate,
                'gender' => $student->gender,
                'ahzab' => $student->ahzab,
                'ahzab_up' => $student->ahzab_up,
                'ahzab_down' => $student->ahzab_down,
                'subscription' => $student->subscription,
                'club' => $student->club,
                'category' => $student->category,
                'father' => $student->father,
                'mother' => $student->mother,
                'memorization_direction' => $student->memorization_direction,
            ],
            'progress' => $progress,
            'dualProgress' => $dualProgress,
            'attendanceStats' => $attendanceStats,
            'progressTimeline' => $progressTimeline,
            'monthlyAttendance' => $monthlyAttendance,
            'filters' => [
                'range' => $range,
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        $student = Student::find($id)->load('father', 'mother');
        $siblings = $student->getSiblings();

        return Inertia::render(
            'Dashboard/Students/Update',
            [
                'student' => $student,
                'siblings' => $siblings,
                'clubs' => Auth::user()->accessibleClubs(),
                'categories' => Category::all(),
            ]
        );
    }

    /**
     * Update ahzab the specified resource in storage.
     */
    public function ahzab(Request $request, string $id)
    {
        $request->validate([
            'ahzab_up' => 'required|numeric|max:60',
            'ahzab_down' => 'required|numeric|max:60',
        ]);
        // ahzab_up and ahzab_down should be less than 30
        if ($request->ahzab_up + $request->ahzab_down > 60) {
            return redirect()->back()->withInput()->withErrors(['ahzab_up' => 'مجموع الأحزاب يجب أن يكون أقل من 60']);
        }
        // Find the student by ID
        $student = Student::findOrFail($id);
        $student->ahzab_up = $request->ahzab_up;
        $student->ahzab_down = $request->ahzab_down;
        $student->save();

        return back()->with('success', 'تم تحديث الأحزاب بنجاح');
    }

    /**
     * Update memorization direction for a student.
     */
    public function updateDirection(Request $request, string $id)
    {
        $request->validate([
            'direction' => 'required|in:ascending,descending',
        ]);

        $student = Student::findOrFail($id);
        $student->memorization_direction = $request->direction;
        $student->save();

        return back()->with('success', 'تم تحديث اتجاه الحفظ بنجاح');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $request->merge(['birthdate' => Carbon::parse($request->birthdate)->setTimezone('Africa/Algiers')]);
        // Validate the request
        $request->validate([
            'firstName' => 'required',
            'lastName' => 'required',
            'gender' => 'required|in:male,female',
            'birthdate' => [
                'required',
                'date',
                'before:'.now()->subYears(3)->format('Y-m-d'),
                'after:'.now()->subYears(100)->format('Y-m-d'),
            ],
            'socialStatus' => 'required|in:good,mid,low',
            'hasCronicDisease' => 'required|in:yes,no',
            'cronicDisease' => 'nullable|string',
            'father.phone' => ['nullable', 'regex:/^0[567]\d{8}$/', new AtLeastOnePhone('motherPhone')],
            'mother.phone' => ['nullable', 'regex:/^0[567]\d{8}$/', new AtLeastOnePhone('fatherPhone')],
            'father.name' => 'nullable|string',
            'mother.name' => 'nullable|string',
            'father.job' => 'nullable|string',
            'mother.job' => 'nullable|string',
            'subscription' => 'required|numeric',
            'club' => 'required|exists:clubs,id',
            'category' => 'required|exists:categories,id',
            'group_id' => 'nullable|exists:groups,id',
            'picture' => ['nullable', new FileOrString],
            'file' => ['nullable', new FileOrString],
        ]);
        // Find the student by ID
        $student = Student::findOrFail($id)->load('father', 'mother');

        $father = Guardian::find($student->father_id);
        $mother = Guardian::find($student->mother_id);
        if ($father) {
            $father->update([
                'phone' => $request->father['phone'],
                'name' => $request->father['name'],
                'job' => $request->father['job'],
            ]);
        } else {
            $father = Guardian::create([
                'phone' => $request->father['phone'],
                'name' => $request->father['name'],
                'job' => $request->father['job'],
                'gender' => 'male',
            ]);
            $student->father_id = $father->id;
        }
        if ($mother) {
            $mother->update([
                'phone' => $request->mother['phone'],
                'name' => $request->mother['name'],
                'job' => $request->mother['job'],
            ]);
        } else {
            $mother = Guardian::create([
                'phone' => $request->mother['phone'],
                'name' => $request->mother['name'],
                'job' => $request->mother['job'],
                'gender' => 'female',
            ]);
            $student->mother_id = $mother->id;
        }
        $request->merge(['father_id' => $father->id, 'mother_id' => $mother->id]);

        // Update the student with validated data
        $student->update($request->all());

        // Save the updated student
        $student->save();

        // Redirect with a success message
        return redirect()->route('students.index')->with('success', 'تم تحديث الطالب بنجاح');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $student = Student::findOrFail($id);

        $student->delete();

        activity('student')
            ->performedOn($student)
            ->causedBy(Auth::user())
            ->event('archived')
            ->withProperties([
                'student_name' => $student->first_name.' '.$student->last_name,
            ])
            ->log('تم أرشفة الطالب');

        return redirect()->back()->with('success', 'تم أرشفة الطالب بنجاح');
    }

    /**
     * Restore an archived student.
     */
    public function restore(string $id)
    {
        $student = Student::onlyTrashed()->findOrFail($id);
        $student->restore();

        activity('student')
            ->performedOn($student)
            ->causedBy(Auth::user())
            ->event('restored')
            ->withProperties([
                'student_name' => $student->first_name.' '.$student->last_name,
            ])
            ->log('تم استعادة الطالب من الأرشيف');

        return redirect()->back()->with('success', 'تم استعادة الطالب بنجاح');
    }

    /**
     * Permanently delete an archived student.
     *
     * If the student still has payment rows, refuse and ask the admin to use
     * the merge flow instead. The DB FK is RESTRICT, so cascading here would
     * silently destroy financial history.
     */
    public function forceDelete(string $id)
    {
        $student = Student::onlyTrashed()->findOrFail($id);

        if ($student->payments()->exists()) {
            return redirect()->back()->with(
                'error',
                'لا يمكن الحذف النهائي مباشرةً لوجود دفعات مرتبطة، استخدم زر الدمج مع الطالب الأصلي.'
            );
        }

        activity('student')
            ->performedOn($student)
            ->causedBy(Auth::user())
            ->event('force_deleted')
            ->withProperties([
                'student_name' => $student->first_name.' '.$student->last_name,
            ])
            ->log('تم حذف الطالب نهائياً');

        $student->forceDelete();

        return redirect()->back()->with('success', 'تم حذف الطالب نهائياً');
    }

    /**
     * Search active (non-trashed) students that could be the canonical profile
     * for a duplicate being merged. Scoped to clubs the user can access.
     */
    public function mergeCandidates(Request $request): JsonResponse
    {
        $data = $request->validate([
            'q' => ['required', 'string', 'min:2'],
            'exclude' => ['nullable', 'integer'],
            'gender' => ['nullable', 'array'],
            'gender.*' => ['string', 'in:male,female'],
            'categories' => ['nullable', 'array'],
            'categories.*' => ['integer'],
            'clubs' => ['nullable', 'array'],
            'clubs.*' => ['integer'],
        ]);

        $user = Auth::user();
        $accessibleClubs = $user->accessibleClubs()->pluck('id')->toArray();

        $query = Student::query()
            ->whereIn('club_id', $accessibleClubs)
            ->with(['club:id,name', 'category:id,name']);

        if (! empty($data['exclude'])) {
            $query->where('id', '!=', $data['exclude']);
        }

        if (! empty($data['gender'])) {
            $query->whereIn('gender', $data['gender']);
        }

        if (! empty($data['categories'])) {
            $query->whereIn('category_id', $data['categories']);
        }

        if (! empty($data['clubs'])) {
            $query->whereIn('club_id', $data['clubs']);
        }

        $search = $data['q'];
        $connectionType = DB::getDriverName();
        if ($connectionType === 'sqlite') {
            $query->where(function ($q) use ($search) {
                $q->whereRaw("(first_name || ' ' || last_name) like ?", ["%{$search}%"])
                    ->orWhereRaw("(last_name || ' ' || first_name) like ?", ["%{$search}%"]);
            });
        } else {
            $query->where(function ($q) use ($search) {
                $q->whereRaw("CONCAT(first_name, ' ', last_name) like ?", ["%{$search}%"])
                    ->orWhereRaw("CONCAT(last_name, ' ', first_name) like ?", ["%{$search}%"]);
            });
        }

        $candidates = $query
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->limit(20)
            ->get([
                'id',
                'first_name',
                'last_name',
                'gender',
                'birthdate',
                'ahzab',
                'subscription',
                'subscription_expire_at',
                'insurance_expire_at',
                'club_id',
                'category_id',
            ])
            ->map(function (Student $student) {
                return [
                    'id' => $student->id,
                    'first_name' => $student->first_name,
                    'last_name' => $student->last_name,
                    'gender' => $student->gender,
                    'birthdate' => optional($student->birthdate)->toDateString(),
                    'ahzab' => $student->ahzab,
                    'subscription' => $student->subscription,
                    'subscription_expire_at' => optional($student->subscription_expire_at)->toDateString(),
                    'insurance_expire_at' => optional($student->insurance_expire_at)->toDateString(),
                    'club_name' => $student->club?->name,
                    'category_name' => $student->category?->name,
                ];
            });

        return response()->json(['candidates' => $candidates]);
    }

    /**
     * Return the duplicate's payments alongside the canonical's payments so the
     * admin can resolve them side-by-side. Each duplicate row carries an
     * `overlaps_canonical` flag (same type + overlapping date range, or two
     * insurance rows) to highlight likely conflicts.
     */
    public function mergePayload(string $trashedId, string $canonicalId): JsonResponse
    {
        $duplicate = Student::onlyTrashed()
            ->with('payments')
            ->findOrFail($trashedId);

        $canonical = Student::query()
            ->with('payments')
            ->findOrFail($canonicalId);

        $canonicalPayments = $canonical->payments;

        $duplicatePayments = $duplicate->payments->map(function (Payment $payment) use ($canonicalPayments) {
            $overlaps = $canonicalPayments->contains(function (Payment $other) use ($payment) {
                if ($other->type !== $payment->type) {
                    return false;
                }

                if ($payment->type === 'ins') {
                    return true;
                }

                if (! $payment->start_at || ! $payment->end_at || ! $other->start_at || ! $other->end_at) {
                    return false;
                }

                $aStart = Carbon::parse($payment->start_at);
                $aEnd = Carbon::parse($payment->end_at);
                $bStart = Carbon::parse($other->start_at);
                $bEnd = Carbon::parse($other->end_at);

                return $aStart->lessThanOrEqualTo($bEnd)
                    && $bStart->lessThanOrEqualTo($aEnd);
            });

            return $this->serializePayment($payment) + ['overlaps_canonical' => $overlaps];
        });

        return response()->json([
            'duplicate' => [
                'id' => $duplicate->id,
                'first_name' => $duplicate->first_name,
                'last_name' => $duplicate->last_name,
                'payments' => $duplicatePayments,
            ],
            'canonical' => [
                'id' => $canonical->id,
                'first_name' => $canonical->first_name,
                'last_name' => $canonical->last_name,
                'payments' => $canonicalPayments->map(fn (Payment $p) => $this->serializePayment($p)),
            ],
        ]);
    }

    /**
     * Reassign the chosen payments from the duplicate to the canonical, delete
     * the rest, then permanently delete the duplicate. All wrapped in a
     * transaction so a failure rolls everything back.
     */
    public function mergeAndDelete(MergeAndForceDeleteRequest $request, string $trashedId, string $canonicalId)
    {
        $duplicate = Student::onlyTrashed()->findOrFail($trashedId);
        $canonical = Student::query()->findOrFail($canonicalId);

        if ((int) $duplicate->id === (int) $canonical->id) {
            return redirect()->back()->with(
                'error',
                'لا يمكن دمج الطالب مع نفسه.'
            );
        }

        $transferIds = array_map('intval', $request->input('transfer_payment_ids', []));
        $deleteIds = array_map('intval', $request->input('delete_payment_ids', []));

        DB::transaction(function () use ($duplicate, $canonical, $transferIds, $deleteIds): void {
            if (! empty($transferIds)) {
                Payment::query()
                    ->whereIn('id', $transferIds)
                    ->where('student_id', $duplicate->id)
                    ->update(['student_id' => $canonical->id]);
            }

            if (! empty($deleteIds)) {
                Payment::query()
                    ->whereIn('id', $deleteIds)
                    ->where('student_id', $duplicate->id)
                    ->delete();
            }

            activity('student')
                ->performedOn($duplicate)
                ->causedBy(Auth::user())
                ->event('merged_and_force_deleted')
                ->withProperties([
                    'duplicate_name' => $duplicate->first_name.' '.$duplicate->last_name,
                    'canonical_id' => $canonical->id,
                    'canonical_name' => $canonical->first_name.' '.$canonical->last_name,
                    'transferred_payment_count' => count($transferIds),
                    'deleted_payment_count' => count($deleteIds),
                ])
                ->log('تم دمج الطالب المكرر مع الأصلي وحذفه نهائياً');

            $duplicate->forceDelete();
        });

        return redirect()
            ->route('students.index', ['archived' => 1])
            ->with('success', 'تم دمج الطالب المكرر مع الأصلي وحذفه نهائياً');
    }

    /**
     * @return array<string, mixed>
     */
    private function serializePayment(Payment $payment): array
    {
        return [
            'id' => $payment->id,
            'type' => $payment->type,
            'value' => $payment->value,
            'status' => $payment->status,
            'discount' => $payment->discount,
            'start_at' => $payment->start_at ? Carbon::parse($payment->start_at)->toDateTimeString() : null,
            'end_at' => $payment->end_at ? Carbon::parse($payment->end_at)->toDateTimeString() : null,
        ];
    }

    /**
     * Remove the specified resource from storage.
     */
    public function payment(string $id)
    {
        $student = Student::findOrFail($id);

        $student->delete();

        return redirect()->route('students.index')->with('success', 'تم حذف الطالب بنجاح');
    }
}
