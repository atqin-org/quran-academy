import { isAfter, isBefore, parseISO, subYears } from "date-fns";
import { z } from "zod";

const MAX_FILE_SIZE = 6 * 1024 * 1024; // 6MB in bytes
const ALLOWED_FILE_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const fileSchema = z.union([
    z
        .instanceof(File, {
            message: "الملف مطلوب",
        })
        .refine((file) => ALLOWED_FILE_TYPES.includes(file.type), {
            message: "Must be a PDF, JPG, JPEG, or PNG file",
        })
        .refine((file) => file.size <= MAX_FILE_SIZE, {
            message: "File size must be less than 6MB",
        }),
    z.string(),
]);
export const FormSchemaP = z.object({
    firstName: z
        .string({
            required_error: "الاسم مطلوب",
        })
        .min(1, "الاسم مطلوب"),
    lastName: z
        .string({
            required_error: "اللقب مطلوب",
        })
        .min(1, "اللقب مطلوب"),
    mail: z
        .string({
            required_error: "البريد الإلكتروني مطلوب",
        })
        .email("البريد الإلكتروني غير صالح") // Built-in email validation
        .refine((email) => email.includes("@"), {
            message: "البريد الإلكتروني يجب أن يحتوي على @",
        }),
    phone: z.union([
        z.string().regex(/^0[567]\d{8}$/, {
            message: "يرجى ادخال رقم هاتف صحيح",
        }),
        z.literal(""),
    ]),
    club: z.string().optional(),
    /*club: z.array(z.string()).nonempty({
        message: "النادي مطلوب",
    }),*/
    file: fileSchema.optional(),
});
