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
            'Dashboard/Personnels/IndexTmp',
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
        $request->validate([
            'firstName' => 'required',
            'lastName' => 'required',
            'club' => 'required|array',
            'role' => 'required',
            'phone' => 'required',
            'mail' => 'required|email',
        ]);

        $user = User::create([
            'name' => $request->firstName,
            'last_name' => $request->lastName,
            'role' => $request->role,
            'phone' => $request->phone,
            'email' => $request->mail,
            'password' => bcrypt('password'),
        ]);

        // Attach the clubs to the user
        $user->clubs()->attach($request->club);

        return redirect()->route('personnels.create');
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
