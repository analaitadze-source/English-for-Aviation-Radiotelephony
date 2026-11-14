# English-for-Aviation-Radiotelephony

Practice radiotelephony with flashcards, matching, gap-fill scenarios and quizzes. The collocations section separates radio examples from general aviation English.

These are illustrative training examples, not a complete or authoritative set of procedures. Follow current local publications, operator procedures and ATC instructions. References: [SKYbrary's ICAO Annex 11 readback summary](https://skybrary.aero/articles/read-back-or-hear-back), [ICAO SID/STAR guidance](https://www.icao.int/airnavigation/faq-atco), and the [UK CAA Radiotelephony Manual, CAP 413](https://www.caa.co.uk/media/km2juvmx/cap413-edition-24-radio-telephony.pdf) (which includes UK-specific requirements).

## Custom flashcards

Existing decks using `atcLine` and `pilotLine` remain supported and display ATC first. To start with the pilot and add later transmissions, add these properties to a complete card:

```json
{
  "firstSpeaker": "PILOT",
  "followUp": [
    { "speaker": "PILOT", "text": "Pushback approved, Example 1." }
  ]
}
```

Each follow-up speaker must be `ATC` or `PILOT`. Display and dialogue audio use the same order. Imported decks saved in the browser are left unchanged; export a copy before resetting to the updated default deck.

## Verification

Serve the repository over HTTP (for example, `python -m http.server 8000`) and open `http://localhost:8000/tests/dialogue-tests.html` to run the dialogue, audio, scenario and custom-deck regression checks. The tests have no package dependencies.
