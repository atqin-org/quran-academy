<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Club;
use App\Models\Student;
use App\Rules\AtLeastOnePhone;

class StudentResourceController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Inertia::render(
            'Dashboard/Students/Index',
            [
                'students' => Student::all(),
            ]
        );
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
                'clubs' => Club::all(),
                'categories' => Category::all()
            ]
        );
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'firstName' => 'required',
            'lastName' => 'required',
            'gender' => 'required|in:male,female',
            'birthdate' => 'required|date',
            'socialStatus' => 'required|in:good,mid,low',
            'hasCronicDisease' => 'required|in:yes,no',
            'cronicDisease' => 'required_if:hasCronicDisease,yes',
            'fatherJob' => 'required',
            'motherJob' => 'required',
            'fatherPhone' => ['nullable', 'regex:/^0[567]\d{8}$/', new AtLeastOnePhone('motherPhone')],
            'motherPhone' => ['nullable', 'regex:/^0[567]\d{8}$/', new AtLeastOnePhone('fatherPhone')],
            'subscription' => 'required|numeric',
            'insurance' => 'required|accepted',
            'club' => 'required|exists:clubs,id',
            'category' => 'required|exists:categories,id',
            'picture' => 'image',
            'file' => 'file',
        ]);

        Student::create($request->all());

        // redirect to the students index page
        return redirect()->route('students.index')->with('success', 'تم إضافة الطالب بنجاح');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
