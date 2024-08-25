<?php

namespace App\Http\Controllers;

use App\Models\Form;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FormController extends Controller
{
    public function index()
    {
        $forms = Form::paginate(5);
        return Inertia::render('Form/Index', [
            'forms' => $forms,
        ]);
    }
    public function store(Request $request)
    {
        // $validatedData = $request->validate([
        //     'name' => 'required|string|max:255',
        //     'description' => 'required|string',
        // ]);
        dd($request->all());
        //Form::create($validatedData);
        return redirect()->route('form.index');
    }

    public function create(){
        $form = Form::with(['fields'])->find(1);
        return Inertia::render('Form/Create', [
            'form' => $form,
        ]);
    }
    
}
