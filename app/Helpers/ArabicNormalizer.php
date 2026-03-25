<?php

namespace App\Helpers;

class ArabicNormalizer
{
    /**
     * Normalize Arabic text for comparison purposes.
     *
     * Removes diacritics and normalizes common letter variants
     * so that visually similar names are treated as equal.
     */
    public static function normalize(string $text): string
    {
        // Remove tashkeel (diacritics)
        $text = preg_replace('/[\x{0610}-\x{061A}\x{064B}-\x{065F}\x{0670}\x{06D6}-\x{06DC}\x{06DF}-\x{06E4}\x{06E7}\x{06E8}\x{06EA}-\x{06ED}]/u', '', $text);

        // Normalize alef variants (أ إ آ ٱ) to plain alef (ا)
        $text = preg_replace('/[\x{0623}\x{0625}\x{0622}\x{0671}]/u', "\u{0627}", $text);

        // Normalize taa marbouta (ة) to haa (ه)
        $text = str_replace("\u{0629}", "\u{0647}", $text);

        // Normalize alef maksura (ى) to yaa (ي)
        $text = str_replace("\u{0649}", "\u{064A}", $text);

        // Normalize whitespace
        $text = preg_replace('/\s+/', ' ', trim($text));

        return $text;
    }
}
