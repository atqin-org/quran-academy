<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Program;
use App\Models\Subject;
use App\Models\Club;
use App\Models\Category;
use App\Actions\Program\CreateProgramAction;
use App\Actions\Program\GenerateProgramSessionsAction;

use function PHPSTORM_META\map;

class ProgramController extends Controller
{
    // عرض قائمة البرامج
    public function index(Request $request)
    {
        $perPage = 5;

        $programs = Program::with(['subject', 'club', 'category'])
            ->orderBy('created_at', 'desc')
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('Dashboard/Program/Index', [
            'programs' => $programs
        ]);
    }


    // نموذج إنشاء برنامج جديد
    public function create()
    {
        return Inertia::render('Dashboard/Program/Create', [
            'subjects'   => Subject::all(['id', 'name']),
            'clubs'      => Club::all(['id', 'name']),
            'categories' => Category::all(['id', 'name']),
            'days'       => [
                ["value" => "Sat", "label" => "السبت"],
                ["value" => "Sun", "label" => "الأحد"],
                ["value" => "Mon", "label" => "الإثنين"],
                ["value" => "Tue", "label" => "الثلاثاء"],
                ["value" => "Wed", "label" => "الأربعاء"],
                ["value" => "Thu", "label" => "الخميس"],
                ["value" => "Fri", "label" => "الجمعة"],
            ],
        ]);
    }

    // تخزين برنامج جديد
    public function store(Request $request)
    {
        $days = collect($request->input('days_of_week', []))
            ->pluck('value')
            ->toArray();

        $request->merge(['days_of_week' => $days]);
        $program = (new CreateProgramAction())->execute($request->all());

        // Check if custom sessions are provided
        $customSessions = $request->input('sessions', []);
        if (!empty($customSessions)) {
            // Use custom sessions from frontend
            (new GenerateProgramSessionsAction())->executeWithCustomSessions($program, $customSessions);
        } else {
            // Generate sessions automatically (fallback)
            (new GenerateProgramSessionsAction())->execute($program);
        }

        return redirect()->route('programs.index')->with('success', 'تم إنشاء البرنامج بنجاح');
    }

    // عرض تفاصيل برنامج واحد
    public function show(Program $program)
    {
        $program->load(['subject', 'club', 'category', 'sessions']);
        $now = now();


        $futureSessions = $program->sessions
            ->where('session_date', '>=', $now)
            ->sortBy('session_date')
            ->take(6)
            ->values(); // لإعادة الفهارس من 0

        $oldSessions = $program->sessions
            ->where('session_date', '<', $now)
            ->sortByDesc('session_date')
            ->values(); // الماضي بترتيب تنازلي (الأحدث أولاً)


        $programData = [
            'id' => $program->id,
            'subject_name' => $program->subject->name,
            'club_name' => $program->club->name,
            'category_name' => $program->category->name,
            'start_date' => $program->start_date ? $program->start_date->format('d/m/Y') : null,
            'end_date' => $program->end_date ? $program->end_date->format('d/m/Y') : null,
            'days_of_week' =>  $program->days_of_week,

            // الجلسات القادمة
            'future_sessions' => $futureSessions->map(function ($session) {
                return [
                    'id' => $session->id,
                    'session_date' => $session->session_date?->format('d/m/Y'),
                    'start_time' => $session->start_time
                        ? \Carbon\Carbon::parse($session->start_time)->format('H:i')
                        : null,
                    'end_time' => $session->end_time
                        ? \Carbon\Carbon::parse($session->end_time)->format('H:i')
                        : null,
                    'status' => $session->status,
                ];
            }),

            // الجلسات الماضية
            'old_sessions' => $oldSessions->map(function ($session) {
                return [
                    'id' => $session->id,
                    'session_date' => $session->session_date?->format('d/m/Y'),
                    'start_time' => $session->start_time
                        ? \Carbon\Carbon::parse($session->start_time)->format('H:i')
                        : null,
                    'end_time' => $session->end_time
                        ? \Carbon\Carbon::parse($session->end_time)->format('H:i')
                        : null,

                ];
            }),
        ];

        return Inertia::render('Dashboard/Program/Show', [
            'program' => $programData
        ]);
    }

    public function edit(Program $program)
    {
        // i want to return as lable and value

        $daysMap = [
            'Mon' => 'الإثنين',
            'Tue' => 'الثلاثاء',
            'Wed' => 'الأربعاء',
            'Thu' => 'الخميس',
            'Fri' => 'الجمعة',
            'Sat' => 'السبت',
            'Sun' => 'الأحد',
        ];

        // نتأكد أن القيمة Array (وليس نص JSON)
        $days = $program->days_of_week;
        if (is_string($days)) {
            $days = json_decode($days, true);
        }

        $formattedDays = collect($days)->map(function ($day) use ($daysMap) {
            return [
                'label' => $daysMap[$day] ?? $day,
                'value' => $day,
            ];
        });


        return Inertia::render('Dashboard/Program/Edit', [
            'program'    => [
                'id'          => $program->id,
                'name'        => $program->name,
                'description' => $program->description,
                'subject_id'  => $program->subject_id,
                'club_id'     => $program->club_id,
                'category_id' => $program->category_id,
                'days_of_week' =>  $formattedDays,
                'is_active'   => (bool) $program->is_active,
                'start_date'  => $program->start_date?->format('Y-m-d'),
                'end_date'    => $program->end_date?->format('Y-m-d'),
            ],
            'subjects'   => Subject::all(['id', 'name']),
            'clubs'      => Club::all(['id', 'name']),
            'categories' => Category::all(['id', 'name']),
            'days'       => [
                ["value" => "Sat", "label" => "السبت"],
                ["value" => "Sun", "label" => "الأحد"],
                ["value" => "Mon", "label" => "الإثنين"],
                ["value" => "Tue", "label" => "الثلاثاء"],
                ["value" => "Wed", "label" => "الأربعاء"],
                ["value" => "Thu", "label" => "الخميس"],
                ["value" => "Fri", "label" => "الجمعة"],
            ],
        ]);
    }


    // تحديث برنامج
    public function update(Request $request, Program $program)
    {
        $days = collect($request->input('days_of_week', []))
            ->pluck('value')
            ->toArray();

        $request->merge(['days_of_week' => $days]);
        $program->update($request->all());

        (new GenerateProgramSessionsAction())->execute($program);

        return redirect()->route('programs.index')->with('success', 'Program updated successfully.');
    }

    // حذف برنامج
    public function destroy(Program $program)
    {
        $program->delete();
        return redirect()->route('programs.index')->with('success', 'Program deleted successfully.');
    }
}
