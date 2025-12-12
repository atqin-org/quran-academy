<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Category;
use App\Models\Club;
use App\Models\DashboardLayout;
use App\Models\Payment;
use App\Models\Student;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class StatisticsController extends Controller
{
    /**
     * Display the statistics dashboard.
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        // Get or create user's layout
        $layout = DashboardLayout::firstOrCreate(
            ['user_id' => $user->id],
            ['widgets' => DashboardLayout::getDefaultWidgets()]
        );

        // Get filter parameters
        $range = $request->input('range', 'all');
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');
        $clubId = $request->input('club_id');
        $categoryId = $request->input('category_id');

        // Calculate date range
        $dateRange = $this->calculateDateRange($range, $startDate, $endDate);

        // Gather all statistics
        $statistics = $this->gatherStatistics($dateRange, $clubId, $categoryId);

        // Get clubs for filter
        $clubs = Club::select('id', 'name')->get();
        $categories = Category::select('id', 'name', 'gender')->get();

        return Inertia::render('Dashboard/Statistics/Index', [
            'layout' => $layout->widgets,
            'statistics' => $statistics,
            'clubs' => $clubs,
            'categories' => $categories,
            'filters' => [
                'range' => $range,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'club_id' => $clubId,
                'category_id' => $categoryId,
            ],
        ]);
    }

    /**
     * Get statistics data as JSON (for filter updates).
     */
    public function getData(Request $request)
    {
        $range = $request->input('range', 'all');
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');
        $clubId = $request->input('club_id');
        $categoryId = $request->input('category_id');

        $dateRange = $this->calculateDateRange($range, $startDate, $endDate);
        $statistics = $this->gatherStatistics($dateRange, $clubId, $categoryId);

        return response()->json($statistics);
    }

    /**
     * Update user's widget layout.
     */
    public function updateLayout(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'widgets' => 'required|array',
            'widgets.*.id' => 'required|string',
            'widgets.*.type' => 'required|string',
            'widgets.*.position' => 'required|array',
            'widgets.*.size' => 'required|array',
            'widgets.*.visible' => 'required|boolean',
        ]);

        DashboardLayout::updateOrCreate(
            ['user_id' => $user->id],
            ['widgets' => $validated['widgets']]
        );

        return response()->json(['success' => true]);
    }

    /**
     * Calculate date range based on filter.
     */
    private function calculateDateRange(string $range, ?string $startDate, ?string $endDate): array
    {
        $start = null;
        $end = Carbon::now()->endOfDay();

        switch ($range) {
            case 'custom':
                if ($startDate && $endDate) {
                    $start = Carbon::parse($startDate)->startOfDay();
                    $end = Carbon::parse($endDate)->endOfDay();
                }
                break;
            case 'week':
                $start = Carbon::now()->subWeek()->startOfDay();
                break;
            case 'month':
                $start = Carbon::now()->subMonth()->startOfDay();
                break;
            case '3months':
                $start = Carbon::now()->subMonths(3)->startOfDay();
                break;
            case '6months':
                $start = Carbon::now()->subMonths(6)->startOfDay();
                break;
            case 'year':
                $start = Carbon::now()->subYear()->startOfDay();
                break;
            case 'all':
            default:
                $start = null;
                break;
        }

        return ['start' => $start, 'end' => $end];
    }

    /**
     * Gather all statistics.
     */
    private function gatherStatistics(array $dateRange, ?int $clubId, ?int $categoryId = null): array
    {
        return [
            'financial' => $this->getFinancialStats($dateRange, $clubId, $categoryId),
            'attendance' => $this->getAttendanceStats($dateRange, $clubId, $categoryId),
            'students' => $this->getStudentStats($dateRange, $clubId, $categoryId),
            'personnel' => $this->getPersonnelStats($clubId),
            'progress' => $this->getProgressStats($dateRange, $clubId, $categoryId),
        ];
    }

    /**
     * Get financial statistics.
     */
    private function getFinancialStats(array $dateRange, ?int $clubId, ?int $categoryId = null): array
    {
        $query = Payment::query();

        if ($dateRange['start']) {
            $query->whereBetween('created_at', [$dateRange['start'], $dateRange['end']]);
        }

        if ($clubId) {
            $query->whereHas('student', function ($q) use ($clubId) {
                $q->where('club_id', $clubId);
            });
        }

        if ($categoryId) {
            $query->whereHas('student', function ($q) use ($categoryId) {
                $q->where('category_id', $categoryId);
            });
        }

        // Total revenue
        $totalRevenue = (clone $query)->sum('value');
        $totalDiscount = (clone $query)->sum('discount');

        // Revenue by type
        $revenueByType = (clone $query)
            ->select('type', DB::raw('SUM(value) as total'), DB::raw('COUNT(*) as count'))
            ->groupBy('type')
            ->get()
            ->map(function ($item) {
                return [
                    'type' => $item->type,
                    'label' => $item->type === 'sub' ? 'اشتراك' : ($item->type === 'ins' ? 'تأمين' : $item->type),
                    'total' => (float) $item->total,
                    'count' => $item->count,
                ];
            });

        // Revenue by club
        $revenueByClub = Payment::query()
            ->join('students', 'payments.student_id', '=', 'students.id')
            ->join('clubs', 'students.club_id', '=', 'clubs.id')
            ->when($dateRange['start'], function ($q) use ($dateRange) {
                $q->whereBetween('payments.created_at', [$dateRange['start'], $dateRange['end']]);
            })
            ->when($clubId, function ($q) use ($clubId) {
                $q->where('students.club_id', $clubId);
            })
            ->when($categoryId, function ($q) use ($categoryId) {
                $q->where('students.category_id', $categoryId);
            })
            ->select('clubs.name as club_name', 'clubs.id as club_id', DB::raw('SUM(payments.value) as total'))
            ->groupBy('clubs.id', 'clubs.name')
            ->get();

        // Monthly revenue trend (last 12 months)
        $connectionType = DB::getDriverName();

        if ($connectionType === 'sqlite') {
            $monthlyTrend = Payment::query()
                ->when($clubId, function ($q) use ($clubId) {
                    $q->whereHas('student', fn($sq) => $sq->where('club_id', $clubId));
                })
                ->when($categoryId, function ($q) use ($categoryId) {
                    $q->whereHas('student', fn($sq) => $sq->where('category_id', $categoryId));
                })
                ->where('created_at', '>=', Carbon::now()->subMonths(12))
                ->select(
                    DB::raw("strftime('%Y', created_at) as year"),
                    DB::raw("strftime('%m', created_at) as month"),
                    DB::raw('SUM(value) as total')
                )
                ->groupBy('year', 'month')
                ->orderBy('year')
                ->orderBy('month')
                ->get()
                ->map(function ($item) {
                    $date = Carbon::createFromDate((int)$item->year, (int)$item->month, 1);
                    return [
                        'month' => $date->translatedFormat('M Y'),
                        'total' => (float) $item->total,
                    ];
                });
        } else {
            $monthlyTrend = Payment::query()
                ->when($clubId, function ($q) use ($clubId) {
                    $q->whereHas('student', fn($sq) => $sq->where('club_id', $clubId));
                })
                ->when($categoryId, function ($q) use ($categoryId) {
                    $q->whereHas('student', fn($sq) => $sq->where('category_id', $categoryId));
                })
                ->where('created_at', '>=', Carbon::now()->subMonths(12))
                ->select(
                    DB::raw('YEAR(created_at) as year'),
                    DB::raw('MONTH(created_at) as month'),
                    DB::raw('SUM(value) as total')
                )
                ->groupBy('year', 'month')
                ->orderBy('year')
                ->orderBy('month')
                ->get()
                ->map(function ($item) {
                    $date = Carbon::createFromDate($item->year, $item->month, 1);
                    return [
                        'month' => $date->translatedFormat('M Y'),
                        'total' => (float) $item->total,
                    ];
                });
        }

        // Payment count
        $paymentCount = (clone $query)->count();

        return [
            'total_revenue' => (float) $totalRevenue,
            'total_discount' => (float) $totalDiscount,
            'net_revenue' => (float) ($totalRevenue - $totalDiscount),
            'payment_count' => $paymentCount,
            'by_type' => $revenueByType,
            'by_club' => $revenueByClub,
            'monthly_trend' => $monthlyTrend,
        ];
    }

    /**
     * Get attendance statistics.
     */
    private function getAttendanceStats(array $dateRange, ?int $clubId, ?int $categoryId = null): array
    {
        $query = Attendance::query();

        if ($dateRange['start']) {
            $query->whereBetween('created_at', [$dateRange['start'], $dateRange['end']]);
        }

        if ($clubId) {
            $query->whereHas('student', function ($q) use ($clubId) {
                $q->where('club_id', $clubId);
            });
        }

        if ($categoryId) {
            $query->whereHas('student', function ($q) use ($categoryId) {
                $q->where('category_id', $categoryId);
            });
        }

        // Overall stats
        $present = (clone $query)->where('status', 'present')->count();
        $absent = (clone $query)->where('status', 'absent')->count();
        $excused = (clone $query)->where('status', 'excused')->count();
        $total = $present + $absent + $excused;

        $rate = $total > 0 ? round(($present / $total) * 100, 1) : 0;

        // By status for pie chart
        $byStatus = [
            ['status' => 'present', 'label' => 'حاضر', 'count' => $present],
            ['status' => 'absent', 'label' => 'غائب', 'count' => $absent],
            ['status' => 'excused', 'label' => 'معذور', 'count' => $excused],
        ];

        // Rate by club
        $byClub = Attendance::query()
            ->join('students', 'attendances.student_id', '=', 'students.id')
            ->join('clubs', 'students.club_id', '=', 'clubs.id')
            ->when($dateRange['start'], function ($q) use ($dateRange) {
                $q->whereBetween('attendances.created_at', [$dateRange['start'], $dateRange['end']]);
            })
            ->when($clubId, function ($q) use ($clubId) {
                $q->where('students.club_id', $clubId);
            })
            ->when($categoryId, function ($q) use ($categoryId) {
                $q->where('students.category_id', $categoryId);
            })
            ->select(
                'clubs.name as club_name',
                'clubs.id as club_id',
                DB::raw('COUNT(*) as total'),
                DB::raw("SUM(CASE WHEN attendances.status = 'present' THEN 1 ELSE 0 END) as present_count")
            )
            ->groupBy('clubs.id', 'clubs.name')
            ->get()
            ->map(function ($item) {
                return [
                    'club_name' => $item->club_name,
                    'club_id' => $item->club_id,
                    'total' => $item->total,
                    'present_count' => $item->present_count,
                    'rate' => $item->total > 0 ? round(($item->present_count / $item->total) * 100, 1) : 0,
                ];
            });

        // Rate by category
        $byCategory = Attendance::query()
            ->join('students', 'attendances.student_id', '=', 'students.id')
            ->join('categories', 'students.category_id', '=', 'categories.id')
            ->when($dateRange['start'], function ($q) use ($dateRange) {
                $q->whereBetween('attendances.created_at', [$dateRange['start'], $dateRange['end']]);
            })
            ->when($clubId, function ($q) use ($clubId) {
                $q->where('students.club_id', $clubId);
            })
            ->when($categoryId, function ($q) use ($categoryId) {
                $q->where('students.category_id', $categoryId);
            })
            ->select(
                'categories.name as category_name',
                'categories.id as category_id',
                DB::raw('COUNT(*) as total'),
                DB::raw("SUM(CASE WHEN attendances.status = 'present' THEN 1 ELSE 0 END) as present_count")
            )
            ->groupBy('categories.id', 'categories.name')
            ->get()
            ->map(function ($item) {
                return [
                    'category_name' => $item->category_name,
                    'category_id' => $item->category_id,
                    'total' => $item->total,
                    'present_count' => $item->present_count,
                    'rate' => $item->total > 0 ? round(($item->present_count / $item->total) * 100, 1) : 0,
                ];
            });

        // Most absent students
        $mostAbsent = Attendance::query()
            ->join('students', 'attendances.student_id', '=', 'students.id')
            ->when($dateRange['start'], function ($q) use ($dateRange) {
                $q->whereBetween('attendances.created_at', [$dateRange['start'], $dateRange['end']]);
            })
            ->when($clubId, function ($q) use ($clubId) {
                $q->where('students.club_id', $clubId);
            })
            ->when($categoryId, function ($q) use ($categoryId) {
                $q->where('students.category_id', $categoryId);
            })
            ->where('attendances.status', 'absent')
            ->select(
                'students.id',
                'students.first_name',
                'students.last_name',
                DB::raw('COUNT(*) as absent_count')
            )
            ->groupBy('students.id', 'students.first_name', 'students.last_name')
            ->orderByDesc('absent_count')
            ->limit(10)
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'name' => $item->first_name . ' ' . $item->last_name,
                    'absent_count' => $item->absent_count,
                ];
            });

        return [
            'present' => $present,
            'absent' => $absent,
            'excused' => $excused,
            'total' => $total,
            'rate' => $rate,
            'by_status' => $byStatus,
            'by_club' => $byClub,
            'by_category' => $byCategory,
            'most_absent' => $mostAbsent,
        ];
    }

    /**
     * Get student statistics.
     */
    private function getStudentStats(array $dateRange, ?int $clubId, ?int $categoryId = null): array
    {
        $query = Student::query();

        if ($clubId) {
            $query->where('club_id', $clubId);
        }

        if ($categoryId) {
            $query->where('category_id', $categoryId);
        }

        // Total counts
        $total = (clone $query)->count();
        $active = (clone $query)->whereNull('deleted_at')->count();

        // By gender
        $byGender = (clone $query)
            ->select('gender', DB::raw('COUNT(*) as count'))
            ->groupBy('gender')
            ->get()
            ->map(function ($item) {
                return [
                    'gender' => $item->gender,
                    'label' => $item->gender === 'male' ? 'ذكر' : 'أنثى',
                    'count' => $item->count,
                ];
            });

        // By club
        $byClub = Student::query()
            ->join('clubs', 'students.club_id', '=', 'clubs.id')
            ->when($clubId, function ($q) use ($clubId) {
                $q->where('students.club_id', $clubId);
            })
            ->when($categoryId, function ($q) use ($categoryId) {
                $q->where('students.category_id', $categoryId);
            })
            ->select('clubs.name as club_name', 'clubs.id as club_id', DB::raw('COUNT(*) as count'))
            ->groupBy('clubs.id', 'clubs.name')
            ->get();

        // By category
        $byCategory = Student::query()
            ->join('categories', 'students.category_id', '=', 'categories.id')
            ->when($clubId, function ($q) use ($clubId) {
                $q->where('students.club_id', $clubId);
            })
            ->when($categoryId, function ($q) use ($categoryId) {
                $q->where('students.category_id', $categoryId);
            })
            ->select('categories.name as category_name', 'categories.id as category_id', DB::raw('COUNT(*) as count'))
            ->groupBy('categories.id', 'categories.name')
            ->get();

        // By club and category (breakdown)
        $byClubCategory = Student::query()
            ->join('clubs', 'students.club_id', '=', 'clubs.id')
            ->join('categories', 'students.category_id', '=', 'categories.id')
            ->when($clubId, function ($q) use ($clubId) {
                $q->where('students.club_id', $clubId);
            })
            ->when($categoryId, function ($q) use ($categoryId) {
                $q->where('students.category_id', $categoryId);
            })
            ->select(
                'clubs.name as club_name',
                'clubs.id as club_id',
                'categories.name as category_name',
                'categories.id as category_id',
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('clubs.id', 'clubs.name', 'categories.id', 'categories.name')
            ->get()
            ->groupBy('club_id')
            ->map(function ($items, $clubId) {
                $first = $items->first();
                return [
                    'club_name' => $first->club_name,
                    'club_id' => $clubId,
                    'categories' => $items->map(function ($item) {
                        return [
                            'category_name' => $item->category_name,
                            'category_id' => $item->category_id,
                            'count' => $item->count,
                        ];
                    })->values()->toArray(),
                ];
            })
            ->values()
            ->toArray();

        // New registrations in range
        $newRegistrations = 0;
        if ($dateRange['start']) {
            $newQuery = Student::query();
            if ($clubId) {
                $newQuery->where('club_id', $clubId);
            }
            if ($categoryId) {
                $newQuery->where('category_id', $categoryId);
            }
            $newRegistrations = $newQuery
                ->whereBetween('created_at', [$dateRange['start'], $dateRange['end']])
                ->count();
        }

        // Students with negative credit
        $negativeCreditQuery = Student::query()
            ->where('sessions_credit', '<', 0);
        if ($clubId) {
            $negativeCreditQuery->where('club_id', $clubId);
        }
        if ($categoryId) {
            $negativeCreditQuery->where('category_id', $categoryId);
        }
        $negativeCredit = $negativeCreditQuery
            ->select('id', 'first_name', 'last_name', 'sessions_credit')
            ->orderBy('sessions_credit')
            ->limit(20)
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'name' => $item->first_name . ' ' . $item->last_name,
                    'credit' => $item->sessions_credit,
                ];
            });

        $negativeCreditCount = Student::query()
            ->where('sessions_credit', '<', 0)
            ->when($clubId, fn($q) => $q->where('club_id', $clubId))
            ->when($categoryId, fn($q) => $q->where('category_id', $categoryId))
            ->count();

        // Expiring insurance (next 30 days)
        $expiringInsurance = Student::query()
            ->when($clubId, fn($q) => $q->where('club_id', $clubId))
            ->when($categoryId, fn($q) => $q->where('category_id', $categoryId))
            ->whereNotNull('insurance_expire_at')
            ->whereBetween('insurance_expire_at', [Carbon::now(), Carbon::now()->addDays(30)])
            ->select('id', 'first_name', 'last_name', 'insurance_expire_at')
            ->orderBy('insurance_expire_at')
            ->limit(20)
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'name' => $item->first_name . ' ' . $item->last_name,
                    'expires_at' => Carbon::parse($item->insurance_expire_at)->format('Y-m-d'),
                ];
            });

        $expiringInsuranceCount = Student::query()
            ->when($clubId, fn($q) => $q->where('club_id', $clubId))
            ->when($categoryId, fn($q) => $q->where('category_id', $categoryId))
            ->whereNotNull('insurance_expire_at')
            ->whereBetween('insurance_expire_at', [Carbon::now(), Carbon::now()->addDays(30)])
            ->count();

        return [
            'total' => $total,
            'active' => $active,
            'by_gender' => $byGender,
            'by_club' => $byClub,
            'by_category' => $byCategory,
            'by_club_category' => $byClubCategory,
            'new_registrations' => $newRegistrations,
            'negative_credit' => $negativeCredit,
            'negative_credit_count' => $negativeCreditCount,
            'expiring_insurance' => $expiringInsurance,
            'expiring_insurance_count' => $expiringInsuranceCount,
        ];
    }

    /**
     * Get personnel statistics.
     */
    private function getPersonnelStats(?int $clubId): array
    {
        $query = User::query()->whereNull('deleted_at');

        // By role
        $byRole = (clone $query)
            ->select('role', DB::raw('COUNT(*) as count'))
            ->groupBy('role')
            ->get()
            ->map(function ($item) {
                $labels = [
                    'admin' => 'مدير',
                    'moderator' => 'مشرف',
                    'staff' => 'موظف',
                    'teacher' => 'معلم',
                ];
                return [
                    'role' => $item->role,
                    'label' => $labels[$item->role] ?? $item->role,
                    'count' => $item->count,
                ];
            });

        // By club (users can be associated with multiple clubs)
        $byClub = [];
        if (!$clubId) {
            $clubs = Club::with('users')->get();
            foreach ($clubs as $club) {
                $byClub[] = [
                    'club_name' => $club->name,
                    'club_id' => $club->id,
                    'count' => $club->users->count(),
                ];
            }
        }

        $total = (clone $query)->count();

        return [
            'total' => $total,
            'by_role' => $byRole,
            'by_club' => $byClub,
        ];
    }

    /**
     * Get progress statistics.
     */
    private function getProgressStats(array $dateRange, ?int $clubId, ?int $categoryId = null): array
    {
        $query = Student::query();

        if ($clubId) {
            $query->where('club_id', $clubId);
        }

        if ($categoryId) {
            $query->where('category_id', $categoryId);
        }

        // Calculate average memorization progress
        $students = $query->get();
        $totalProgress = 0;
        $progressDistribution = [
            '0-20' => 0,
            '21-40' => 0,
            '41-60' => 0,
            '61-80' => 0,
            '81-100' => 0,
        ];

        $topPerformers = [];

        foreach ($students as $student) {
            $progress = $student->calculateDualDirectionProgress();
            $percentage = $progress['percentage'];
            $totalProgress += $percentage;

            // Distribution
            if ($percentage <= 20) {
                $progressDistribution['0-20']++;
            } elseif ($percentage <= 40) {
                $progressDistribution['21-40']++;
            } elseif ($percentage <= 60) {
                $progressDistribution['41-60']++;
            } elseif ($percentage <= 80) {
                $progressDistribution['61-80']++;
            } else {
                $progressDistribution['81-100']++;
            }

            $topPerformers[] = [
                'id' => $student->id,
                'name' => $student->first_name . ' ' . $student->last_name,
                'percentage' => $percentage,
                'total_hizbs' => $progress['total'],
            ];
        }

        // Sort and take top 10
        usort($topPerformers, fn($a, $b) => $b['percentage'] <=> $a['percentage']);
        $topPerformers = array_slice($topPerformers, 0, 10);

        $averageProgress = count($students) > 0 ? round($totalProgress / count($students), 1) : 0;

        // Convert distribution to chart format
        $distributionChart = [];
        foreach ($progressDistribution as $range => $count) {
            $distributionChart[] = [
                'range' => $range . '%',
                'count' => $count,
            ];
        }

        return [
            'average_percentage' => $averageProgress,
            'top_performers' => $topPerformers,
            'distribution' => $distributionChart,
            'total_students' => count($students),
        ];
    }
}
