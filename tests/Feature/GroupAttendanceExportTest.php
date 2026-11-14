<?php

use App\Exports\GroupAttendanceExport;
use App\Exports\GroupAttendanceSheetExport;
use App\Models\Attendance;
use App\Models\Category;
use App\Models\Club;
use App\Models\Group;
use App\Models\Program;
use App\Models\ProgramSession;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Maatwebsite\Excel\Excel as ExcelWriter;
use Maatwebsite\Excel\Facades\Excel;
use PhpOffice\PhpSpreadsheet\IOFactory;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->club = Club::factory()->create();
    $this->category = Category::factory()->create();
    $this->admin = User::factory()->create(['role' => 'admin']);

    $this->groupA = Group::factory()->create([
        'club_id' => $this->club->id,
        'category_id' => $this->category->id,
        'name' => 'أ',
        'order' => 1,
    ]);
    $this->groupB = Group::factory()->create([
        'club_id' => $this->club->id,
        'category_id' => $this->category->id,
        'name' => 'ب',
        'order' => 2,
    ]);

    $this->classProgram = Program::factory()->create([
        'club_id' => $this->club->id,
        'category_id' => $this->category->id,
        'group_id' => null,
    ]);
});

function attendanceStudent(string $firstName, ?Group $group = null): Student
{
    return Student::factory()->create([
        'club_id' => test()->club->id,
        'category_id' => test()->category->id,
        'group_id' => $group?->id,
        'first_name' => $firstName,
        'last_name' => 'الطالب',
    ]);
}

function attendanceSession(Program $program, string $date, string $status = 'completed'): ProgramSession
{
    return ProgramSession::factory()->create([
        'program_id' => $program->id,
        'session_date' => $date,
        'start_time' => '16:00',
        'end_time' => '17:00',
        'status' => $status,
    ]);
}

function markAttendance(ProgramSession $session, Student $student, string $status, ?Group $group = null): Attendance
{
    return Attendance::factory()->create([
        'session_id' => $session->id,
        'student_id' => $student->id,
        'group_id' => $group?->id,
        'status' => $status,
        'excusedReason' => null,
    ]);
}

/**
 * @param  list<int>|null  $groupIds
 * @return list<GroupAttendanceSheetExport>
 */
function attendanceSheets(string $layout = GroupAttendanceExport::LAYOUT_PER_GROUP, ?array $groupIds = null): array
{
    return (new GroupAttendanceExport(
        test()->club,
        test()->category,
        Carbon::parse('2026-03-01'),
        Carbon::parse('2026-03-31'),
        $layout,
        $groupIds,
    ))->sheets();
}

function attendanceExportUrl(array $query = []): string
{
    return route('groups.attendanceExport', array_merge([
        'club' => test()->club->id,
        'category' => test()->category->id,
        'from' => '2026-03-01',
        'to' => '2026-03-31',
        'layout' => 'per_group',
    ], $query));
}

// -------------------------------------------------------
// Endpoint
// -------------------------------------------------------

it('lets an admin download the attendance register', function () {
    attendanceStudent('أحمد', $this->groupA);

    $this->actingAs($this->admin)
        ->get(attendanceExportUrl())
        ->assertOk()
        ->assertDownload('attendance-club'.$this->club->id.'-cat'.$this->category->id.'-2026-03-01_2026-03-31.xlsx');
});

it('forbids staff without access to the class', function () {
    $otherCategory = Category::factory()->create();
    $staff = User::factory()->create(['role' => 'staff']);
    $staff->clubs()->attach($this->club->id);
    $staff->categoryRestrictions()->attach($otherCategory, ['club_id' => $this->club->id]);

    $this->actingAs($staff)->get(attendanceExportUrl())->assertForbidden();
});

it('lets staff restricted to the class download it', function () {
    $staff = User::factory()->create(['role' => 'staff']);
    $staff->clubs()->attach($this->club->id);
    $staff->categoryRestrictions()->attach($this->category, ['club_id' => $this->club->id]);

    $this->actingAs($staff)->get(attendanceExportUrl())->assertOk()->assertDownload();
});

it('redirects guests to login', function () {
    $this->get(attendanceExportUrl())->assertRedirect(route('login'));
});

it('validates the export parameters', function (array $query, string $errorKey) {
    $this->actingAs($this->admin)
        ->get(attendanceExportUrl($query))
        ->assertSessionHasErrors($errorKey);
})->with([
    'missing from' => [['from' => null], 'from'],
    'missing to' => [['to' => null], 'to'],
    'malformed from' => [['from' => '01/03/2026'], 'from'],
    'to before from' => [['from' => '2026-03-10', 'to' => '2026-03-01'], 'to'],
    'missing layout' => [['layout' => null], 'layout'],
    'unknown layout' => [['layout' => 'by_teacher'], 'layout'],
    'group ids not a list' => [['group_ids' => 'all'], 'group_ids'],
    'unknown group' => [['group_ids' => [999999]], 'group_ids.0'],
]);

it('rejects groups that belong to another class', function () {
    $foreignGroup = Group::factory()->create();

    $this->actingAs($this->admin)
        ->get(attendanceExportUrl(['group_ids' => [$this->groupA->id, $foreignGroup->id]]))
        ->assertSessionHasErrors('group_ids');
});

it('logs the export', function () {
    $this->actingAs($this->admin)->get(attendanceExportUrl())->assertOk();

    $this->assertDatabaseHas('activity_log', [
        'log_name' => 'group',
        'causer_id' => $this->admin->id,
        'description' => "تم تصدير سجل الحضور: {$this->club->name} - {$this->category->display_name}",
    ]);
});

// -------------------------------------------------------
// Sheet per group
// -------------------------------------------------------

it('builds one sheet per group with marks and totals', function () {
    $ahmed = attendanceStudent('أحمد', $this->groupA);
    $bassem = attendanceStudent('باسم', $this->groupA);
    $tarek = attendanceStudent('طارق', $this->groupB);

    $first = attendanceSession($this->classProgram, '2026-03-03');
    $second = attendanceSession($this->classProgram, '2026-03-10');

    markAttendance($first, $ahmed, 'present', $this->groupA);
    markAttendance($second, $ahmed, 'absent', $this->groupA);
    markAttendance($first, $bassem, 'excused', $this->groupA);
    markAttendance($first, $tarek, 'late_excused', $this->groupB);
    markAttendance($second, $tarek, 'kicked', $this->groupB);

    $sheets = attendanceSheets();

    expect($sheets)->toHaveCount(2)
        ->and($sheets[0]->title())->toBe('فوج أ')
        ->and($sheets[1]->title())->toBe('فوج ب')
        ->and($sheets[0]->headings())->toBe([
            'م', 'الاسم واللقب', '03/03/2026', '10/03/2026',
            'حاضر', 'غائب', 'غائب بعذر', 'متأخر بعذر', 'مطرود',
        ])
        ->and($sheets[0]->rows())->toBe([
            [1, 'أحمد الطالب', 'ح', 'غ', 1, 1, 0, 0, 0],
            [2, 'باسم الطالب', 'ع', null, 0, 0, 1, 0, 0],
        ])
        ->and($sheets[1]->rows())->toBe([
            [1, 'طارق الطالب', 'م', 'ط', 0, 0, 0, 1, 1],
        ]);
});

it('adds a sheet for students without a group', function () {
    attendanceStudent('أحمد', $this->groupA);
    $free = attendanceStudent('سليم');
    $session = attendanceSession($this->classProgram, '2026-03-03');
    markAttendance($session, $free, 'present');

    $sheets = attendanceSheets();

    expect(collect($sheets)->map->title()->all())->toBe(['فوج أ', 'فوج ب', 'بدون فوج'])
        ->and($sheets[2]->rows())->toBe([[1, 'سليم الطالب', 'ح', 1, 0, 0, 0, 0]]);
});

it('ignores sessions outside the period and cancelled sessions', function () {
    $ahmed = attendanceStudent('أحمد', $this->groupA);

    $before = attendanceSession($this->classProgram, '2026-02-28');
    $firstDay = attendanceSession($this->classProgram, '2026-03-01');
    $cancelled = attendanceSession($this->classProgram, '2026-03-15', 'canceled');
    $lastDay = attendanceSession($this->classProgram, '2026-03-31', 'scheduled');
    $after = attendanceSession($this->classProgram, '2026-04-01');

    foreach ([$before, $firstDay, $cancelled, $after] as $session) {
        markAttendance($session, $ahmed, 'present', $this->groupA);
    }

    $sheet = attendanceSheets()[0];

    expect(array_slice($sheet->headings(), 2, 2))->toBe(['01/03/2026', '31/03/2026'])
        ->and($sheet->rows())->toBe([[1, 'أحمد الطالب', 'ح', null, 1, 0, 0, 0, 0]]);
});

it('shows a group program only on that group sheet', function () {
    attendanceStudent('أحمد', $this->groupA);
    attendanceStudent('طارق', $this->groupB);

    $groupProgram = Program::factory()->create([
        'club_id' => $this->club->id,
        'category_id' => $this->category->id,
        'group_id' => $this->groupB->id,
    ]);

    attendanceSession($this->classProgram, '2026-03-03');
    attendanceSession($groupProgram, '2026-03-04');

    $sheets = attendanceSheets();

    expect(array_slice($sheets[0]->headings(), 2, -5))->toHaveCount(1)
        ->and(array_slice($sheets[1]->headings(), 2, -5))->toHaveCount(2)
        ->and($sheets[1]->headings()[2])->toStartWith('03/03/2026')
        ->and($sheets[1]->headings()[3])->toStartWith('04/03/2026');
});

it('keeps a transferred student on the old group sheet for sessions recorded there', function () {
    attendanceStudent('أحمد', $this->groupA);
    $moved = attendanceStudent('مراد', $this->groupB);

    $early = attendanceSession($this->classProgram, '2026-03-03');
    $late = attendanceSession($this->classProgram, '2026-03-20');

    markAttendance($early, $moved, 'present', $this->groupA);
    markAttendance($late, $moved, 'absent', $this->groupB);

    $sheets = attendanceSheets();

    expect($sheets[0]->rows())->toBe([
        [1, 'أحمد الطالب', null, null, 0, 0, 0, 0, 0],
        [2, 'مراد الطالب (سابقًا)', 'ح', null, 1, 0, 0, 0, 0],
    ])->and($sheets[1]->rows())->toBe([
        [1, 'مراد الطالب', 'ح', 'غ', 1, 1, 0, 0, 0],
    ]);
});

it('keeps an archived student who attended during the period', function () {
    $archived = attendanceStudent('رضا', $this->groupA);
    $session = attendanceSession($this->classProgram, '2026-03-03');
    markAttendance($session, $archived, 'present', $this->groupA);
    $archived->delete();

    expect(attendanceSheets()[0]->rows())->toBe([
        [1, 'رضا الطالب (سابقًا)', 'ح', 1, 0, 0, 0, 0],
    ]);
});

it('limits the sheets to the selected groups', function () {
    attendanceStudent('أحمد', $this->groupA);
    attendanceStudent('طارق', $this->groupB);
    attendanceStudent('سليم');

    $sheets = attendanceSheets(GroupAttendanceExport::LAYOUT_PER_GROUP, [$this->groupB->id]);

    expect($sheets)->toHaveCount(1)
        ->and($sheets[0]->title())->toBe('فوج ب')
        ->and($sheets[0]->rows())->toBe([[1, 'طارق الطالب', 0, 0, 0, 0, 0]]);
});

// -------------------------------------------------------
// Single sheet
// -------------------------------------------------------

it('builds a single sheet with a group column', function () {
    $ahmed = attendanceStudent('أحمد', $this->groupA);
    $free = attendanceStudent('سليم');
    $tarek = attendanceStudent('طارق', $this->groupB);

    $session = attendanceSession($this->classProgram, '2026-03-03');
    markAttendance($session, $ahmed, 'present', $this->groupA);
    markAttendance($session, $tarek, 'absent', $this->groupB);

    $sheets = attendanceSheets(GroupAttendanceExport::LAYOUT_SINGLE);

    expect($sheets)->toHaveCount(1)
        ->and($sheets[0]->title())->toBe('الحضور')
        ->and(array_slice($sheets[0]->headings(), 0, 4))->toBe(['م', 'الاسم واللقب', 'الفوج', '03/03/2026'])
        ->and($sheets[0]->rows())->toBe([
            [1, 'أحمد الطالب', 'أ', 'ح', 1, 0, 0, 0, 0],
            [2, 'سليم الطالب', '—', null, 0, 0, 0, 0, 0],
            [3, 'طارق الطالب', 'ب', 'غ', 0, 1, 0, 0, 0],
        ]);
});

it('limits the single sheet to the selected groups', function () {
    attendanceStudent('أحمد', $this->groupA);
    attendanceStudent('طارق', $this->groupB);
    attendanceStudent('سليم');

    $sheets = attendanceSheets(GroupAttendanceExport::LAYOUT_SINGLE, [$this->groupA->id]);

    expect($sheets)->toHaveCount(1)
        ->and($sheets[0]->rows())->toBe([[1, 'أحمد الطالب', 'أ', 0, 0, 0, 0, 0]]);
});

it('exports a class without groups as one sheet without a group column', function () {
    $this->groupA->delete();
    $this->groupB->delete();
    $student = attendanceStudent('أحمد');
    $session = attendanceSession($this->classProgram, '2026-03-03');
    markAttendance($session, $student, 'present');

    $sheets = attendanceSheets();

    expect($sheets)->toHaveCount(1)
        ->and($sheets[0]->title())->toBe('الحضور')
        ->and($sheets[0]->headings())->not->toContain('الفوج')
        ->and($sheets[0]->rows())->toBe([[1, 'أحمد الطالب', 'ح', 1, 0, 0, 0, 0]]);
});

it('labels sessions with their subject when the class has several programs', function () {
    attendanceStudent('أحمد', $this->groupA);
    $otherProgram = Program::factory()->create([
        'club_id' => $this->club->id,
        'category_id' => $this->category->id,
        'group_id' => null,
    ]);

    attendanceSession($this->classProgram, '2026-03-03');
    attendanceSession($otherProgram, '2026-03-04');

    $headings = attendanceSheets()[0]->headings();

    expect($headings[2])->toBe("03/03/2026\n".$this->classProgram->subject->name)
        ->and($headings[3])->toBe("04/03/2026\n".$otherProgram->subject->name);
});

it('does not leak students or sessions of other classes', function () {
    attendanceStudent('أحمد', $this->groupA);

    $otherCategory = Category::factory()->create();
    Student::factory()->create(['club_id' => $this->club->id, 'category_id' => $otherCategory->id]);
    $otherProgram = Program::factory()->create(['club_id' => $this->club->id, 'category_id' => $otherCategory->id]);
    attendanceSession($otherProgram, '2026-03-05');

    $sheet = attendanceSheets(GroupAttendanceExport::LAYOUT_SINGLE)[0];

    expect($sheet->rows())->toBe([[1, 'أحمد الطالب', 'أ', 0, 0, 0, 0, 0]]);
});

// -------------------------------------------------------
// Generated file
// -------------------------------------------------------

it('writes a readable right-to-left workbook', function () {
    $ahmed = attendanceStudent('=SUM(1,1)', $this->groupA);
    attendanceStudent('طارق', $this->groupB);
    $session = attendanceSession($this->classProgram, '2026-03-03');
    markAttendance($session, $ahmed, 'present', $this->groupA);

    $export = new GroupAttendanceExport(
        $this->club,
        $this->category,
        Carbon::parse('2026-03-01'),
        Carbon::parse('2026-03-31'),
    );

    $path = tempnam(sys_get_temp_dir(), 'attendance').'.xlsx';
    file_put_contents($path, Excel::raw($export, ExcelWriter::XLSX));
    $workbook = IOFactory::load($path);
    unlink($path);

    $sheet = $workbook->getSheetByName('فوج أ');

    expect($workbook->getSheetNames())->toBe(['فوج أ', 'فوج ب'])
        ->and($sheet->getRightToLeft())->toBeTrue()
        ->and($sheet->getCell('B3')->getValue())->toBe('سجل الحضور')
        ->and($sheet->getCell('B5')->getValue())->toBe('الفترة: من 01/03/2026 إلى 31/03/2026')
        ->and($sheet->getCell('C8')->getValue())->toBe('03/03/2026')
        ->and($sheet->getCell('B9')->getValue())->toBe('=SUM(1,1) الطالب')
        ->and($sheet->getCell('B9')->getDataType())->toBe('s')
        ->and($sheet->getCell('C9')->getValue())->toBe('ح')
        ->and($sheet->getCell('D9')->getDataType())->toBe('n')
        ->and($sheet->getCell('D9')->getValue())->toEqual(1)
        ->and($sheet->getConditionalStyles('C9'))->toHaveCount(5);
});

it('notes when the period has no sessions', function () {
    attendanceStudent('أحمد', $this->groupA);

    $sheet = attendanceSheets()[0];

    expect($sheet->array()[6][1])->toBe(GroupAttendanceSheetExport::NO_SESSIONS_NOTE)
        ->and($sheet->rows())->toBe([[1, 'أحمد الطالب', 0, 0, 0, 0, 0]]);
});
