<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تجاوز السعة الاستيعابية</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:'Tajawal','Cairo','Segoe UI',Tahoma,Arial,sans-serif;color:#171717;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f3f4f6;padding:32px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:480px;background-color:#ffffff;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.08);overflow:hidden;">
                    <tr>
                        <td align="center" style="padding:32px 24px 8px 24px;">
                            <img src="{{ asset('logo.png') }}" alt="{{ $appName }}" width="96" height="96" style="display:block;width:96px;height:96px;object-fit:contain;">
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:8px 32px 0 32px;text-align:right;">
                            <h1 style="margin:16px 0;font-size:24px;font-weight:700;color:#b91c1c;line-height:1.4;">
                                تجاوز السعة الاستيعابية
                            </h1>
                            <p style="margin:0 0 16px 0;font-size:15px;line-height:1.8;color:#4b5563;">
                                تم تجاوز السعة المحددة لإحدى الفئات أو الأفواج التابعة لك:
                            </p>
                            <p style="margin:0 0 12px 0;font-size:16px;line-height:1.7;color:#111827;font-weight:600;">
                                {{ $title }}
                            </p>
                            <p style="margin:0 0 16px 0;font-size:15px;line-height:1.8;color:#4b5563;">
                                العدد الحالي / السعة:
                                <span style="color:#b91c1c;font-weight:700;">{{ $current }} / {{ $capacity }}</span>
                            </p>
                            <p style="margin:0 0 16px 0;font-size:14px;line-height:1.8;color:#4b5563;">
                                يرجى رفع السعة، إنشاء فوج جديد، أو نقل بعض الطلاب.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding:16px 32px 8px 32px;">
                            <a href="{{ url($manageUrl) }}"
                               style="display:inline-block;padding:14px 36px;background-color:#171717;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;border-radius:9999px;">
                                إدارة
                            </a>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:16px 32px 32px 32px;border-top:1px solid #e5e7eb;text-align:center;">
                            <p style="margin:0;font-size:12px;color:#9ca3af;">
                                © {{ date('Y') }} {{ $appName }}
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
