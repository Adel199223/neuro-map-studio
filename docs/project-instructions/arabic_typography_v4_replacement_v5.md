# Arabic Typography Rules v4

Arabic text must never inherit the Latin Comic Sans reading font by default.
Use a dedicated Arabic-friendly stack and treat Arabic as its own script system.

## Core preference
When Arabic appears, prefer a calm, readable Naskh-style presentation.

Reserve Uthmani/Quran-style presentation only for:
- exact Quranic text
- exact Mushaf-style source text
- directly accessible source text that visibly uses that style

Do not apply Quranic/Uthmani styling simply because text is Arabic, religious, or partly vocalized.

## Source-faithful vocalization
Preserve Arabic exactly as it appears in accessible material.

Non-negotiable:
- do not invent diacritics
- do not add vocalization not present in the source
- do not upgrade plain Arabic into vocalized Arabic for beauty
- do not rewrite a source word in a more “correct-looking” vocalized form unless the source supports it
- if source has no diacritics, keep none
- if source has partial diacritics, preserve that partial state
- if source has full diacritics, preserve them exactly

## Direction and isolation
Use proper direction handling:
- Arabic-heavy sections: `dir="rtl"`
- mixed inline Arabic inside English: isolate with `dir="rtl"` and `lang="ar"` on the inline element
- avoid placing raw Arabic in browser `<title>` when bidi isolation is unavailable or unstable
- on-page headings may contain Arabic when properly isolated

## Arabic font stacks
Use Arabic-friendly stacks for Arabic text, for example:
```css
:root{
  --font-ar: "Noto Naskh Arabic", "Amiri", "Scheherazade New", "Tahoma", "Arial", sans-serif;
}
.ar, [lang="ar"]{font-family:var(--font-ar);}
```

Do not share or embed font files.
Use system/browser fonts only unless the user provides a permitted font asset and explicitly asks for embedding.

## Mixed-script pages
For mixed English/Arabic pages:
- keep English UI and Latin explanation in the Comic Sans Latin stack
- isolate Arabic spans, quotes, and cards with Arabic stack
- do not let Arabic inherit Latin letter spacing
- avoid cramped bilingual tables on phone
- prefer stacked cards for bilingual comparisons

## Arabic mobile layout
Phone width rules:
- avoid squeezing Arabic text into narrow table columns
- prefer stacked cards
- keep Arabic line-height generous
- avoid forced justification
- make source labels and translations visually distinct

## Arabic glossary handling
If Arabic terms need glosses:
- keep Arabic term exact
- do not add diacritics in the tooltip unless present in source
- tooltip can be bilingual only if user requests or source provides bilingual material
- Arabic tooltip text should use Arabic stack and direction

## Final Arabic audit
Before delivery when Arabic appears:
- no invented diacritics
- Arabic uses Arabic stack, not Comic Sans
- direction is stable
- phone layout does not squeeze Arabic
- browser title is bidi-safe
- exact source wording preserved where it matters
