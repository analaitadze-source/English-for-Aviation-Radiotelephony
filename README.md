# English-for-Aviation-Radiotelephony

Practice radiotelephony with flashcards, matching, gap-fill scenarios and quizzes. Each card's dialogue side includes related collocations and compound nouns in general aviation English; these are not necessarily prescribed radio transmissions. The collocations section provides searchable vocabulary and dialogue examples from the current deck, alongside general English example sentences.

Each quiz selects ten different questions across easy, intermediate and advanced levels. Scenarios cover representative routine, abnormal and emergency exchanges; **New scenario** selects a different exercise, while **Retry same** keeps the chosen exercise and reshuffles its options. The scenario bank is not exhaustive.

These are illustrative training examples, not a complete or authoritative set of procedures. Follow current local publications, operator procedures and ATC instructions. Whole-hundred flight levels and radio channels may be spoken differently under local procedures; examples use the whole-hundreds convention and ICAO's `decimal`. References: [SKYbrary's ICAO Annex 11 readback summary](https://skybrary.aero/articles/read-back-or-hear-back), [flight-level phraseology](https://skybrary.aero/articles/flight-level-or-altitude-confusion), [ICAO SID/STAR guidance](https://www.icao.int/airnavigation/faq-atco), and the [UK CAA Radiotelephony Manual, CAP 413](https://www.caa.co.uk/media/km2juvmx/cap413-edition-24-radio-telephony.pdf) (which includes UK-specific requirements).

The page title and browser tab use the shield logo in `assets\shield-logo.svg`. The header and LinkedIn link preview also use `assets\radar-preview.png`, depicting a headset-wearing pilot with radar. The header crops that image to focus on the pilot and radar; the Open Graph metadata uses the full image unchanged. `assets\radar-preview.svg` retains the earlier radar-only vector artwork. If the preview changes, export the PNG at 1200 x 627 pixels, update the image version in the header and metadata, and keep the dimensions in sync.

## Voices and interface

Use **Voices** to choose separate controller and pilot voices from five male and five female American/British voices. British Edwin and Maeve are the respective defaults. The selected voices are prepared locally in the background, and likely card or scenario speech is prepared while you read. Reduced-data and 2G connections defer preparation until an audio button is pressed. The phrase button reads the phrase; the dialogue button reads every turn in displayed order. Longer messages can start before generation finishes, and recent audio is cached in memory.

First use still requires downloads and cannot be instantaneous: the two default voices and pronunciation data total about 18 MB uncompressed; additional voices generally need about 6 MB each. The British male Fable voice needs about 20 MB more for its model and runtime and can take longer to generate speech. Times vary with the device, connection and browser cache. A browser with WebAssembly SIMD, Web Workers and Web Audio is required. Voice assets are served by this site, and dialogue text is not sent to a speech server. Synthesized pronunciation should not be treated as operational guidance.

Nine voices use [mesm-tts](https://huggingface.co/mesmertech/mesm-tts) and its local WebAssembly engine (Apache-2.0; see `assets\fast-tts\LICENSE` and `NOTICE`). Fable uses [Paradee 1.2](https://huggingface.co/sahilmahendrakar/Paradee-8M-v1.2) (Apache-2.0) with [ONNX Runtime Web](https://onnxruntime.ai/) (MIT; see `assets\fast-tts\ONNXRUNTIME-LICENSE` and `ONNXRUNTIME-THIRD-PARTY-NOTICES`); this runtime is not a voice service. Pronunciation uses [HeadTTS 1.3.0](https://github.com/met4citizen/HeadTTS/tree/v1.3.0) language modules (MIT; see `assets\headtts\LICENSE`), its CMU dictionary (see `assets\headtts\CMUDICT-LICENSE`), and [Misaki's British lexicon](https://github.com/hexgrad/misaki) (Apache-2.0; see `assets\headtts\MISAKI-LICENSE`). British voices fall back to the American dictionary or rules for unknown words. Asset revisions and hashes are recorded in `assets\fast-tts\manifest.json`. Keep the files under `assets`: the default GitHub Pages Jekyll build excludes `vendor`. Update `VOICE_ENGINE_URL` when changing the voice engine or British pronunciation assets.

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
