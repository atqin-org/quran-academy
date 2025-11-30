<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Subject;
use App\Models\Club;
use App\Models\Category;
use App\Models\Program;
use App\Models\ProgramSession;
use App\Models\Student;
use App\Models\Attendance;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ProgramSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('Creating programs with sessions and attendance records...');

        // Get existing clubs and categories
        $clubs = Club::all();
        $categories = Category::all();
        $subjects = Subject::all();

        if ($clubs->isEmpty() || $categories->isEmpty()) {
            $this->command->warn('No clubs or categories found. Please run ClubSeeder and CategorySeeder first.');
            return;
        }

        // Create 5-10 programs
        $programCount = rand(5, 10);
        $this->command->info("Creating {$programCount} programs...");

        foreach (range(1, $programCount) as $i) {
            $club = $clubs->random();
            $category = $categories->random();

            // Create program with dates spanning past months
            $startDate = Carbon::now()->subMonths(rand(3, 8));
            $endDate = $startDate->copy()->addMonths(rand(4, 8));

            // Days of week for sessions
            $allDays = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
            $daysOfWeek = fake()->randomElements($allDays, rand(2, 4));

            $program = Program::create([
                'name' => 'برنامج ' . fake()->randomElement(['الحفظ', 'المراجعة', 'التجويد', 'القراءة']) . ' - ' . $club->name,
                'subject_id' => $subjects->isNotEmpty() ? $subjects->random()->id : null,
                'club_id' => $club->id,
                'category_id' => $category->id,
                'section_id' => null,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'days_of_week' => $daysOfWeek,
            ]);

            $this->command->info("  Created program: {$program->name}");

            // Generate sessions for this program
            $sessions = $this->createSessionsForProgram($program, $startDate, min($endDate, Carbon::now()), $daysOfWeek);

            $this->command->info("    Created " . count($sessions) . " sessions");

            // Get students that belong to this club and category
            $students = Student::where('club_id', $club->id)
                ->where('category_id', $category->id)
                ->get();

            if ($students->isEmpty()) {
                // Fallback: get any students from this club
                $students = Student::where('club_id', $club->id)->take(20)->get();
            }

            if ($students->isEmpty()) {
                $this->command->warn("    No students found for club {$club->name}. Skipping attendance.");
                continue;
            }

            $this->command->info("    Creating attendance for " . $students->count() . " students...");

            // Create attendance records for each student across all sessions
            $this->createAttendanceForStudents($sessions, $students);
        }

        $this->command->info('Programs, sessions, and attendance records created successfully!');
    }

    /**
     * Create sessions for a program based on days of week
     */
    private function createSessionsForProgram(Program $program, Carbon $startDate, Carbon $endDate, array $daysOfWeek): array
    {
        $sessions = [];
        $currentDate = $startDate->copy();

        // Map day names to Carbon day numbers
        $dayMap = [
            'Saturday' => Carbon::SATURDAY,
            'Sunday' => Carbon::SUNDAY,
            'Monday' => Carbon::MONDAY,
            'Tuesday' => Carbon::TUESDAY,
            'Wednesday' => Carbon::WEDNESDAY,
            'Thursday' => Carbon::THURSDAY,
            'Friday' => Carbon::FRIDAY,
        ];

        // Convert day names to day numbers
        $scheduledDays = array_map(fn($day) => $dayMap[$day] ?? null, $daysOfWeek);
        $scheduledDays = array_filter($scheduledDays);

        // Random session times
        $startHour = fake()->randomElement([8, 9, 10, 14, 15, 16]);
        $startTime = sprintf('%02d:00', $startHour);
        $endTime = sprintf('%02d:00', $startHour + 2);

        while ($currentDate->lte($endDate)) {
            if (in_array($currentDate->dayOfWeek, $scheduledDays)) {
                // Determine status: past sessions are mostly completed
                $isPast = $currentDate->lt(Carbon::today());
                if ($isPast) {
                    // 90% completed, 10% canceled
                    $status = fake()->randomElement([
                        'completed', 'completed', 'completed', 'completed', 'completed',
                        'completed', 'completed', 'completed', 'completed',
                        'canceled'
                    ]);
                } else {
                    $status = 'scheduled';
                }

                $session = ProgramSession::create([
                    'program_id' => $program->id,
                    'session_date' => $currentDate->format('Y-m-d'),
                    'start_time' => $startTime,
                    'end_time' => $endTime,
                    'status' => $status,
                ]);

                $sessions[] = $session;
            }

            $currentDate->addDay();
        }

        return $sessions;
    }

    /**
     * Create attendance records for students across sessions with progressive learning
     */
    private function createAttendanceForStudents(array $sessions, $students): void
    {
        // Sort sessions by date to track progress properly
        usort($sessions, fn($a, $b) => strtotime($a->session_date) - strtotime($b->session_date));

        // Get all hizb IDs from the database (ahzab table has 60 records with IDs)
        $ahzabIds = DB::table('ahzab')->orderBy('number')->pluck('id')->toArray();

        // Get all thoman IDs grouped by hizb_id
        $athmanByHizb = DB::table('athman')
            ->select('id', 'hizb_id')
            ->get()
            ->groupBy('hizb_id')
            ->map(fn($items) => $items->pluck('id')->toArray())
            ->toArray();

        if (empty($ahzabIds)) {
            $this->command->warn('      No ahzab data found. Skipping hizb/thoman tracking.');
        }

        foreach ($students as $student) {
            // Each student has a different starting point and learning pace
            $startingHizbIndex = rand(0, 29); // Start somewhere in the first half of Quran (index 0-29 = hizb 1-30)
            $learningPace = fake()->randomElement([1, 2, 2, 3, 3, 3, 4, 4, 5]); // Sessions per hizb advancement
            $attendanceRate = fake()->randomElement([0.7, 0.75, 0.8, 0.85, 0.9, 0.95]); // Individual attendance tendency

            $currentHizbIndex = $startingHizbIndex;
            $sessionsAttended = 0;

            foreach ($sessions as $index => $session) {
                // Skip canceled sessions
                if ($session->status === 'canceled') {
                    continue;
                }

                // Determine attendance based on student's tendency
                $rand = fake()->randomFloat(2, 0, 1);

                if ($rand <= $attendanceRate) {
                    // Present
                    $sessionsAttended++;

                    // Progress in hizb (only for present students)
                    if ($sessionsAttended > 0 && $sessionsAttended % $learningPace === 0) {
                        $currentHizbIndex = min(59, $currentHizbIndex + 1); // Max index 59 (hizb 60)
                    }

                    // Get actual hizb ID and random thoman ID
                    $hizbId = !empty($ahzabIds) ? $ahzabIds[$currentHizbIndex] : null;
                    $thomanId = null;
                    if ($hizbId && isset($athmanByHizb[$hizbId]) && !empty($athmanByHizb[$hizbId])) {
                        $thomanId = fake()->randomElement($athmanByHizb[$hizbId]);
                    }

                    Attendance::create([
                        'session_id' => $session->id,
                        'student_id' => $student->id,
                        'status' => 'present',
                        'hizb_id' => $hizbId,
                        'thoman_id' => $thomanId,
                        'excusedReason' => null,
                        'created_at' => Carbon::parse($session->session_date)->setTime(rand(8, 17), rand(0, 59)),
                        'updated_at' => Carbon::parse($session->session_date)->setTime(rand(8, 17), rand(0, 59)),
                    ]);
                } elseif ($rand <= $attendanceRate + 0.1) {
                    // Excused (next 10% after present threshold)
                    Attendance::create([
                        'session_id' => $session->id,
                        'student_id' => $student->id,
                        'status' => 'excused',
                        'hizb_id' => null,
                        'thoman_id' => null,
                        'excusedReason' => fake()->randomElement([
                            'مرض',
                            'ظرف عائلي',
                            'سفر',
                            'امتحانات مدرسية',
                            'موعد طبي',
                        ]),
                        'created_at' => Carbon::parse($session->session_date)->setTime(rand(8, 17), rand(0, 59)),
                        'updated_at' => Carbon::parse($session->session_date)->setTime(rand(8, 17), rand(0, 59)),
                    ]);
                } else {
                    // Absent
                    Attendance::create([
                        'session_id' => $session->id,
                        'student_id' => $student->id,
                        'status' => 'absent',
                        'hizb_id' => null,
                        'thoman_id' => null,
                        'excusedReason' => null,
                        'created_at' => Carbon::parse($session->session_date)->setTime(rand(8, 17), rand(0, 59)),
                        'updated_at' => Carbon::parse($session->session_date)->setTime(rand(8, 17), rand(0, 59)),
                    ]);
                }
            }
        }
    }
}
