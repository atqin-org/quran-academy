<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Club;
use App\Models\Student;
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
            $query->whereRaw("(first_name || ' ' || last_name) like ?", ["%{$search}%"])
                  ->orWhereRaw("(last_name || ' ' || first_name) like ?", ["%{$search}%"]);
        }
        $students = $query->latest()->paginate(10, ['id', 'first_name', 'last_name', 'birthdate','gender', 'insurance_expire_at', 'subscription', 'subscription_expire_at', 'id_club', 'id_category']);
        if (env('APP_ENV') !== 'local') {
            $students->setPath(preg_replace("/^http:/i", "https:", $students->path()));
        }
        $students->getCollection()->transform(function ($student) {
            $student->name = $student->first_name . ' ' . $student->last_name;
            $student->ahzab = rand(1, 30);
            $birthdate = Carbon::parse($student->birthdate);
            $student->age = (int) $birthdate->diffInYears(Carbon::now());
            $student->club = Club::find($student->id_club)->name;
            $category = Category::find($student->id_category);
            $student->category = $category->name;
            $student->category_gender = $category->gender;
            $student->insurance_expire_at = Carbon::parse($student->insurance_expire_at)->format('Y-m-d');
            $student->subscription_expire_at = Carbon::parse($student->subscription_expire_at)->format('Y-m-d');
            return $student;
        });
        //dd($students);
        return Inertia::render(
            'Dashboard/Students/Index',
            [
                'students' => $students
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
            'fatherPhone' => ['nullable', 'regex:/^0[567]\d{8}$/', new AtLeastOnePhone('motherPhone')],
            'motherPhone' => ['nullable', 'regex:/^0[567]\d{8}$/', new AtLeastOnePhone('fatherPhone')],
            'subscription' => 'required|numeric',
            'club' => 'required|exists:clubs,id',
            'category' => 'required|exists:categories,id',
            'picture' => 'nullable|mimes:jpg,jpeg,png,pdf|max:6144', // 6144 KB = 6 MB
            'file' => 'nullable|mimes:jpg,jpeg,png,pdf|max:6144',    // 6144 KB = 6 MB
        ]);

        //TODO: check if this student was deleted before from the same club

        Student::create($request->all());

        // redirect to the students index page
        return redirect()->route('students.index')->with('success', 'تم إضافة الطالب بنجاح');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $student = Student::find($id);

        dd($student);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        return Inertia::render(
            'Dashboard/Students/Update',
            [
                'student' => Student::find($id),
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
        $request->validate([
            'firstName' => 'required',
            'lastName' => 'required',
            'gender' => 'required|in:male,female',
            'birthdate' => 'required|date',
            'socialStatus' => 'required|in:good,mid,low',
            'hasCronicDisease' => 'required|in:yes,no',
            'cronicDisease' => 'required_if:hasCronicDisease,yes',
            'fatherPhone' => ['nullable', 'regex:/^0[567]\d{8}$/', new AtLeastOnePhone('motherPhone')],
            'motherPhone' => ['nullable', 'regex:/^0[567]\d{8}$/', new AtLeastOnePhone('fatherPhone')],
            'subscription' => 'required|numeric',
            'club' => 'required|exists:clubs,id',
            'category' => 'required|exists:categories,id',
            'picture' => ['nullable', new FileOrString],
            'file' => ['nullable', new FileOrString],
        ]);

        $student = Student::find($id);

        $student->update($request->all());

        return redirect()->route('students.index')->with('success', 'تم تحديث الطالب بنجاح');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
