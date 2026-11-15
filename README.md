# English-for-Aviation-Radiotelephony

Practice radiotelephony with flashcards, matching, gap-fill scenarios and quizzes. Each card's dialogue side includes related collocations and compound nouns in general aviation English; these are not necessarily prescribed radio transmissions. The collocations section provides searchable vocabulary and dialogue examples from the current deck, alongside general English example sentences.

Each quiz selects ten different questions across easy, intermediate and advanced levels. Scenarios cover representative routine, abnormal and emergency exchanges; **New scenario** selects a different exercise, while **Retry same** keeps the chosen exercise and reshuffles its options. The scenario bank is not exhaustive.

These are illustrative training examples, not a complete or authoritative set of procedures. Follow current local publications, operator procedures and ATC instructions. Whole-hundred flight levels and radio channels may be spoken differently under local procedures; examples use the whole-hundreds convention and ICAO's `decimal`. References: [SKYbrary's ICAO Annex 11 readback summary](https://skybrary.aero/articles/read-back-or-hear-back), [flight-level phraseology](https://skybrary.aero/articles/flight-level-or-altitude-confusion), [ICAO SID/STAR guidance](https://www.icao.int/airnavigation/faq-atco), and the [UK CAA Radiotelephony Manual, CAP 413](https://www.caa.co.uk/media/km2juvmx/cap413-edition-24-radio-telephony.pdf) (which includes UK-specific requirements).

The page title and browser tab use the shield logo in `assets\shield-logo.svg`. The header and LinkedIn link preview also use `assets\radar-preview.png`, depicting a headset-wearing pilot with radar. The header crops that image to focus on the pilot and radar; the Open Graph metadata uses the full image unchanged. `assets\radar-preview.svg` retains the earlier radar-only vector artwork. If the preview changes, export the PNG at 1200 x 627 pixels, update the image version in the header and metadata, and keep the dimensions in sync.

## Voices and interface

Use **Voices** to choose separate American or British voices for the controller and pilot. British George and Emma are the respective defaults. Opening a card or scenario starts preparing speech on the device; the first use downloads roughly 100–200 MB of model and runtime data and can still take time. Reduced-data and 2G connections defer preparation until an audio button is pressed. On compatible GPUs, likely speech is prepared while you review a card or scenario. Card audio displays its progress beside the buttons. Longer messages begin as their first part is ready, and recently generated audio is kept in memory for quick replay until the page closes. Dialogue text is not sent to a speech server. Compatible GPUs use a half-precision model; other devices use the standard model or CPU, which can be slower. Synthesized pronunciation should not be treated as operational guidance.

The independent voices use [HeadTTS 1.3.0](https://github.com/met4citizen/HeadTTS/tree/v1.3.0) (MIT; see `assets\headtts\LICENSE`), its CMU pronunciation dictionary (see `assets\headtts\CMUDICT-LICENSE`), and the [Kokoro model](https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX-timestamped) (Apache-2.0). The bundled engine is patched for initialization, preloading, queue cancellation and error reporting. British voices use [Misaki's British pronunciation lexicon](https://github.com/hexgrad/misaki) (Apache-2.0; see `assets\headtts\MISAKI-LICENSE`), falling back to the American dictionary or rules for unknown words. Keep the voice files under `assets\headtts`: the default GitHub Pages Jekyll build excludes `vendor`. Update `VOICE_ENGINE_URL` when changing the voice engine or British pronunciation assets so browsers load the new version. Model and runtime files are downloaded from Hugging Face and jsDelivr.

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
