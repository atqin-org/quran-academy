<?php

namespace App\Http\Controllers;

use App\Actions\Program\CreateProgramAction;
use App\Actions\Program\GenerateProgramSessionsAction;
use App\Models\Category;
use App\Models\Club;
use App\Models\Program;
use App\Models\Subject;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

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
            'programs' => $programs,
        ]);
    }

    // نموذج إنشاء برنامج جديد
    public function create()
    {
        return Inertia::render('Dashboard/Program/Create', [
            'subjects' => Subject::all(['id', 'name']),
            'clubs' => Club::all(['id', 'name']),
            'categories' => Category::all(['id', 'name', 'gender']),
            'days' => [
                ['value' => 'Sat', 'label' => 'السبت'],
                ['value' => 'Sun', 'label' => 'الأحد'],
                ['value' => 'Mon', 'label' => 'الإثنين'],
                ['value' => 'Tue', 'label' => 'الثلاثاء'],
                ['value' => 'Wed', 'label' => 'الأربعاء'],
                ['value' => 'Thu', 'label' => 'الخميس'],
                ['value' => 'Fri', 'label' => 'الجمعة'],
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
        $program = (new CreateProgramAction)->execute($request->all());

        // Check if custom sessions are provided
        $customSessions = $request->input('sessions', []);
        if (! empty($customSessions)) {
            // Use custom sessions from frontend
            (new GenerateProgramSessionsAction)->executeWithCustomSessions($program, $customSessions);
        } else {
            // Generate sessions automatically (fallback)
            (new GenerateProgramSessionsAction)->execute($program);
        }

        // Log program creation
        activity('program')
            ->performedOn($program)
            ->causedBy(Auth::user())
            ->event('created')
            ->withProperties([
                'program_name' => $program->name,
                'sessions_count' => $program->sessions()->count(),
            ])
            ->log("تم إنشاء البرنامج: {$program->name}");

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
            'days_of_week' => $program->days_of_week,

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
            'program' => $programData,
        ]);
    }

    public function edit(Program $program)
    {
        $program->load('sessions');

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
        })->values()->toArray();

        // Format existing sessions for frontend
        $existingSessions = $program->sessions->map(function ($session) {
            return [
                'id' => $session->id,
                'date' => $session->session_date?->format('Y-m-d'),
                'start_time' => $session->start_time
                    ? \Carbon\Carbon::parse($session->start_time)->format('H:i')
                    : null,
                'end_time' => $session->end_time
                    ? \Carbon\Carbon::parse($session->end_time)->format('H:i')
                    : null,
                'status' => $session->status,
            ];
        })->values()->toArray();

        return Inertia::render('Dashboard/Program/Edit', [
            'program' => [
                'id' => $program->id,
                'name' => $program->name,
                'description' => $program->description,
                'subject_id' => $program->subject_id,
                'club_id' => $program->club_id,
                'category_id' => $program->category_id,
                'group_id' => $program->group_id,
                'days_of_week' => $formattedDays,
                'is_active' => (bool) $program->is_active,
                'start_date' => $program->start_date?->format('Y-m-d'),
                'end_date' => $program->end_date?->format('Y-m-d'),
                'sessions' => $existingSessions,
            ],
            'subjects' => Subject::all(['id', 'name']),
            'clubs' => Club::all(['id', 'name']),
            'categories' => Category::all(['id', 'name', 'gender']),
        ]);
    }

    // تحديث برنامج
    public function update(Request $request, Program $program)
    {
        $oldData = $program->toArray();

        $days = collect($request->input('days_of_week', []))
            ->pluck('value')
            ->toArray();

        $request->merge(['days_of_week' => $days]);
        $program->update($request->only(['name', 'subject_id', 'club_id', 'category_id', 'group_id', 'days_of_week', 'start_date', 'end_date']));

        // Check if custom sessions are provided
        $customSessions = $request->input('sessions', []);
        if (! empty($customSessions)) {
            // Delete existing sessions that are not in the new list
            $program->sessions()->delete();
            // Use custom sessions from frontend
            (new GenerateProgramSessionsAction)->executeWithCustomSessions($program, $customSessions);
        } else {
            // Regenerate sessions automatically (fallback)
            (new GenerateProgramSessionsAction)->execute($program);
        }

        // Log program update
        activity('program')
            ->performedOn($program)
            ->causedBy(Auth::user())
            ->event('updated')
            ->withProperties([
                'old' => $oldData,
                'new' => $program->fresh()->toArray(),
            ])
            ->log("تم تحديث البرنامج: {$program->name}");

        return redirect()->route('programs.index')->with('success', 'تم تحديث البرنامج بنجاح');
    }

    // حذف برنامج
    public function destroy(Program $program)
    {
        $programName = $program->name;
        $programId = $program->id;

        $program->delete();

        // Log program deletion
        activity('program')
            ->causedBy(Auth::user())
            ->event('deleted')
            ->withProperties([
                'program_id' => $programId,
                'program_name' => $programName,
            ])
            ->log("تم حذف البرنامج: {$programName}");

        return redirect()->route('programs.index')->with('success', 'تم حذف البرنامج بنجاح');
    }
}
