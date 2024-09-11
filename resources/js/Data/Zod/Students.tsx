import { z } from "zod";
import { parseISO, isBefore, isAfter, subYears, addYears } from 'date-fns';

const MAX_FILE_SIZE = 6 * 1024 * 1024; // 6MB in bytes
const ALLOWED_FILE_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const isoDateString = z.string({
    required_error: "تاريخ الميلاد مطلوب",
    invalid_type_error: "يرجى ادخال تاريخ الميلاد بصيغة صحيحة",
}).refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime());
}, {
    message: "Invalid date format",
    params: {
        description: "يرجى ادخال تاريخ الميلاد بصيغة صحيحة",
    },
});
const fileSchema = z.union([
    z.instanceof(File, {
        message: "الملف مطلوب",
    }).refine((file) => ALLOWED_FILE_TYPES.includes(file.type), {
        message: "Must be a PDF, JPG, JPEG, or PNG file",
    }).refine((file) => file.size <= MAX_FILE_SIZE, {
        message: "File size must be less than 6MB",
    }),
    z.string()
]);
export const FormSchema = z
    .object({
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
        gender: z
            .enum(["male", "female"], {
                required_error: "الجنس مطلوب",
            })
            .refine((val) => ["male", "female"].includes(val), {
                message: "الجنس يجب ان يكون ذكر او انثى",
            }),
        birthdate:z.union([
            isoDateString,
            z.date({
                required_error: "تاريخ الميلاد مطلوب",
                invalid_type_error: "يرجى ادخال تاريخ الميلاد بصيغة صحيحة",
            })
        ]).refine((date) => {
            const parsedDate = typeof date === 'string' ? parseISO(date) : date;
            const minDate = subYears(new Date(), 100);
            const maxDate = subYears(new Date(), 3);
            return isAfter(parsedDate, minDate) && isBefore(parsedDate, maxDate);
        }, {
            message: "تاريخ الميلاد يجب أن يكون بين 3 سنوات و 100 سنة",
        }),
        socialStatus: z
            .enum(["good", "mid", "low"], {
                required_error: "الحالة الاجتماعية مطلوبة",
            })
            .refine((val) => ["good", "mid", "low"].includes(val), {
                message: "الحالة العائلية يجب ان تكون جيدة او متوسطة او ضعيفة",
            }),
        hasCronicDisease: z.enum(["yes", "no"], {
            required_error: "هل يعاني من مرض مزمن مطلوب",
        }),
        cronicDisease: z.string().optional(),
        familyStatus: z.string().optional(),
        father: z.object({
            name: z.string().optional(),
            job: z.string().optional(),
            phone: z
                .union([
                    z.string().regex(/^0[567]\d{8}$/, {
                        message: "يرجى ادخال رقم هاتف صحيح",
                    }),
                    z.literal(""),
                ])
                .optional(),
        }).optional(),
        mother: z.object({
            name: z.string().optional(),
            job: z.string().optional(),
            phone: z
                .union([
                    z.string().regex(/^0[567]\d{8}$/, {
                        message: "يرجى ادخال رقم هاتف صحيح",
                    }),
                    z.literal(""),
                ])
                .optional(),
        }).optional(),
        category: z.string({
            required_error: "الفئة مطلوبة",
        }),
        club: z.string({
            required_error: "النادي مطلوب",
        }),
        subscription: z
            .string({ required_error: "الاشتراك الشهري مطلوب" })
            .regex(/^\d+$/, {
                message: "الاشتراك الشهري يجب ان يكون رقم",
            }),
        insurance: z.boolean({
            required_error: "التامين مطلوب",
        }).optional(),
        picture: fileSchema.optional(),
        file: fileSchema.optional(),
    })
    .refine(
        (data) =>
            data.hasCronicDisease === "yes" ? !!data.cronicDisease : true,
        {
            message: "يرجى ادخال اسم المرض",
            path: ["cronicDisease"],
        }
    )
    .refine((data) => data.father?.phone || data.mother?.phone, {
        message: "يرجى ادخال رقم هاتف الاب او الام",
        path: ["father.phone"],
    });
