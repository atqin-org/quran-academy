<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'sqlite') {
            // SQLite: Need to recreate the table to modify CHECK constraint
            // Step 1: Create new table with updated CHECK constraint
            DB::statement('
                CREATE TABLE "attendances_new" (
                    "id" integer primary key autoincrement not null,
                    "session_id" integer not null,
                    "student_id" integer not null,
                    "status" varchar check ("status" in (\'present\', \'absent\', \'excused\', \'late_excused\', \'kicked\')) not null default \'absent\',
                    "excusedReason" varchar,
                    "hizb_id" integer,
                    "thoman_id" integer,
                    "created_at" datetime,
                    "updated_at" datetime,
                    foreign key("session_id") references "program_sessions"("id") on delete cascade,
                    foreign key("student_id") references "students"("id") on delete cascade,
                    foreign key("hizb_id") references "ahzab"("id") on delete set null,
                    foreign key("thoman_id") references "athman"("id") on delete set null
                )
            ');

            // Step 2: Copy data from old table
            DB::statement('
                INSERT INTO "attendances_new"
                SELECT * FROM "attendances"
            ');

            // Step 3: Drop old table
            DB::statement('DROP TABLE "attendances"');

            // Step 4: Rename new table
            DB::statement('ALTER TABLE "attendances_new" RENAME TO "attendances"');
        } else {
            // MySQL: Modify the enum column to add new values
            DB::statement("ALTER TABLE attendances MODIFY COLUMN status ENUM('present', 'absent', 'excused', 'late_excused', 'kicked') DEFAULT 'absent'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        // First convert any new statuses back to old ones
        DB::table('attendances')
            ->whereIn('status', ['late_excused', 'kicked'])
            ->update(['status' => 'absent']);

        if ($driver === 'sqlite') {
            // SQLite: Recreate table with original CHECK constraint
            DB::statement('
                CREATE TABLE "attendances_new" (
                    "id" integer primary key autoincrement not null,
                    "session_id" integer not null,
                    "student_id" integer not null,
                    "status" varchar check ("status" in (\'present\', \'absent\', \'excused\')) not null default \'absent\',
                    "excusedReason" varchar,
                    "hizb_id" integer,
                    "thoman_id" integer,
                    "created_at" datetime,
                    "updated_at" datetime,
                    foreign key("session_id") references "program_sessions"("id") on delete cascade,
                    foreign key("student_id") references "students"("id") on delete cascade,
                    foreign key("hizb_id") references "ahzab"("id") on delete set null,
                    foreign key("thoman_id") references "athman"("id") on delete set null
                )
            ');

            DB::statement('
                INSERT INTO "attendances_new"
                SELECT * FROM "attendances"
            ');

            DB::statement('DROP TABLE "attendances"');
            DB::statement('ALTER TABLE "attendances_new" RENAME TO "attendances"');
        } else {
            // MySQL: Revert the enum
            DB::statement("ALTER TABLE attendances MODIFY COLUMN status ENUM('present', 'absent', 'excused') DEFAULT 'absent'");
        }
    }
};
