<?php

namespace App\Http\Controllers;

use App\Models\Form;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FormController extends Controller
{
    public function index()
    {
        $forms = Form::all();
        return Inertia::render('Form/Index', [
            'forms' => $forms,
        ]);
    }
    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'required|string',
        ]);

        Form::create($validatedData);
        
        return redirect()->route('form.index');
    }

    
}
