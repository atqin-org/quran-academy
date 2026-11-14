<?php

namespace App\Exports;

use Carbon\CarbonInterface;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithCustomValueBinder;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithStrictNullComparison;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\DefaultValueBinder;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Cell\Cell;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Conditional;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Drawing;
use PhpOffice\PhpSpreadsheet\Worksheet\PageSetup;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

/**
 * One sheet of the attendance register: students × sessions grid followed by totals per status.
 */
class GroupAttendanceSheetExport extends DefaultValueBinder implements FromArray, WithCustomValueBinder, WithEvents, WithStrictNullComparison, WithTitle
{
    public const STATUS_MARKS = [
        'present' => 'ح',
        'absent' => 'غ',
        'excused' => 'ع',
        'late_excused' => 'م',
        'kicked' => 'ط',
    ];

    public const STATUS_LABELS = [
        'present' => 'حاضر',
        'absent' => 'غائب',
        'excused' => 'غائب بعذر',
        'late_excused' => 'متأخر بعذر',
        'kicked' => 'مطرود',
    ];

    public const NO_SESSIONS_NOTE = 'لا توجد حصص في هذه الفترة';

    private const STATUS_FILLS = [
        'present' => 'FFC6EFCE',
        'absent' => 'FFFFC7CE',
        'excused' => 'FFFFEB9C',
        'late_excused' => 'FFFCD5B4',
        'kicked' => 'FFE4DFEC',
    ];

    private const HEADING_ROW = 8;

    /**
     * @param  list<string>  $sessionHeadings
     * @param  list<array{name: string, group: string|null, statuses: list<string|null>}>  $students
     */
    public function __construct(
        private string $title,
        private string $clubName,
        private string $categoryName,
        private string $groupLabel,
        private CarbonInterface $from,
        private CarbonInterface $to,
        private array $sessionHeadings,
        private array $students,
        private bool $showGroupColumn = false,
    ) {}

    public function title(): string
    {
        $title = str_replace(['\\', '/', '?', '*', '[', ']', ':'], ' ', $this->title);

        return mb_substr(trim($title), 0, 31);
    }

    /**
     * @return list<string>
     */
    public function headings(): array
    {
        return [
            'م',
            'الاسم واللقب',
            ...($this->showGroupColumn ? ['الفوج'] : []),
            ...$this->sessionHeadings,
            ...array_values(self::STATUS_LABELS),
        ];
    }

    /**
     * @return list<list<int|string|null>>
     */
    public function rows(): array
    {
        $rows = [];

        foreach ($this->students as $index => $student) {
            $marks = array_map(
                fn (?string $status) => $status === null ? null : (self::STATUS_MARKS[$status] ?? null),
                $student['statuses']
            );

            $counts = array_count_values(array_filter($student['statuses']));
            $totals = array_map(fn (string $status) => $counts[$status] ?? 0, array_keys(self::STATUS_MARKS));

            $rows[] = [
                $index + 1,
                $student['name'],
                ...($this->showGroupColumn ? [$student['group'] ?? '—'] : []),
                ...$marks,
                ...$totals,
            ];
        }

        return $rows;
    }

    /**
     * @return list<list<int|string|null>>
     */
    public function array(): array
    {
        $legend = collect(self::STATUS_MARKS)
            ->map(fn (string $mark, string $status) => $mark.': '.self::STATUS_LABELS[$status])
            ->join('   |   ');

        return [
            [null, 'جمعية العلماء المسلمين الجزائريين'],
            [null, 'شعبة مغنية'],
            [null, 'سجل الحضور'],
            [null, "النادي: {$this->clubName}   |   الفئة: {$this->categoryName}   |   الفوج: {$this->groupLabel}"],
            [null, 'الفترة: من '.$this->from->format('d/m/Y').' إلى '.$this->to->format('d/m/Y')],
            [null, $legend],
            [null, $this->sessionHeadings === [] ? self::NO_SESSIONS_NOTE : null],
            $this->headings(),
            ...$this->rows(),
        ];
    }

    /**
     * Counts stay numeric; everything else is written as plain text so a name can never be read as a formula.
     * The binder is global in PhpSpreadsheet, so it is handed back to the default one once the sheet is written.
     */
    public function bindValue(Cell $cell, $value): bool
    {
        if (is_int($value) || is_float($value)) {
            $cell->setValueExplicit($value, DataType::TYPE_NUMERIC);

            return true;
        }

        $cell->setValueExplicit((string) $value, DataType::TYPE_STRING);

        return true;
    }

    /**
     * @return array<class-string, callable>
     */
    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event): void {
                $this->styleSheet($event->sheet->getDelegate());

                Cell::setValueBinder(app(config('excel.value_binder.default', DefaultValueBinder::class)));
            },
        ];
    }

    private function styleSheet(Worksheet $sheet): void
    {
        $columnCount = count($this->headings());
        $sessionCount = count($this->sessionHeadings);
        $firstSessionIndex = $this->showGroupColumn ? 4 : 3;
        $firstTotalIndex = $firstSessionIndex + $sessionCount;

        $lastColumn = Coordinate::stringFromColumnIndex($columnCount);
        $headingRow = self::HEADING_ROW;
        $firstDataRow = $headingRow + 1;
        $lastRow = $headingRow + count($this->students);
        $hasStudents = $this->students !== [];

        $sheet->setRightToLeft(true);
        $sheet->getParent()->getDefaultStyle()->getAlignment()
            ->setHorizontal(Alignment::HORIZONTAL_CENTER)
            ->setVertical(Alignment::VERTICAL_CENTER);

        foreach ([1 => 14, 2 => 12, 3 => 16, 4 => 11, 5 => 11, 6 => 10, 7 => 10] as $row => $fontSize) {
            $sheet->mergeCells("B{$row}:{$lastColumn}{$row}");
            $sheet->getStyle("B{$row}")->getFont()->setBold($row <= 5)->setSize($fontSize);
        }

        $headingLines = max(array_map(fn (string $heading) => substr_count($heading, "\n") + 1, $this->headings()));
        $sheet->getRowDimension($headingRow)->setRowHeight(20 * $headingLines);
        $headingStyle = $sheet->getStyle("A{$headingRow}:{$lastColumn}{$headingRow}");
        $headingStyle->getFont()->setBold(true);
        $headingStyle->getAlignment()->setWrapText(true);
        $headingStyle->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FFF3F4F6');

        $sheet->getStyle("A{$headingRow}:{$lastColumn}{$lastRow}")
            ->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN)->getColor()->setARGB('FFD1D5DB');

        $firstTotalColumn = Coordinate::stringFromColumnIndex($firstTotalIndex);
        $sheet->getStyle("{$firstTotalColumn}{$headingRow}:{$lastColumn}{$lastRow}")->getFont()->setBold(true);

        if ($hasStudents) {
            $sheet->getStyle("B{$firstDataRow}:B{$lastRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
        }

        if ($hasStudents && $sessionCount > 0) {
            $firstSessionColumn = Coordinate::stringFromColumnIndex($firstSessionIndex);
            $lastSessionColumn = Coordinate::stringFromColumnIndex($firstTotalIndex - 1);

            $sheet->getStyle("{$firstSessionColumn}{$firstDataRow}:{$lastSessionColumn}{$lastRow}")
                ->setConditionalStyles($this->statusConditionals());
        }

        $sheet->getColumnDimension('A')->setWidth(6);
        $sheet->getColumnDimension('B')->setWidth(30);

        for ($index = 3; $index <= $columnCount; $index++) {
            $sheet->getColumnDimension(Coordinate::stringFromColumnIndex($index))->setWidth(13);
        }

        $sheet->freezePane(Coordinate::stringFromColumnIndex($firstSessionIndex).$firstDataRow);

        $sheet->getPageSetup()
            ->setOrientation(PageSetup::ORIENTATION_LANDSCAPE)
            ->setPaperSize(PageSetup::PAPERSIZE_A4)
            ->setFitToWidth(1)
            ->setFitToHeight(0)
            ->setRowsToRepeatAtTopByStartAndEnd($headingRow, $headingRow);

        $this->addLogo($sheet);
    }

    /**
     * Colour each mark like the attendance page (green / red / yellow / orange / purple).
     *
     * @return list<Conditional>
     */
    private function statusConditionals(): array
    {
        $conditionals = [];

        foreach (self::STATUS_MARKS as $status => $mark) {
            $conditional = new Conditional;
            $conditional->setConditionType(Conditional::CONDITION_CELLIS)
                ->setOperatorType(Conditional::OPERATOR_EQUAL)
                ->addCondition('"'.$mark.'"');

            $fill = $conditional->getStyle()->getFill()->setFillType(Fill::FILL_SOLID);
            $fill->getStartColor()->setARGB(self::STATUS_FILLS[$status]);
            $fill->getEndColor()->setARGB(self::STATUS_FILLS[$status]);

            $conditionals[] = $conditional;
        }

        return $conditionals;
    }

    private function addLogo(Worksheet $sheet): void
    {
        $logoPath = public_path('logo.png');

        if (! is_file($logoPath)) {
            return;
        }

        $drawing = new Drawing;
        $drawing->setName('Logo');
        $drawing->setDescription('Logo');
        $drawing->setPath($logoPath);
        $drawing->setCoordinates('A1');
        $drawing->setHeight(60);
        $drawing->setWorksheet($sheet);
    }
}
