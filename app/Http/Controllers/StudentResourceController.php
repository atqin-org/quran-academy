<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Club;
use App\Models\Student;
use App\Models\Guardian;
use App\Rules\AtLeastOnePhone;
use App\Rules\FileOrString;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class StudentResourceController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Student::query();

        if ($search = $request->input('search')) {
            $connectionType = DB::getDriverName();
            if ($connectionType === 'sqlite') {
                $query->whereRaw("(first_name || ' ' || last_name) like ?", ["%{$search}%"])
                    ->orWhereRaw("(last_name || ' ' || first_name) like ?", ["%{$search}%"]);
            } elseif ($connectionType === 'mysql') {
                $query->whereRaw("CONCAT(first_name, ' ', last_name) like ?", ["%{$search}%"])
                    ->orWhereRaw("CONCAT(last_name, ' ', first_name) like ?", ["%{$search}%"]);
            }
        }

        $sortBy = $request->input('sortBy', 'created_at'); // Default to 'created_at'
        $sortType = $request->input('sortType', 'desc'); // Default to 'desc'

        if ($sortBy === 'name') {
            $query->orderBy('first_name', $sortType)->orderBy('last_name', $sortType);
        } else {
            $query->orderBy($sortBy, $sortType);
        }
        if ($genders = $request->input('gender')) {
            $query->whereIn('gender', $genders);
        }
        if ($clubs = $request->input('clubs')) {
            $query->whereIn('club_id', $clubs);
        }
        if ($categories = $request->input('categories')) {
            $query->whereIn('category_id', $categories);
        }
        $students = $query->paginate(10, ['id', 'first_name', 'last_name', 'birthdate', 'ahzab', 'gender', 'insurance_expire_at', 'subscription', 'subscription_expire_at', 'club_id', 'category_id'])->withQueryString();

        $students->getCollection()->transform(function ($student) {
            $student->name = $student->first_name . ' ' . $student->last_name;
            $birthdate = Carbon::parse($student->birthdate);
            $student->age = (int) $birthdate->diffInYears(Carbon::now());
            $student->club = Club::find($student->club_id)->name;
            $category = Category::find($student->category_id);
            $student->category = $category->name;
            $student->category_gender = $category->gender;
            $student->insurance_expire_at = $student->insurance_expire_at ? Carbon::parse($student->insurance_expire_at)->format('Y-m-d') : null;
            $student->subscription_expire_at = $student->subscription_expire_at ? Carbon::parse($student->subscription_expire_at)->format('Y-m-d') : null;
            return $student;
        });
        return Inertia::render(
            'Dashboard/Students/Index',
            [
                'students' => $students,
                'dataDependencies' => [
                    'clubs' => Club::withCount('students')->get(),
                    'categories' => Category::withCount('students')->get(),
                    'genders' => Student::select('gender', DB::raw('count(*) as total'))
                        ->groupBy('gender')->get()
                ]
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
        dd($request->all());
        $request->validate([
            'firstName' => 'required',
            'lastName' => 'required',
            'gender' => 'required|in:male,female',
            'birthdate' => [
                'required',
                'date',
                'before:' . now()->subYears(3)->format('Y-m-d'),
                'after:' . now()->subYears(100)->format('Y-m-d'),
            ],
            'socialStatus' => 'required|in:good,mid,low',
            'hasCronicDisease' => 'required|in:yes,no',
            'cronicDisease' => 'nullable|string',
            'father.phone' => ['nullable', 'regex:/^0[567]\d{8}$/', new AtLeastOnePhone('motherPhone')],
            'mother.phone' => ['nullable', 'regex:/^0[567]\d{8}$/', new AtLeastOnePhone('fatherPhone')],
            'father.name' => 'nullable|string',
            'mother.name' => 'nullable|string',
            'father.job' => 'nullable|string',
            'mother.job' => 'nullable|string',
            'subscription' => 'required|numeric',
            'club' => 'required|exists:clubs,id',
            'category' => 'required|exists:categories,id',
            'picture' => 'nullable|mimes:jpg,jpeg,png,pdf|max:6144', // 6144 KB = 6 MB
            'file' => 'nullable|mimes:jpg,jpeg,png,pdf|max:6144',    // 6144 KB = 6 MB
        ]);

        //TODO: check if this student was deleted before from the same club


        $father_id = null;
        $mother_id = null;
        $guardians = Guardian::where('phone', $request->father["phone"])->orWhere('phone', $request->mother["phone"])->get();
        if ($guardians->count() > 0) {
            $guardians->each(function ($guardian) use ($request) {
                if ($guardian->phone === $request->father["phone"]) {
                    //TODO popup to ask if the user wants to update the guardian info
                    $guardian->name = $request->father["name"];
                    $guardian->job = $request->father["job"];
                    $guardian->gender = "male";
                    // if not get the guardian id
                } else {
                    //TODO popup to ask if the user wants to update the guardian info
                    $guardian->name = $request->mother["name"];
                    $guardian->job = $request->mother["job"];
                    $guardian->gender = "female";
                    // if not get the guardian id
                }
                $guardian->save();
            });
        } else {
            if ($request->mother["phone"] || $request->mother["name"] || $request->mother["job"]) {
                $mother = Guardian::create([
                    'phone' => $request->mother["phone"],
                    'name' => $request->mother["name"],
                    'job' => $request->mother["job"],
                    'gender' => 'female',
                ]);
                $mother->save();
                $mother_id = $mother->id;
            }
            if ($request->father["phone"] || $request->father["name"] || $request->father["job"]) {
                $father = Guardian::create([
                    'phone' => $request->father["phone"],
                    'name' => $request->father["name"],
                    'job' => $request->father["job"],
                    'gender' => 'male'
                ]);
                $father->save();
                $father_id = $father->id;
            }
        }
        //add $father_id and $mother_id to the student
        $request->merge(['father_id' => $father_id, 'mother_id' => $mother_id]);
        Student::create($request->all());

        // redirect to the students index page
        return redirect()->route('students.index')->with('success', 'تم إضافة الطالب بنجاح');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $student = Student::find($id)->load('club', 'category', 'father', 'mother');

        return $student;
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        return Inertia::render(
            'Dashboard/Students/Update',
            [
                'student' => Student::find($id)->load('father', 'mother'),
                'clubs' => Club::all(),
                'categories' => Category::all()
            ]
        );
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        // Validate the request
        $request->validate([
            'firstName' => 'required',
            'lastName' => 'required',
            'gender' => 'required|in:male,female',
            'birthdate' => [
                'required',
                'date',
                'before:' . now()->subYears(3)->format('Y-m-d'),
                'after:' . now()->subYears(100)->format('Y-m-d'),
            ],
            'socialStatus' => 'required|in:good,mid,low',
            'hasCronicDisease' => 'required|in:yes,no',
            'cronicDisease' => 'nullable|string',
            'father.phone' => ['nullable', 'regex:/^0[567]\d{8}$/', new AtLeastOnePhone('motherPhone')],
            'mother.phone' => ['nullable', 'regex:/^0[567]\d{8}$/', new AtLeastOnePhone('fatherPhone')],
            'father.name' => 'nullable|string',
            'mother.name' => 'nullable|string',
            'father.job' => 'nullable|string',
            'mother.job' => 'nullable|string',
            'subscription' => 'required|numeric',
            'club' => 'required|exists:clubs,id',
            'category' => 'required|exists:categories,id',
            'picture' => ['nullable', new FileOrString],
            'file' => ['nullable', new FileOrString],
        ]);
        // Find the student by ID
        $student = Student::findOrFail($id);

        $father_id = $student->father_id;
        $mother_id = $student->mother_id;
        $guardians = Guardian::where('phone', $request->father["phone"])->orWhere('phone', $request->mother["phone"])->get();
        if ($guardians->count() > 0) {
            $guardians->each(function ($guardian) use ($request) {
                if ($guardian->phone === $request->father["phone"]) {
                    //TODO popup to ask if the user wants to update the guardian info
                    $guardian->name = $request->father["name"];
                    $guardian->job = $request->father["job"];
                    $guardian->gender = "male";
                    // if not get the guardian id
                } else {
                    //TODO popup to ask if the user wants to update the guardian info
                    $guardian->name = $request->mother["name"];
                    $guardian->job = $request->mother["job"];
                    $guardian->gender = "female";
                    // if not get the guardian id
                }
                $guardian->save();
            });
        } else {
            if ($request->mother["phone"] || $request->mother["name"] || $request->mother["job"]) {
                $mother = Guardian::create([
                    'phone' => $request->mother["phone"],
                    'name' => $request->mother["name"],
                    'job' => $request->mother["job"],
                    'gender' => 'female',
                ]);
                $mother->save();
                $mother_id = $mother->id;
            }
            if ($request->father["phone"] || $request->father["name"] || $request->father["job"]) {
                $father = Guardian::create([
                    'phone' => $request->father["phone"],
                    'name' => $request->father["name"],
                    'job' => $request->father["job"],
                    'gender' => 'male'
                ]);
                $father->save();
                $father_id = $father->id;
            }
        }
        //add $father_id and $mother_id to the student
        $request->merge(['father_id' => $father_id, 'mother_id' => $mother_id]);

        // Update the student with validated data
        $student->update($request->all());

        // Save the updated student
        $student->save();

        // Redirect with a success message
        return redirect()->route('students.index')->with('success', 'تم تحديث الطالب بنجاح');
    }
    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $student = Student::findOrFail($id);

        $student->delete();

        return redirect()->route('students.index')->with('success', 'تم حذف الطالب بنجاح');
    }
    /**
     * Remove the specified resource from storage.
     */
    public function payment(string $id)
    {
        $student = Student::findOrFail($id);

        $student->delete();

        return redirect()->route('students.index')->with('success', 'تم حذف الطالب بنجاح');
    }
}
