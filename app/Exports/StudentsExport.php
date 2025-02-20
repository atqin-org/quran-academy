<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithCustomStartCell;
use Maatwebsite\Excel\Concerns\WithCustomValueBinder;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Events\AfterSheet;
use Carbon\Carbon;
use PhpOffice\PhpSpreadsheet\Cell\Cell;
use Maatwebsite\Excel\DefaultValueBinder;
use PhpOffice\PhpSpreadsheet\Worksheet\Drawing;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use Spatie\Activitylog\Models\Activity;

class StudentsExport extends DefaultValueBinder implements FromCollection, WithMapping, ShouldAutoSize, WithHeadings, WithCustomStartCell, WithCustomValueBinder, WithEvents
{
    protected Collection $students;
    private int $rowIndex = 0;  // for index column

    public function __construct(Collection $students)
    {
        $this->students = $students;
    }

    public function collection()
    {
        return $this->students;
    }

    public function map($student): array
    {
        return [
            ++$this->rowIndex, // Serial number
            $student->id,
            $student->first_name . ' ' . $student->last_name,
            $student->club->name,
            Carbon::parse($student->birthdate)->format('Y/m/d'),
            Carbon::parse($student->birthdate)->age,
            $student->ahzab_up == 0 ? "0" : $student->ahzab_up,
            $student->ahzab_down == 0 ? "0" : $student->ahzab_down,
            $student->ahzab == 0 ? "0" : $student->ahzab,
        ];
    }

    public function headings(): array
    {
        return [
            'م',               // Serial/index column header
            'الرقم',
            'الاسم و اللقب',
            'النادي',
            'تاريخ الميلاد',
            'السن',
            'الأحزاب (من البقرة)',
            'الأحزاب (من الناس)',
            'الأحزاب',
        ];
    }

    // The export table starts at A5 to leave room for the header.
    public function startCell(): string
    {
        return 'A5';
    }

    public function bindValue(Cell $cell, $value)
    {
        // Force value to be a string.
        $cell->setValueExplicit($value, \PhpOffice\PhpSpreadsheet\Cell\DataType::TYPE_STRING);
        return true;
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();

                // Set the sheet to right-to-left layout for Arabic.
                $sheet->setRightToLeft(true);

                // Center all cells by default.
                $sheet->getParent()->getDefaultStyle()->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

                // Bold the heading row (row 5, from A5 to I5).
                $sheet->getStyle('A5:I5')->getFont()->setBold(true);

                // Insert the left logo at cell A1.
                $drawingLeft = new Drawing();
                $drawingLeft->setName('Logo Left');
                $drawingLeft->setDescription('Logo Left');
                $drawingLeft->setPath(public_path('logo.png'));
                $drawingLeft->setCoordinates('A1');
                $drawingLeft->setHeight(80); // adjust height as needed.
                $drawingLeft->setWorksheet($sheet);

                // Insert the right logo at cell I1.
                $drawingRight = new Drawing();
                $drawingRight->setName('Logo Right');
                $drawingRight->setDescription('Logo Right');
                $drawingRight->setPath(public_path('logo.png'));
                $drawingRight->setCoordinates('I1');
                $drawingRight->setHeight(80); // adjust height as needed.
                $drawingRight->setWorksheet($sheet);

                // Merge cells and add organization name on the first header row (B1:H1).
                $sheet->mergeCells('B1:H1');
                $cellOrg = $sheet->getCell('B1');
                $cellOrg->setValue('جمعية العلماء المسلمين الجزائريين');
                $sheet->getStyle('B1')->getFont()->setBold(true)->setSize(14);
                $sheet->getStyle('B1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

                // Merge cells and add branch name on the second header row (B2:H2).
                $sheet->mergeCells('B2:H2');
                $cellBranch = $sheet->getCell('B2');
                $cellBranch->setValue('شعبة مغنية');
                $sheet->getStyle('B2')->getFont()->setBold(true)->setSize(12);
                $sheet->getStyle('B2')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

                // Merge cells for title on the third header row (B3:H3).
                $sheet->mergeCells('B3:H3');
                $cellTitle = $sheet->getCell('B3');
                $cellTitle->setValue('قائمة الطلاب');
                $sheet->getStyle('B3')->getFont()->setBold(true)->setSize(16);
                $sheet->getStyle('B3')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

                /* Set a fixed width for columns G, H, and I.
                $sheet->getColumnDimension('G')->setAutoSize(false)->setWidth(12);
                $sheet->getColumnDimension('H')->setAutoSize(false)->setWidth(12);
                $sheet->getColumnDimension('I')->setAutoSize(false)->setWidth(12);
                */
            }
        ];
    }

    // Add a method to log the export activity
    public function onExport(): void
    {
        activity('student')
            ->performedOn(new \App\Models\Student)
            ->withProperties([
                'exported_at'   => now(),
                'students_count' => $this->students->count()
            ])
            ->log('Students data exported.');
    }
}
