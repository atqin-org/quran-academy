<?php

namespace App\Http\Controllers;

use App\Models\ClubCategorySession;
use App\Models\Payment;
use App\Models\Student;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\Validator;

class PaymentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //dd($request->all());
        $validator = Validator::make($request->all(), [
            'type' => 'required|string',
            'value' => 'required|numeric',
            'status' => 'required|string',
            'discount' => 'nullable|numeric',
            'user_id' => 'required|exists:users,id',
            'student_id' => 'required|exists:students,id',
            'expect.duration' => 'required|integer',
            'expect.sessions' => 'required|integer',
            'expect.change' => 'required|numeric',
            'expect.start_at' => 'required|date',
            'expect.end_at' => 'required|date',
        ]);
        if ($validator->fails()) {
            dd($validator->errors());
        }
        // re calculate all the expect items

        // check expact values and the calculated values

        $expect = $request->input('expect', []);
        if ($request->type == 'ins') {
            $expect['duration'] = 33;
            $expect['change'] = 0;

            // Set end_at to the next 31st of October
            $now = Carbon::now();
            $nextOctober31 = Carbon::create($now->year, 10, 31, 0, 0, 0);

            if ($now->greaterThan($nextOctober31)) {
                $nextOctober31->addYear();
            }

            $expect['end_at'] = $nextOctober31->format('Y-m-d H:i:s');

            $request->merge(['expect' => $expect]);
        }
        // insurt into db
        $payment = new Payment([
            'type' => $request->type,
            'value' => $request->type == 'ins' ? 200 : $request->value,
            'status' => $request->status,
            'discount' => $request->discount,
            'start_at' => $expect['start_at'],
            'end_at' => $expect['end_at'],
            'user_id' => $request->user_id,
            'student_id' => $request->student_id,
        ]);
        $payment->save();
        $student = Student::find($request->student_id);
        if ($request->type == 'ins') {
            $student->insurance_expire_at = $expect['end_at'];
        } else {
            $student->subscription_expire_at = $expect['end_at'];

            // Add session credits based on club/category configuration
            $this->addSessionCredits($student, $expect['duration']);
        }
        $student->save();
        return redirect()->route('students.payment.show', $request->student_id);
    }

    /**
     * Add session credits based on payment duration and club/category config
     */
    private function addSessionCredits(Student $student, int $months): void
    {
        // Get sessions per month from club/category config
        $sessionsPerMonth = ClubCategorySession::getSessionsPerMonth(
            $student->club_id,
            $student->category_id
        );

        // Calculate credits to add
        $creditsToAdd = $months * $sessionsPerMonth;

        // Add to existing credits (don't overwrite)
        $student->addCredit($creditsToAdd);
    }

    /**
     * Display the specified resource.
     */
    public function show(Student $student)
    {
        $payments = Payment::where('student_id', $student->id)->latest()->get();

        // Get sessions per month config for this student
        $sessionsPerMonth = ClubCategorySession::getSessionsPerMonth(
            $student->club_id,
            $student->category_id
        );

        return Inertia::render(
            'Dashboard/Students/Payment',
            [
                'student' => $student->load('father', 'mother', 'club', 'category'),
                'payments' => $payments,
                'sessionsPerMonth' => $sessionsPerMonth,
            ]
        );
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Payment $payment)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Payment $payment)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Payment $payment)
    {
        //
    }
}
