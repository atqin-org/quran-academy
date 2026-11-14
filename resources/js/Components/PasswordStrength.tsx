import { Check, X } from "lucide-react";
import { useMemo } from "react";

interface Props {
    password: string;
    confirmation: string;
    showConfirmation?: boolean;
}

interface Rule {
    label: string;
    test: (pwd: string, confirmation: string) => boolean;
}

const rules: Rule[] = [
    { label: "8 خانات على الأقل", test: (p) => p.length >= 8 },
    { label: "حرف صغير (a-z)", test: (p) => /[a-z]/.test(p) },
    { label: "حرف كبير (A-Z)", test: (p) => /[A-Z]/.test(p) },
    { label: "رقم (0-9)", test: (p) => /\d/.test(p) },
    {
        label: "رمز خاص (مثل ! @ # $)",
        test: (p) => /[^A-Za-z0-9]/.test(p),
    },
];

const strengthLabels = ["ضعيفة جداً", "ضعيفة", "متوسطة", "جيدة", "قوية", "قوية جداً"];
const strengthColors = [
    "bg-red-500",
    "bg-red-400",
    "bg-orange-400",
    "bg-yellow-400",
    "bg-emerald-500",
    "bg-emerald-600",
];

export default function PasswordStrength({ password, confirmation, showConfirmation = true }: Props) {
    const results = useMemo(
        () =>
            rules.map((r) => ({
                label: r.label,
                passed: r.test(password, confirmation),
            })),
        [password, confirmation]
    );

    const passedCount = results.filter((r) => r.passed).length;
    const score = password.length === 0 ? 0 : passedCount;

    const matchPassed = password.length > 0 && password === confirmation;

    return (
        <div className="mt-3 space-y-3">
            <div>
                <div className="flex gap-1">
                    {Array.from({ length: 5 }, (_, i) => (
                        <div
                            key={i}
                            className={`h-1.5 flex-1 rounded-full transition-colors ${
                                i < score ? strengthColors[score] : "bg-gray-200"
                            }`}
                        />
                    ))}
                </div>
                <p className="mt-1 text-xs text-gray-600">
                    قوة كلمة المرور:{" "}
                    <span className="font-medium text-gray-900">
                        {strengthLabels[score]}
                    </span>
                </p>
            </div>

            <ul className="space-y-1.5">
                {results.map((r) => (
                    <li
                        key={r.label}
                        className={`flex items-center gap-2 text-xs transition-colors ${
                            r.passed ? "text-emerald-600" : "text-gray-500"
                        }`}
                    >
                        <span
                            className={`flex h-4 w-4 items-center justify-center rounded-full ${
                                r.passed
                                    ? "bg-emerald-100 text-emerald-600"
                                    : "bg-gray-100 text-gray-400"
                            }`}
                        >
                            {r.passed ? (
                                <Check className="h-3 w-3" strokeWidth={3} />
                            ) : (
                                <X className="h-3 w-3" strokeWidth={3} />
                            )}
                        </span>
                        {r.label}
                    </li>
                ))}
                {showConfirmation && (
                    <li
                        className={`flex items-center gap-2 text-xs transition-colors ${
                            matchPassed ? "text-emerald-600" : "text-gray-500"
                        }`}
                    >
                        <span
                            className={`flex h-4 w-4 items-center justify-center rounded-full ${
                                matchPassed
                                    ? "bg-emerald-100 text-emerald-600"
                                    : "bg-gray-100 text-gray-400"
                            }`}
                        >
                            {matchPassed ? (
                                <Check className="h-3 w-3" strokeWidth={3} />
                            ) : (
                                <X className="h-3 w-3" strokeWidth={3} />
                            )}
                        </span>
                        تطابق التأكيد
                    </li>
                )}
            </ul>
        </div>
    );
}

export function isPasswordValid(password: string, confirmation: string): boolean {
    if (!password || password !== confirmation) {
        return false;
    }
    return rules.every((r) => r.test(password, confirmation));
}
