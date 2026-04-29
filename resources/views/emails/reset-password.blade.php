<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>إعادة تعيين كلمة السر</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:'Tajawal','Cairo','Segoe UI',Tahoma,Arial,sans-serif;color:#171717;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f3f4f6;padding:32px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:480px;background-color:#ffffff;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.08);overflow:hidden;">
                    <tr>
                        <td align="center" style="padding:32px 24px 8px 24px;">
                            <img src="{{ asset('logo.png') }}" alt="{{ config('app.name') }}" width="96" height="96" style="display:block;width:96px;height:96px;object-fit:contain;">
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:8px 32px 0 32px;text-align:right;">
                            <h1 style="margin:16px 0;font-size:24px;font-weight:700;color:#111827;line-height:1.4;">
                                إعادة تعيين كلمة السر
                            </h1>
                            <p style="margin:0 0 16px 0;font-size:15px;line-height:1.8;color:#4b5563;">
                                مرحباً {{ $notifiable->name ?? '' }}،
                            </p>
                            <p style="margin:0 0 16px 0;font-size:15px;line-height:1.8;color:#4b5563;">
                                وصلنا طلب لإعادة تعيين كلمة السر الخاصة بحسابك. اضغط على الزر أدناه لاختيار كلمة سر جديدة. الرابط صالح لمدة {{ $count }} دقيقة فقط.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding:16px 32px 8px 32px;">
                            <a href="{{ $url }}"
                               style="display:inline-block;padding:14px 36px;background-color:#171717;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;border-radius:9999px;">
                                إعادة تعيين كلمة السر
                            </a>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:16px 32px;text-align:right;">
                            <p style="margin:0 0 8px 0;font-size:13px;line-height:1.8;color:#6b7280;">
                                إذا لم تتمكن من الضغط على الزر، انسخ الرابط التالي والصقه في متصفحك:
                            </p>
                            <p style="margin:0 0 16px 0;font-size:12px;line-height:1.6;color:#374151;word-break:break-all;direction:ltr;text-align:left;">
                                <a href="{{ $url }}" style="color:#171717;text-decoration:underline;">{{ $url }}</a>
                            </p>
                            <p style="margin:0;font-size:13px;line-height:1.8;color:#6b7280;">
                                إذا لم تطلب إعادة تعيين كلمة السر، يمكنك تجاهل هذه الرسالة بأمان.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:16px 32px 32px 32px;border-top:1px solid #e5e7eb;text-align:center;">
                            <p style="margin:0;font-size:12px;color:#9ca3af;">
                                © {{ date('Y') }} {{ config('app.name') }}
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
