<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Club;
use App\Models\Category;

class PersonnelController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Inertia::render(
            'Dashboard/Personnels/Index',
            [
                'clubs' => Club::all(),
            ]
        );
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render(
            'Dashboard/Personnels/Create',
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
        //dd($request->all());
        $request->validate([
            'name' => 'required',
            'last_name' => 'required',
            'club_id' => 'required',
            'role' => 'required',
            'phone' => 'required',
            'email' => 'required',
        ]);
        User::create(
            [
                'name' => $request->name,
                'last_name' => $request->last_name,
                'club_id' => $request->club_id,
                'role' => $request->role,
                'phone' => $request->phone,
                'email' => $request->email,
                'password' => bcrypt('password'),
            ]
        );
        return redirect()->route('personnels.index');
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
