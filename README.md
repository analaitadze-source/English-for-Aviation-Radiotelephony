# English-for-Aviation-Radiotelephony

Practice radiotelephony with flashcards, matching, gap-fill scenarios and quizzes. Each card's dialogue side includes related collocations and compound nouns in general aviation English; these are not necessarily prescribed radio transmissions. The collocations section provides searchable vocabulary and dialogue examples from the current deck, alongside general English example sentences.

These are illustrative training examples, not a complete or authoritative set of procedures. Follow current local publications, operator procedures and ATC instructions. References: [SKYbrary's ICAO Annex 11 readback summary](https://skybrary.aero/articles/read-back-or-hear-back), [ICAO SID/STAR guidance](https://www.icao.int/airnavigation/faq-atco), and the [UK CAA Radiotelephony Manual, CAP 413](https://www.caa.co.uk/media/km2juvmx/cap413-edition-24-radio-telephony.pdf) (which includes UK-specific requirements).

The header and LinkedIn link preview use `assets\radar-preview.png`, depicting a headset-wearing pilot with radar. The header crops the image to focus on the pilot and radar; the Open Graph metadata uses the full image. `assets\radar-preview.svg` retains the earlier radar-only vector artwork. If the preview changes, export the PNG at 1200 x 627 pixels, update the image version in the header and metadata, and keep the dimensions in sync.

## Voices and interface

Use **Voices** to choose separate American or British voices for the controller and pilot. Speech is generated on the device; the first playback downloads roughly 100 MB of model and runtime data, and later playback may be faster when the browser caches it. Dialogue text is not sent to a speech server. Voice generation can be slower on devices without WebGPU, and synthesized pronunciation should not be treated as operational guidance.

The independent voices use [HeadTTS 1.3.0](https://github.com/met4citizen/HeadTTS/tree/v1.3.0) (MIT; see `assets\headtts\LICENSE`), its CMU pronunciation dictionary (see `assets\headtts\CMUDICT-LICENSE`), and the [Kokoro model](https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX-timestamped) (Apache-2.0). Keep the voice files under `assets\headtts`: the default GitHub Pages Jekyll build excludes `vendor`. The engine's English pronunciation dictionary is American even when a British voice is selected. Model and runtime files are downloaded from Hugging Face and jsDelivr.

The interface uses the supplied dark aurora style reference with Figtree, Inter and IBM Plex Mono, while retaining this site's own content and branding. The fonts are served by Fontsource under the SIL Open Font License 1.1.

## Custom flashcards

Existing decks using `atcLine` and `pilotLine` remain supported and display ATC first. To start with the pilot and add later transmissions, add these properties to a complete card:

```json
{
  "firstSpeaker": "PILOT",
  "collocations": ["request pushback", "receive pushback approval"],
  "compoundNouns": ["pushback request", "parking stand"],
  "followUp": [
    { "speaker": "PILOT", "text": "Pushback approved, Example 1." }
  ]
}
```

Each follow-up speaker must be `ATC` or `PILOT`. Display and dialogue audio use the same order. Each vocabulary field can be a string or an array of non-empty strings. Older cards matching the defaults show their related vocabulary; other custom cards without vocabulary show labeled category or general examples. Invalid vocabulary in an already-saved deck is flagged on the card. Imported decks saved in the browser are left unchanged; export a copy before resetting to the updated default deck.

## Verification

Serve the repository over HTTP (for example, `python -m http.server 8000`) and open `http://localhost:8000/tests/dialogue-tests.html` to run the dialogue, audio, scenario, custom-deck and link-preview checks. The tests have no package dependencies.
