import { createEngine, relaxedSimdSupported } from './pdn.mjs';

const voices = {
  fast_bryony: { file: 'bryony.pdn', language: 'en-gb' },
  fast_edwin: { file: 'edwin.pdn', language: 'en-gb' },
  fast_everly: { file: 'everly.pdn', language: 'en-us' },
  fast_fable: { file: 'paradee-int8.onnx', language: 'en-gb', paradee: true },
  fast_hugh: { file: 'hugh.pdn', language: 'en-gb' },
  fast_maeve: { file: 'maeve.pdn', language: 'en-gb' },
  fast_hadley: { file: 'hadley.pdn', language: 'en-us' },
  fast_miles: { file: 'miles.pdn', language: 'en-us' },
  fast_trevor: { file: 'trevor.pdn', language: 'en-us' },
  fast_wren: { file: 'wren.pdn', language: 'en-us' }
};
const engines = new Map();
const paradeeEngines = new Map();
const languages = new Map();
const ENGINE_CACHE_LIMIT = 3;
const SPEECH_SPEED = 1.08;
let tokenizer;
let queue = [];
let processing = false;
let generation = 0;

function assetURL(path) {
  const url = new URL(path, import.meta.url);
  url.search = new URL(import.meta.url).search;
  return url;
}

function loadOnce(map, key, load) {
  if (!map.has(key)) {
    const pending = load().catch(error => {
      if (map.get(key) === pending) map.delete(key);
      throw error;
    });
    map.set(key, pending);
  }
  return map.get(key);
}

function voiceInfo(voice) {
  if (!Object.prototype.hasOwnProperty.call(voices, voice)) {
    throw new Error('Unknown fast voice.');
  }
  return voices[voice];
}

function loadVoice(voice) {
  const info = voiceInfo(voice);
  if (info.paradee) {
    return loadOnce(paradeeEngines, voice, async () => {
      const ort = await import('./ort.wasm.min.mjs');
      ort.env.wasm.numThreads = 1;
      ort.env.wasm.wasmPaths = new URL('.', import.meta.url).href;
      const session = await ort.InferenceSession.create(assetURL(info.file).href, {
        executionProviders: ['wasm']
      });
      return { ort, session };
    });
  }
  if (engines.has(voice)) {
    const pending = engines.get(voice);
    engines.delete(voice);
    engines.set(voice, pending);
  }
  return loadOnce(engines, voice, async () => {
    const response = await fetch(assetURL(info.file));
    if (!response.ok) throw new Error(`Fast voice ${voice} is unavailable (HTTP ${response.status}).`);
    const weights = new Uint8Array(await response.arrayBuffer());
    const wasm = assetURL(relaxedSimdSupported() ? 'pdn_r.wasm' : 'pdn.wasm');
    return createEngine(weights, { warmup: true, wasm: wasm.href });
  }).then(engine => {
    while (engines.size > ENGINE_CACHE_LIMIT) engines.delete(engines.keys().next().value);
    return engine;
  });
}

function loadLanguage(code) {
  return loadOnce(languages, code, async () => {
    const url = new URL(`../headtts/modules/language-${code}.mjs`, import.meta.url);
    url.search = new URL(import.meta.url).search;
    const { Language } = await import(url.href);
    const language = new Language();
    const dictionary = new URL(`../headtts/dictionaries/${code}.txt`, import.meta.url);
    if (code === 'en-us') dictionary.search = new URL(import.meta.url).search;
    await language.loadDictionary(dictionary.href);
    return language;
  });
}

function loadTokenizer() {
  if (!tokenizer) {
    tokenizer = fetch(assetURL('tokenizer.json')).then(response => {
      if (!response.ok) throw new Error(`Voice tokenizer is unavailable (HTTP ${response.status}).`);
      return response.json();
    }).then(data => {
      if (!data.model || !data.model.vocab) throw new Error('Voice tokenizer is invalid.');
      return data.model.vocab;
    }).catch(error => {
      tokenizer = null;
      throw error;
    });
  }
  return tokenizer;
}

async function preload(voice) {
  const info = voiceInfo(voice);
  return Promise.all([loadVoice(voice), loadLanguage(info.language), loadTokenizer()]);
}

function encodePhonemes(phonemes, vocab) {
  const symbols = phonemes.filter(symbol => symbol !== '-');
  const unknown = symbols.find(symbol => !Object.prototype.hasOwnProperty.call(vocab, symbol));
  if (unknown) throw new Error(`Unsupported speech symbol: ${unknown}`);
  if (!symbols.some(symbol => /[^\s.,!?;:]/.test(symbol))) {
    throw new Error('No speech could be generated from this text.');
  }

  const batches = [];
  while (symbols.length) {
    let end = Math.min(510, symbols.length);
    if (end < symbols.length) {
      const boundary = symbols.lastIndexOf(' ', end - 1);
      if (boundary > 0) end = boundary + 1;
    }
    const part = symbols.splice(0, end);
    batches.push(Int32Array.from([0, ...part.map(symbol => vocab[symbol]), 0]));
  }
  return batches;
}

async function* generateAudio(engine, ids) {
  if (!engine.session) {
    yield* engine.stream(ids, SPEECH_SPEED, 16, 40);
    return;
  }
  const { ort, session } = engine;
  const result = await session.run({
    input_ids: new ort.Tensor('int64', BigInt64Array.from(ids, BigInt), [1, ids.length]),
    speed: new ort.Tensor('float32', Float32Array.of(SPEECH_SPEED), [1]),
    voice: new ort.Tensor('int64', BigInt64Array.of(3n), [1])
  });
  const output = result.waveform;
  if (!output || !(output.data instanceof Float32Array)) throw new Error('Fast voice generated invalid audio.');
  yield Float32Array.from(output.data);
}

async function processQueue() {
  if (processing) return;
  processing = true;
  try {
    while (queue.length) {
      const item = queue.shift();
      try {
        const [engine, language, vocab] = await preload(item.voice);
        if (item.generation !== generation) continue;
        const phonemes = language.generate([{ type: 'text', value: item.text }]).phonemes;
        for (const ids of encodePhonemes(phonemes, vocab)) {
          if (item.generation !== generation) break;
          for await (const samples of generateAudio(engine, ids)) {
            if (item.generation !== generation) break;
            if (!samples.length || !samples.every(Number.isFinite)) {
              throw new Error('Fast voice generated invalid audio.');
            }
            self.postMessage({ type: 'audio', id: item.id, samples }, [samples.buffer]);
            await new Promise(resolve => setTimeout(resolve, 0));
          }
        }
        if (item.generation === generation) self.postMessage({ type: 'done', id: item.id });
      } catch (error) {
        if (item.generation === generation) {
          self.postMessage({ type: 'error', id: item.id, error: error.message || String(error) });
        }
      }
    }
  } finally {
    processing = false;
  }
}

self.onmessage = ({ data }) => {
  if (data.type === 'preload') {
    Promise.resolve().then(() => preload(data.voice)).then(
      () => self.postMessage({ type: 'ready', id: data.id }),
      error => self.postMessage({ type: 'error', id: data.id, error: error.message || String(error) })
    );
  } else if (data.type === 'synthesize') {
    queue.push({ ...data, generation });
    processQueue();
  } else if (data.type === 'clear') {
    generation++;
    queue = [];
  }
};
