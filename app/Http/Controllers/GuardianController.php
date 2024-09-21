<?php

namespace App\Http\Controllers;

use App\Models\Guardian;
use App\Models\Student;
use Illuminate\Http\Request;

class GuardianController extends Controller
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
    }

    private function getDialogText(string $status_code)
    {
        if ($status_code[0] === '3') return null;
        $how = "الأب";
        if ($status_code[1] === '1') $how = "الأب";
        else if ($status_code[1] === '2') $how = "الأم";
        else if ($status_code[1] === '3') $how = "الوالدين";

        $what = "الاسم";
        if ($status_code[2] === '1') $what = "الاسم";
        else if ($status_code[2] === '2') $what = "الوظيفة";
        else if ($status_code[2] === '3') $what = "الاسم والوظيفة";
        else if ($status_code[2] === '4') $what = "رقم الهاتف";

        $dialog = [
            "title" => "تعديل بيانات " . $how,
            "description" => $what . " الذي أدخلته مختلف عن " . $what . " المسجل " . $how . " الطالب، سوف يتم تغيير " . $what . " المسجل " . $how . " الطالب إلى الاسم الذي أدخلته، هل تريد الاستمرار؟",
            "confirm" => "تأكيد",
            "cancel" => "إلغاء",
        ];
        return $dialog;
    }
    /**
     * STATUS_CODE: XYZ
     *
     * 1YZ: not correct
     * 2YZ: has conflicts
     * 3YZ: no conflicts
     * 4YZ: warning ( trying to edit a guardian that's being used by a sibling (create a new guardian / edit))
     *
     * X1Z: father
     * X2Z: mother
     * X3Z: both
     *
     * XY1: name
     * XY2: job
     * XY3: name and job
     * XY4: phone
     * XY5: gender
     *
     */
    public function checkV2(Request $request)
    {
        /**INFO:
         * $oldParent is the guardian that was registered with the same phone number
         * $student->parent is the parent of the student in the db before the request
         */
        //TODO: B0 validate the request

        // default code no conflicts
        $statusCode = '300';
        // get the student
        $student = $request->id ? Student::find($request->id)->load('father', 'mother') : null;
        $studentFather = $student ? $student["father"] : null;
        $studentMother = $student ? $student["mother"] : null;

        // get the new guardians
        $newFather = $request->father;
        if ($newFather["name"] === null && $newFather["job"] === null && $newFather["phone"] === null)
            $newFather = null;
        $newMother = $request->mother;
        if ($newMother["name"] === null && $newMother["job"] === null && $newMother["phone"] === null)
            $newMother = null;

        // get the guardians associated with the phone numbers
        $oldFather = $request->father["phone"] ? Guardian::where('phone', $request->father["phone"])->first() : null;
        $oldMother = $request->mother["phone"] ? Guardian::where('phone', $request->mother["phone"])->first() : null;

        // get the siblings
        $siblingsQuery = Student::query();
        if ($oldFather)
            $siblingsQuery->orWhere('father_id', $oldFather->id);
        if ($oldMother)
            $siblingsQuery->orWhere('mother_id', $oldMother->id);

        $siblings = $student ? $siblingsQuery->where('id', '!=', $student->id)->get() : null;
        return response()->json([
            'status_code' => $statusCode,
            'dialog' => $this->getDialogText($statusCode),
            'father_old' => $oldFather,
            'mother_old' => $oldMother,
            'father_new' => $newFather,
            'mother_new' => $newMother,
            'father' => $studentFather,
            'mother' => $studentMother,
            'siblings' => $siblings,
        ]);
        // Check if new father number been used by a male
        if ($newFather && $newFather->phone) {
            $conflict = Guardian::where('phone', $newFather->phone)->first();
            if ($conflict && $conflict->gender === "female") {
                $statusCode = '215'; // Father phone conflict
            }
        }
        // Check if new mother number been used by a female
        if ($newMother && $newMother->phone) {
            $conflict = Guardian::where('phone', $newMother->phone)->first();
            if ($conflict && $conflict->gender === "male") {
                if ($statusCode == '215')
                    $statusCode = '235'; // Father and mother phone conflict
                else
                    $statusCode = '225'; // Mother phone conflict
            }
        }
        if ($siblings->count() > 0 && $statusCode === '300') {
            // Check for conflicts with the father's data
            if ($oldFather || $newFather) {
                /**
                 * Check for name conflict
                 *     New Old
                 *     -------
                 *  0   0   0  -> {} : no conflict
                 *  1   0   1  -> delete : no conflict
                 *  2   1   0  -> add : can get conflict
                 *  3   1   1  -> update : can get conflict
                 */
                $case = 0;
                if ($newFather) $case = 2;
                if ($oldFather) $case += 1;
            }
        }
    }
    public function check(Request $request)
    {
        // default code no conflicts
        $statusCode = '300';
        // get the guardians associated with the phone numbers
        $guardianF = $request->father["phone"] ? Guardian::where('phone', $request->father["phone"])->first() : null;
        $guardianM = $request->mother["phone"] ? Guardian::where('phone', $request->mother["phone"])->first() : null;
        $student = $request->id ? Student::find($request->id)->load('father', 'mother') : null;

        $siblingsQuery = Student::query();

        if ($guardianF && $guardianF->id)
            $siblingsQuery->orWhere('father_id', $guardianF->id);

        if ($guardianM && $guardianM->id)
            $siblingsQuery->orWhere('mother_id', $guardianM->id);

        if ($student && $student->id)
            $siblingsQuery->where('id', '!=', $student->id);

        $siblings = $siblingsQuery->get();

        // Check if the guardian is being used by a sibling
        if ($siblings->count() > 0) {

            // Check for conflicts with the father's data
            if ($guardianF) {
                if ($guardianF->name !== null && $request->father["name"] !== null && $guardianF->name != $request->father["name"])
                    $statusCode = '211'; // Father name conflict
                if ($guardianF->job !== null && $request->father["job"] !== null && $guardianF->job != $request->father["job"])
                    if ($statusCode == '211')
                        $statusCode = '213'; // Father name and job conflict
                    else
                        $statusCode = '212'; // Father job conflict
            }
            $fatherHasConflict = $statusCode !== '300';

            // Check for conflicts with the mother's data
            if ($guardianM) {

                if ($guardianM->name !== null && $request->mother["name"] !== null && $guardianM->name != $request->mother["name"])
                    $statusCode = '221'; // Mother name conflict
                if ($guardianM->job !== null && $request->mother["job"] !== null && $guardianM->job != $request->mother["job"])
                    if ($statusCode == '221')
                        $statusCode = '223'; // Mother name and job conflict
                    else
                        $statusCode = '222'; // Mother job conflict
            }
            $statusCode = $fatherHasConflict ? '3' . $statusCode[1] . $statusCode[2] : $statusCode;



            // Check for logical error
            foreach ($siblings as $sibling) {
                if (($guardianF && $guardianF->id && $guardianM && $guardianM->id) &&
                    (($sibling->father_id == $guardianF->id && $sibling->mother_id == $guardianM->id) ||
                        ($sibling->mother_id == $guardianF->id && $sibling->father_id == $guardianM->id))
                ) {
                    $statusCode = '430'; // Logical error
                    break;
                }
            }
        }
        // Check if the phone number is unique
        if ($guardianF && $guardianF->phone !== $request->father["phone"]) {
            $existingGuardianF = Guardian::where('phone', $request->father["phone"])->first();
            if ($existingGuardianF) {
                $statusCode = '214'; // Father phone conflict
            }
        }
        if ($guardianM && $guardianM->phone !== $request->mother["phone"]) {
            $existingGuardianM = Guardian::where('phone', $request->mother["phone"])->first();
            if ($existingGuardianM) {
                if ($statusCode == '214')
                    $statusCode = '234'; // Father and mother phone conflict
                else
                    $statusCode = '224'; // Mother phone conflict
            }
        }
        return response()->json([
            'status_code' => $statusCode,
            'dialog' => $this->getDialogText($statusCode),
            'father' => $guardianF,
            'mother' => $guardianM,
            'siblings' => $siblings,
        ]);
    }

    /**
     * Display the specified resource.
     */
    public function show(Guardian $guardian)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Guardian $guardian)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Guardian $guardian)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Guardian $guardian)
    {
        //
    }
}
