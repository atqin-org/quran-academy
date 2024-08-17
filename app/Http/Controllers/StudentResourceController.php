<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Club;
use App\Models\Student;

class StudentResourceController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Inertia::render('Dashboard/Students/index',
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
            'Dashboard/Students/create',
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
        //
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
