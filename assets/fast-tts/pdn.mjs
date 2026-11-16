// pdn engine loader (browser and Node). One wasm module (~tens of kB, no imports) + one .pdn weight file.
//   const e = await createEngine(pdnBytesOrPath, { wasm: bytesOrPath, relaxed: true|false, int8: false|true, warmup: false|true });
//   const audio = e.synth(Int32Array ids, speed = 1);          // Float32Array @ 24 kHz
// Noise: in-engine xoshiro128+ / Box-Muller by default; e.synthDet(ids) feeds the deterministic parity noise
// d(k) = 1.3 sin(0.7311 k) per noise tensor (same as the reference ONNX patch) instead.
const DT = { f32: 0, f16: 1, q8: 2, q4: 3, i32: 4, q6: 5 };
const isNode = typeof process !== "undefined" && process.versions?.node;

async function bytesOf(x) {
  if (x instanceof Uint8Array || x instanceof ArrayBuffer) return new Uint8Array(x);
  if (isNode && typeof x === "string" && !/^https?:/.test(x)) { const fs = await import("node:fs"); return new Uint8Array(fs.readFileSync(x)); }
  return new Uint8Array(await (await fetch(x)).arrayBuffer());
}
export function relaxedSimdSupported() {   // validates a 72-byte module whose one function uses f32x4.relaxed_madd
  const b = new Uint8Array([0,97,115,109,1,0,0,0,1,6,1,96,1,125,1,125,3,2,1,0,4,5,1,112,1,1,1,5,3,1,0,1,7,14,2,6,109,101,109,111,114,121,2,0,1,102,0,0,10,22,1,20,1,1,123,32,0,253,19,34,1,32,1,32,1,253,133,2,253,31,0,11]);
  try { return WebAssembly.validate(b); } catch { return false; }
}

export function parsePdn(bytes) {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (String.fromCharCode(...bytes.subarray(0, 4)) !== "PDN1") throw new Error("not a .pdn file");
  const n = dv.getUint32(4, true); const hdr = JSON.parse(new TextDecoder().decode(bytes.subarray(8, 8 + n)));
  return { hdr, blob: bytes.subarray(8 + n) };
}

export async function createEngine(pdn, opts = {}) {
  const here = isNode ? new URL(".", import.meta.url) : null;
  const relaxed = opts.relaxed ?? relaxedSimdSupported();
  const wasmSrc = opts.wasm ?? (isNode ? new URL(relaxed ? "pdn_r.wasm" : "pdn.wasm", here).pathname : new URL(relaxed ? "pdn_r.wasm" : "pdn.wasm", import.meta.url).href);
  const t0 = performance.now();
  const [wb, pb] = await Promise.all([bytesOf(wasmSrc), bytesOf(pdn)]);
  const { instance } = await WebAssembly.instantiate(wb, {});
  const ex = instance.exports; const t1 = performance.now();
  const { hdr, blob } = parsePdn(pb); const cfg = hdr.cfg;
  const u8 = () => new Uint8Array(ex.memory.buffer);
  const put = (src) => { const p = ex.pdn_alloc(src.byteLength); u8().set(new Uint8Array(src.buffer, src.byteOffset, src.byteLength), p); return p; };
  const blobPtr = put(blob);
  const T = hdr.tensors, desc = new Uint8Array(64 * T.length), dv = new DataView(desc.buffer);
  T.forEach((t, i) => {
    const o = 64 * i; const nm = new TextEncoder().encode(t.name); desc.set(nm.subarray(0, 23), o);
    const numel = t.shape ? t.shape.reduce((a, b) => a * b, 1) : t.rows * t.cols;
    const [rows, cols] = t.rows ? [t.rows, t.cols] : [1, numel];
    [DT[t.dtype], rows, cols, t.off, t.bits || 0, t.group || 0, t.ngroups || 0, t.soff || 0, numel].forEach((v, k) => dv.setInt32(o + 24 + 4 * k, v, true));
  });
  // icfg zero-padded: trailing flags (e.g. the trunk norm) are absent in older files and read as 0
  const descPtr = put(desc), icPtr = put(Int32Array.from([...cfg.icfg, 0, 0, 0, 0, 0, 0, 0, 0])), fcPtr = put(Float32Array.from(cfg.fcfg));
  const idsPtr = ex.pdn_alloc(4 * cfg.text.max_pos);   // fixed input buffer below the per-call arena mark
  const miss = ex.pdn_init(blobPtr, descPtr, T.length, icPtr, fcPtr);
  if (miss) { const p = ex.pdn_missing(), m = u8(); let q = p; while (m[q]) q++; throw new Error(`pdn_init: ${miss} tensors missing: ${new TextDecoder().decode(m.subarray(p, Math.min(q, p + 300)))}`); }
  if (opts.int8) ex.pdn_set_int8(1);   // int8 candidates' numerics for trunk convs + head MatMuls (before the first call)
  // pv-web: intonation expansion (pv flow, engine f0_expand) on the decoder's F0, per sentence; 1 = off (the default)
  const setAlpha = (a) => { if (ex.pdn_set_alpha) ex.pdn_set_alpha(+a); else if (+a !== 1) throw new Error("this engine build has no intonation expansion"); };
  if (opts.alpha != null && +opts.alpha !== 1) setAlpha(opts.alpha);
  const t2 = performance.now();
  let seed = opts.seed ?? 1;
  function run(ids, speed, det) {
    if (ids.length > cfg.text.max_pos) throw new Error(`at most ${cfg.text.max_pos} phonemes per call`);
    new Int32Array(ex.memory.buffer, idsPtr, ids.length).set(ids);
    ex.pdn_noise_mode(det ? 1 : 0, seed++);
    const F = ex.pdn_text(idsPtr, ids.length, speed);
    if (det) for (let i = 0; i < 4; i++) {
      const n = ex.pdn_noise_len(i); if (!n) continue;
      const z = new Float32Array(ex.memory.buffer, ex.pdn_noise_ptr(i), n);
      for (let k = 0; k < n; k++) z[k] = Math.fround(1.3 * Math.sin(0.7311 * (k + 1)));
    }
    const S = ex.pdn_decode();
    return { F, wave: new Float32Array(ex.memory.buffer, ex.pdn_wave(), S).slice() };
  }
  // streaming: text side + trunk, then the head / DSP in chunks of 80-fps frames (first chunk `first`, then `chunk`); yields
  // Float32Array pieces in order, bit-identical in total to synth() (fp32 mode). First audio after text + trunk + `first` frames.
  function* stream(ids, speed = 1, first = 16, chunk = 40) {
    if (ids.length > cfg.text.max_pos) throw new Error(`at most ${cfg.text.max_pos} phonemes per call`);
    new Int32Array(ex.memory.buffer, idsPtr, ids.length).set(ids);
    ex.pdn_noise_mode(0, seed++); ex.pdn_text(idsPtr, ids.length, speed);
    const S = ex.pdn_dec_begin(); let done = 0, c = first;
    while (done < S) {
      const got = ex.pdn_dec_step(c); c = chunk;
      if (got > done) { yield new Float32Array(ex.memory.buffer, ex.pdn_wave() + 4 * done, got - done).slice(); done = got; }
    }
  }
  // one worker's share of a sentence split K ways (pdn_dec_range): output frames [k n / K, (k+1) n / K); every share must use the
  // same noise seed. Returns { start (sample offset), samples }.
  function part(ids, speed, nseed, k, K) {
    new Int32Array(ex.memory.buffer, idsPtr, ids.length).set(ids);
    ex.pdn_noise_mode(0, nseed); const F = ex.pdn_text(idsPtr, ids.length, speed); ex.pdn_dec_begin();
    const n = 2 * F, a = Math.floor(k * n / K), b = Math.floor((k + 1) * n / K), cnt = ex.pdn_dec_range(a, b);
    return { start: 300 * a, samples: new Float32Array(ex.memory.buffer, ex.pdn_wave() + 1200 * a, cnt).slice() };
  }
  // warm-up: one tiny synthesis at load runs every code path once, so V8 tiers the hot loops up before the first real call
  // (first sentence ~30 ms instead of ~65 ms on x86; total time to first audio unchanged). Use when loading ahead of playback.
  if (opts.warmup) { run(Int32Array.from([0, 50, 60, 0]), 1, false); }
  return {
    cfg, relaxed, init_ms: { wasm: t1 - t0, weights: t2 - t1, total: performance.now() - t0 }, stream, part,
    synth: (ids, speed = 1) => run(ids, speed, false).wave,
    // text side only (benchmarks: its share of the synthesis time); returns the 40-fps frame count
    textOnly: (ids, speed = 1) => { new Int32Array(ex.memory.buffer, idsPtr, ids.length).set(ids); return ex.pdn_text(idsPtr, ids.length, speed); },
    synthDet: (ids, speed = 1) => run(ids, speed, true).wave,
    memoryBytes: () => ex.memory.buffer.byteLength, setAlpha,
    exports: ex,
  };
}
