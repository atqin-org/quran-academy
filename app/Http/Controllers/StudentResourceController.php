<?php

namespace App\Http\Controllers;

use App\Exports\StudentsExport;
use Maatwebsite\Excel\Facades\Excel;
use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Club;
use App\Models\Student;
use App\Models\Guardian;
use App\Rules\AtLeastOnePhone;
use App\Rules\FileOrString;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class StudentResourceController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Student::query();
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
        $students = $query->paginate(10, ['id', 'first_name', 'last_name', 'birthdate', 'ahzab', 'ahzab_up', 'ahzab_down', 'gender', 'insurance_expire_at', 'subscription', 'subscription_expire_at', 'club_id', 'category_id'])->withQueryString();

        $students->getCollection()->transform(function ($student) {
            $student->name = $student->first_name . ' ' . $student->last_name;
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
        $genderCounts = Student::select('gender', DB::raw('count(*) as total'))
            ->whereIn('club_id', $accessibleClubs)
            ->groupBy('gender')->get();

        $categoryCounts = Category::withCount(['students' => function ($query) use ($accessibleClubs) {
            $query->whereIn('club_id', $accessibleClubs);
        }])->get();

        $clubCounts = Club::withCount(['students' => function ($query) use ($accessibleClubs) {
            $query->whereIn('club_id', $accessibleClubs);
        }])->whereIn('id', $accessibleClubs)->get();
       
        return Inertia::render(
            'Dashboard/Students/Index',
            [
                'students' => $students,
                'dataDependencies' => [
                    'clubs' => $clubCounts,
                    'categories' => $categoryCounts,
                    'genders' => $genderCounts,
                ]
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

        return Excel::download($export, 'students-' . now()->format('Y-m-d') . '.xlsx');
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
                'categories' => Category::all()
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
                'before:' . now()->subYears(3)->format('Y-m-d'),
                'after:' . now()->subYears(100)->format('Y-m-d'),
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
            'picture' => 'nullable|mimes:jpg,jpeg,png,pdf|max:6144', // 6144 KB = 6 MB
            'file' => 'nullable|mimes:jpg,jpeg,png,pdf|max:6144',    // 6144 KB = 6 MB
        ]);

        //TODO: check if this student was deleted before from the same club

        $father_id = Guardian::create([
            'phone' => $request->father["phone"],
            'name' => $request->father["name"],
            'job' => $request->father["job"],
            'gender' => 'male',
        ])->id;
        $mother_id = Guardian::create([
            'phone' => $request->mother["phone"],
            'name' => $request->mother["name"],
            'job' => $request->mother["job"],
            'gender' => 'female',
        ])->id;
        //add $father_id and $mother_id to the student
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
        $student = Student::with([
            'club',
            'category',
            'father',
            'mother',
            'attendances.session'
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
                Carbon::parse($endDate)->endOfDay()
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
            'absent'  => (clone $statsQuery)->where('status', 'absent')->count(),
            'excused' => (clone $statsQuery)->where('status', 'excused')->count(),
            'total'   => (clone $statsQuery)->count(),
        ];

        // Calculate attendance rate
        $attendanceStats['rate'] = $attendanceStats['total'] > 0
            ? round(($attendanceStats['present'] / $attendanceStats['total']) * 100, 1)
            : 0;

        // آخر مستوى تقدّم
        $lastHizb = $student->attendances()->whereNotNull('hizb_id')->latest()->first();
        $progress = $lastHizb ? round(($lastHizb->hizb_id / $totalHizb) * 100, 2) : 0;

        // التقدّم بمرور الوقت (with time filter)
        $progressTimeline = $progressQuery
            ->whereNotNull('hizb_id')
            ->orderBy('created_at')
            ->get()
            ->map(function ($attendance) use ($totalHizb) {
                return [
                    'date' => $attendance->created_at->format('Y-m-d'),
                    'progress' => round(($attendance->hizb_id / $totalHizb) * 100, 2),
                ];
            })
            ->values();

        // Monthly attendance breakdown for the chart (SQLite compatible)
        $monthlyAttendance = $student->attendances()
            ->selectRaw("strftime('%Y', created_at) as year, strftime('%m', created_at) as month, status, COUNT(*) as count")
            ->when($range !== 'all', function ($q) use ($range, $startDate, $endDate) {
                if ($range === 'custom' && $startDate && $endDate) {
                    return $q->whereBetween('created_at', [
                        Carbon::parse($startDate)->startOfDay(),
                        Carbon::parse($endDate)->endOfDay()
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
                'name' => $student->first_name . ' ' . $student->last_name,
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
            ],
            'progress' => $progress,
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
                'categories' => Category::all()
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
                'before:' . now()->subYears(3)->format('Y-m-d'),
                'after:' . now()->subYears(100)->format('Y-m-d'),
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
            'picture' => ['nullable', new FileOrString],
            'file' => ['nullable', new FileOrString],
        ]);
        // Find the student by ID
        $student = Student::findOrFail($id)->load('father', 'mother');

        $father = Guardian::find($student->father_id);
        $mother = Guardian::find($student->mother_id);
        if ($father) {
            $father->update([
                'phone' => $request->father["phone"],
                'name' => $request->father["name"],
                'job' => $request->father["job"],
            ]);
        } else {
            $father = Guardian::create([
                'phone' => $request->father["phone"],
                'name' => $request->father["name"],
                'job' => $request->father["job"],
                'gender' => 'male',
            ]);
            $student->father_id = $father->id;
        }
        if ($mother) {
            $mother->update([
                'phone' => $request->mother["phone"],
                'name' => $request->mother["name"],
                'job' => $request->mother["job"],
            ]);
        } else {
            $mother = Guardian::create([
                'phone' => $request->mother["phone"],
                'name' => $request->mother["name"],
                'job' => $request->mother["job"],
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

        return redirect()->route('students.index')->with('success', 'تم حذف الطالب بنجاح');
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
