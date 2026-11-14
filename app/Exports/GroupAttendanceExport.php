<?php

namespace App\Exports;

use App\Models\Attendance;
use App\Models\Category;
use App\Models\Club;
use App\Models\Group;
use App\Models\ProgramSession;
use App\Models\Student;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;

/**
 * Attendance register of a class (club + category) over a period:
 * one row per student, one column per session, then totals per status.
 */
class GroupAttendanceExport implements WithMultipleSheets
{
    public const LAYOUT_PER_GROUP = 'per_group';

    public const LAYOUT_SINGLE = 'single';

    public const LAYOUTS = [self::LAYOUT_PER_GROUP, self::LAYOUT_SINGLE];

    private const FORMER_STUDENT_SUFFIX = ' (سابقًا)';

    /** @var Collection<int, ProgramSession> */
    private Collection $sessions;

    /** @var Collection<int, Student> */
    private Collection $currentStudents;

    /** @var Collection<int, Student> */
    private Collection $formerStudents;

    /** @var Collection<int, Collection<int, Attendance>> */
    private Collection $attendancesByStudent;

    /** @var Collection<int, string> */
    private Collection $groupNames;

    /**
     * @param  list<int>|null  $groupIds  Limit the export to these groups; null exports the whole class.
     */
    public function __construct(
        private Club $club,
        private Category $category,
        private CarbonInterface $from,
        private CarbonInterface $to,
        private string $layout = self::LAYOUT_PER_GROUP,
        private ?array $groupIds = null,
    ) {}

    /**
     * @return list<GroupAttendanceSheetExport>
     */
    public function sheets(): array
    {
        $this->loadData();

        $groups = $this->selectedGroups();

        if ($groups->isEmpty()) {
            return [$this->buildSheet('الحضور', 'كل الطلاب', null, false)];
        }

        if ($this->layout === self::LAYOUT_SINGLE) {
            $label = $this->groupIds === null
                ? 'كل الأفواج'
                : $groups->map(fn (Group $group) => $group->name)->join('، ');

            return [$this->buildSheet('الحضور', $label, $this->groupIds, true)];
        }

        $sheets = $groups
            ->map(fn (Group $group) => $this->buildSheet("فوج {$group->name}", $group->name, [$group->id], false))
            ->values()
            ->all();

        if ($this->groupIds === null) {
            $ungroupedSheet = $this->buildSheet('بدون فوج', 'بدون فوج', [null], false);

            if ($ungroupedSheet->rows() !== []) {
                $sheets[] = $ungroupedSheet;
            }
        }

        return $sheets;
    }

    private function loadData(): void
    {
        $this->sessions = ProgramSession::query()
            ->with('program.subject')
            ->whereHas('program', function ($query) {
                $query->where('club_id', $this->club->id)->where('category_id', $this->category->id);
            })
            ->where('status', '!=', 'canceled')
            ->whereDate('session_date', '>=', $this->from->toDateString())
            ->whereDate('session_date', '<=', $this->to->toDateString())
            ->orderBy('session_date')
            ->orderBy('start_time')
            ->orderBy('id')
            ->get();

        $attendances = Attendance::query()
            ->whereIn('session_id', $this->sessions->modelKeys())
            ->get(['id', 'session_id', 'student_id', 'group_id', 'status']);

        $this->attendancesByStudent = $attendances
            ->groupBy('student_id')
            ->map(fn (Collection $rows) => $rows->toBase()->keyBy('session_id'));

        $this->currentStudents = Student::query()
            ->where('club_id', $this->club->id)
            ->where('category_id', $this->category->id)
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get(['id', 'first_name', 'last_name', 'group_id'])
            ->keyBy('id');

        $this->formerStudents = Student::withTrashed()
            ->whereIn('id', $this->attendancesByStudent->keys()->diff($this->currentStudents->keys()))
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get(['id', 'first_name', 'last_name', 'group_id'])
            ->keyBy('id');

        $this->groupNames = Group::withTrashed()
            ->where('club_id', $this->club->id)
            ->where('category_id', $this->category->id)
            ->pluck('name', 'id');
    }

    /**
     * @return Collection<int, Group>
     */
    private function selectedGroups(): Collection
    {
        return Group::query()
            ->where('club_id', $this->club->id)
            ->where('category_id', $this->category->id)
            ->where('is_active', true)
            ->when($this->groupIds !== null, fn ($query) => $query->whereIn('id', $this->groupIds))
            ->orderBy('order')
            ->get();
    }

    /**
     * Build one sheet for a scope of groups.
     *
     * @param  list<int|null>|null  $scope  Group ids covered by the sheet (null entry = students without a group); null covers the whole class.
     */
    private function buildSheet(string $title, string $groupLabel, ?array $scope, bool $showGroupColumn): GroupAttendanceSheetExport
    {
        $sessions = $this->sessions
            ->filter(fn (ProgramSession $session) => $session->program->group_id === null
                || $this->isInScope($session->program->group_id, $scope))
            ->values();

        $sessionIds = $sessions->modelKeys();

        $members = $this->currentStudents
            ->filter(fn (Student $student) => $this->isInScope($student->group_id, $scope));

        $rows = $members
            ->map(fn (Student $student) => [
                'name' => $this->fullName($student),
                'group' => $this->groupName($student->group_id),
                'statuses' => $this->statusesFor($student->id, $sessionIds),
            ])
            ->values()
            ->all();

        foreach ($this->pastParticipants($members, $sessionIds, $scope) as $studentId => $attendances) {
            $student = $this->currentStudents->get($studentId) ?? $this->formerStudents->get($studentId);

            if ($student === null) {
                continue;
            }

            $rows[] = [
                'name' => $this->fullName($student).self::FORMER_STUDENT_SUFFIX,
                'group' => $this->groupName($attendances->last()->group_id),
                'statuses' => array_map(
                    fn (int $sessionId) => $attendances->get($sessionId)?->status,
                    $sessionIds
                ),
            ];
        }

        return new GroupAttendanceSheetExport(
            title: $title,
            clubName: $this->club->name,
            categoryName: $this->category->display_name,
            groupLabel: $groupLabel,
            from: $this->from,
            to: $this->to,
            sessionHeadings: $this->sessionHeadings($sessions),
            students: $rows,
            showGroupColumn: $showGroupColumn,
        );
    }

    /**
     * Students who are no longer members of the scope but have attendance recorded under it,
     * with only the attendances that were recorded under that scope.
     *
     * @param  Collection<int, Student>  $members
     * @param  list<int>  $sessionIds
     * @param  list<int|null>|null  $scope
     * @return Collection<int, Collection<int, Attendance>>
     */
    private function pastParticipants(Collection $members, array $sessionIds, ?array $scope): Collection
    {
        $candidates = $this->currentStudents->concat($this->formerStudents)
            ->reject(fn (Student $student) => $members->has($student->id));

        return $candidates
            ->mapWithKeys(function (Student $student) use ($sessionIds, $scope) {
                $stillInClass = $this->currentStudents->has($student->id);

                $attendances = $this->attendancesByStudent
                    ->get($student->id, collect())
                    ->only($sessionIds)
                    ->filter(function (Attendance $attendance) use ($scope, $stillInClass) {
                        if ($attendance->group_id === null && $stillInClass) {
                            return false;
                        }

                        return $this->isInScope($attendance->group_id, $scope);
                    });

                return [$student->id => $attendances];
            })
            ->filter(fn (Collection $attendances) => $attendances->isNotEmpty());
    }

    /**
     * @param  list<int|null>|null  $scope
     */
    private function isInScope(?int $groupId, ?array $scope): bool
    {
        return $scope === null || in_array($groupId, $scope, true);
    }

    /**
     * @param  list<int>  $sessionIds
     * @return list<string|null>
     */
    private function statusesFor(int $studentId, array $sessionIds): array
    {
        $attendances = $this->attendancesByStudent->get($studentId, collect());

        return array_map(fn (int $sessionId) => $attendances->get($sessionId)?->status, $sessionIds);
    }

    /**
     * Column heading per session: the date, plus the subject when several programs share the
     * sheet and the start time when several sessions fall on the same day.
     *
     * @param  Collection<int, ProgramSession>  $sessions
     * @return list<string>
     */
    private function sessionHeadings(Collection $sessions): array
    {
        $hasSeveralPrograms = $sessions->pluck('program_id')->unique()->count() > 1;
        $sessionsPerDay = $sessions->countBy(fn (ProgramSession $session) => $session->session_date->toDateString());

        return $sessions
            ->map(function (ProgramSession $session) use ($hasSeveralPrograms, $sessionsPerDay) {
                $lines = [$session->session_date->format('d/m/Y')];

                if ($hasSeveralPrograms) {
                    $lines[] = $session->program->subject?->name ?? $session->program->name;
                }

                if ($session->start_time && $sessionsPerDay->get($session->session_date->toDateString()) > 1) {
                    $lines[] = $session->start_time->format('H:i');
                }

                return implode("\n", $lines);
            })
            ->all();
    }

    private function groupName(?int $groupId): ?string
    {
        return $groupId === null ? null : $this->groupNames->get($groupId);
    }

    private function fullName(Student $student): string
    {
        return trim($student->first_name.' '.$student->last_name);
    }
}
