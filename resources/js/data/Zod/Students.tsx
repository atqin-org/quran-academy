import { z } from "zod";

export const FormSchema = z
    .object({
        firstName: z.string({
            required_error: "الاسم مطلوب",
        }),
        lastName: z.string({
            required_error: "اللقب مطلوب",
        }),
        gender: z
            .enum(["male", "female"], {
                required_error: "الجنس مطلوب",
            })
            .refine((val) => ["male", "female"].includes(val), {
                message: "الجنس يجب ان يكون ذكر او انثى",
            }),
        birthDate: z.date({
            required_error: "تاريخ الميلاد مطلوب",
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
        fatherJob: z.string({
            required_error: "وظيفة الاب مطلوبة",
        }),
        motherJob: z.string({
            required_error: "وظيفة الام مطلوبة",
        }),
        fatherPhone: z
            .union([
                z.string().regex(/^0[567]\d{8}$/, {
                    message: "يرجى ادخال رقم هاتف صحيح",
                }),
                z.literal(""),
            ])
            .optional(),
        motherPhone: z
            .union([
                z.string().regex(/^0[567]\d{8}$/, {
                    message: "يرجى ادخال رقم هاتف صحيح",
                }),
                z.literal(""),
            ])
            .optional(),
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
        }),
        picture: z
            .object({
                name: z.string(),
                size: z.number(),
                type: z.string(),
            })
            .optional(),
        file: z
            .object({
                name: z.string(),
                size: z.number(),
                type: z.string(),
            })
            .optional(),
    })
    .refine(
        (data) =>
            data.hasCronicDisease === "yes" ? !!data.cronicDisease : true,
        {
            message: "يرجى ادخال اسم المرض",
            path: ["cronicDisease"],
        }
    )
    .refine((data) => data.fatherPhone || data.motherPhone, {
        message: "يرجى ادخال رقم هاتف الاب او الام",
        path: ["fatherPhone"],
    });
