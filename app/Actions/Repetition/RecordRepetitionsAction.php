<?php

namespace App\Actions\Repetition;

use App\Models\Hizb;
use App\Models\ProgramSession;
use App\Models\Repetition;
use App\Models\RepetitionThumn;
use App\Models\Student;
use App\Models\Thoman;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RecordRepetitionsAction
{
    /**
     * Save all repetition sections for one student in one session.
     * Replaces any existing repetitions for that (session, student) pair.
     *
     * @param  array<int, array{
     *     hizb_id:int,
     *     tester_user_id?:int|null,
     *     tester_student_id?:int|null,
     *     overall_rating?:string|null,
     *     remark?:string|null,
     *     thumns?:array<int, array{thoman_id:int, result:string, mistakes_count?:int|null, note?:string|null}>
     * }>  $sections
     * @return array{saved:int, repetition_ids:array<int,int>}
     */
    public function execute(ProgramSession $session, Student $student, array $sections): array
    {
        $this->guardEnvelope($student, $sections);
        $this->guardThumnHizbMatch($sections);

        return DB::transaction(function () use ($session, $student, $sections) {
            Repetition::where('session_id', $session->id)
                ->where('student_id', $student->id)
                ->delete();

            $createdIds = [];

            foreach ($sections as $section) {
                if (empty($section['hizb_id'])) {
                    continue;
                }

                $repetition = Repetition::create([
                    'session_id' => $session->id,
                    'student_id' => $student->id,
                    'hizb_id' => $section['hizb_id'],
                    'tester_user_id' => $section['tester_user_id'] ?? null,
                    'tester_student_id' => $section['tester_student_id'] ?? null,
                    'overall_rating' => $section['overall_rating'] ?? null,
                    'remark' => $section['remark'] ?? null,
                ]);

                foreach (($section['thumns'] ?? []) as $thumn) {
                    if (! isset($thumn['thoman_id'], $thumn['result'])) {
                        continue;
                    }

                    RepetitionThumn::create([
                        'repetition_id' => $repetition->id,
                        'thoman_id' => $thumn['thoman_id'],
                        'result' => $thumn['result'],
                        'mistakes_count' => $thumn['result'] === 'bad' ? ($thumn['mistakes_count'] ?? null) : null,
                        'note' => $thumn['result'] === 'bad' ? ($thumn['note'] ?? null) : null,
                    ]);
                }

                $createdIds[] = $repetition->id;
            }

            activity('repetition')
                ->performedOn($session)
                ->causedBy(Auth::user())
                ->event('recorded')
                ->withProperties([
                    'student_id' => $student->id,
                    'sections_count' => count($createdIds),
                ])
                ->log('تم تسجيل '.count($createdIds).' فقرة تكرار للطالب');

            return [
                'saved' => count($createdIds),
                'repetition_ids' => $createdIds,
            ];
        });
    }

    /**
     * Ensure every section's hizb is within the student's memorized envelope.
     *
     * @param  array<int, array{hizb_id?:int}>  $sections
     */
    private function guardEnvelope(Student $student, array $sections): void
    {
        $maxAscending = $student->last_hizb_ascending;
        $minDescending = $student->last_hizb_descending;

        $hizbIds = collect($sections)->pluck('hizb_id')->filter()->unique()->all();
        if ($hizbIds === []) {
            return;
        }

        $hizbs = Hizb::whereIn('id', $hizbIds)->pluck('number', 'id');

        foreach ($sections as $index => $section) {
            $hizbId = $section['hizb_id'] ?? null;
            if (! $hizbId) {
                continue;
            }

            $number = $hizbs[$hizbId] ?? null;
            if ($number === null) {
                continue;
            }

            $insideAscending = $maxAscending !== null && $number <= $maxAscending;
            $insideDescending = $minDescending !== null && $number >= $minDescending;

            if (! $insideAscending && ! $insideDescending) {
                throw ValidationException::withMessages([
                    "sections.{$index}.hizb_id" => 'الحزب خارج نطاق ما حفظه الطالب',
                ]);
            }
        }
    }

    /**
     * Ensure every thumn's thoman belongs to the section's hizb.
     *
     * @param  array<int, array{hizb_id?:int, thumns?:array<int, array{thoman_id?:int}>}>  $sections
     */
    private function guardThumnHizbMatch(array $sections): void
    {
        $thomanIds = collect($sections)
            ->flatMap(fn ($s) => collect($s['thumns'] ?? [])->pluck('thoman_id'))
            ->filter()
            ->unique()
            ->all();

        if ($thomanIds === []) {
            return;
        }

        $thomans = Thoman::whereIn('id', $thomanIds)->pluck('hizb_id', 'id');

        foreach ($sections as $sIndex => $section) {
            foreach (($section['thumns'] ?? []) as $tIndex => $thumn) {
                $thomanId = $thumn['thoman_id'] ?? null;
                if (! $thomanId) {
                    continue;
                }

                if (($thomans[$thomanId] ?? null) !== ($section['hizb_id'] ?? null)) {
                    throw ValidationException::withMessages([
                        "sections.{$sIndex}.thumns.{$tIndex}.thoman_id" => 'الثمن لا ينتمي إلى الحزب المختار',
                    ]);
                }
            }
        }
    }
}
