<?php

use App\Helpers\ArabicNormalizer;

it('normalizes alef variants to plain alef', function () {
    // أ (hamza above) → ا
    expect(ArabicNormalizer::normalize('أحمد'))->toBe('احمد');
    // إ (hamza below) → ا
    expect(ArabicNormalizer::normalize('إبراهيم'))->toBe('ابراهيم');
    // آ (madda) → ا
    expect(ArabicNormalizer::normalize('آدم'))->toBe('ادم');
});

it('removes tashkeel diacritics', function () {
    // فَاطِمَة with fatha, kasra, fatha
    expect(ArabicNormalizer::normalize('فَاطِمَه'))->toBe('فاطمه');
    // مُحَمَّد with damma, fatha, shadda+fatha
    expect(ArabicNormalizer::normalize('مُحَمَّد'))->toBe('محمد');
});

it('normalizes taa marbouta to haa', function () {
    // فاطمة → فاطمه
    expect(ArabicNormalizer::normalize('فاطمة'))->toBe('فاطمه');
    // عائشة → عائشه (note: ئ stays as is, only ة changes)
    expect(ArabicNormalizer::normalize('خديجة'))->toBe('خديجه');
});

it('normalizes alef maksura to yaa', function () {
    // مصطفى → مصطفي
    expect(ArabicNormalizer::normalize('مصطفى'))->toBe('مصطفي');
    // موسى → موسي
    expect(ArabicNormalizer::normalize('موسى'))->toBe('موسي');
});

it('handles combined normalizations', function () {
    // أحمد with hamza alef + no other changes
    expect(ArabicNormalizer::normalize('أحمد'))->toBe('احمد');
    // إسماعيل → اسماعيل (hamza below alef)
    expect(ArabicNormalizer::normalize('إسماعيل'))->toBe('اسماعيل');
    // Compare normalized forms
    expect(ArabicNormalizer::normalize('أحمد'))->toBe(ArabicNormalizer::normalize('احمد'));
});

it('trims and normalizes whitespace', function () {
    expect(ArabicNormalizer::normalize('  أحمد  بن  علي  '))->toBe('احمد بن علي');
});
