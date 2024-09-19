<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\Student;
use Illuminate\Http\Request;
use Inertia\Inertia;

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
        $request->validate([
            'type' => 'required|string',
            'value' => 'required|numeric',
            'status' => 'required|string',
            'discount' => 'required|numeric',
            'start_at' => 'required|date',
            'end_at' => 'required|date',
            'user_id' => 'required|exists:users,id',
            'student_id' => 'required|exists:students,id',
            'expect.duration' => 'required|integer',
            'expect.sessions' => 'required|integer',
            'expect.change' => 'required|numeric',
            'expect.start_at' => 'required|date',
            'expect.end_at' => 'required|date',
        ]);
        // re calculate all the expect items

        // check expact values and the calculated values

        // insurt into db
        $payment = new Payment([
            'type' => $request->type,
            'value' => $request->value,
            'status' => $request->status,
            'discount' => $request->discount,
            'start_at' => $request->start_at,
            'end_at' => $request->end_at,
            'user_id' => $request->user_id,
            'student_id' => $request->student_id,
            'expect' => [
                'duration' => $request->expect['duration'],
                'sessions' => $request->expect['sessions'],
                'change' => $request->expect['change'],
                'start_at' => $request->expect['start_at'],
                'end_at' => $request->expect['end_at'],
            ],
        ]);
        $payment->save();
        return redirect()->route('students.payment.show', $request->student_id);
    }

    /**
     * Display the specified resource.
     */
    public function show(Student $student)
    {
        $payments = Payment::where('student_id', $student->id)->latest()->get();
        return Inertia::render(
            'Dashboard/Students/Payment',
            [
                'student' => $student->load('father', 'mother'),
                'payments' => $payments,
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
