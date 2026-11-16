export class FastVoiceClient {
  constructor() {
    const url = new URL('./worker.mjs', import.meta.url);
    url.search = new URL(import.meta.url).search;
    this.worker = new Worker(url, { type: 'module' });
    this.pending = new Map();
    this.nextId = 0;
    this.closed = false;
    this.worker.onmessage = event => this.handleMessage(event.data);
    this.worker.onerror = event => {
      event.preventDefault();
      this.fail(new Error(event.message || 'Fast voice worker failed.'));
    };
  }

  request(type, data, context = null, onChunk = null) {
    if (this.closed) return Promise.reject(new Error('Fast voice worker is closed.'));
    const id = ++this.nextId;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { type, context, onChunk, buffers: [], resolve, reject });
      try {
        this.worker.postMessage({ type, id, ...data });
      } catch (error) {
        this.pending.delete(id);
        reject(error);
      }
    });
  }

  preload(voice) {
    return this.request('preload', { voice });
  }

  synthesize(text, voice, context, onChunk) {
    return this.request('synthesize', { text, voice }, context, onChunk);
  }

  handleMessage(message) {
    const pending = this.pending.get(message.id);
    if (!pending) return;
    if (message.type === 'audio') {
      try {
        if (!(message.samples instanceof Float32Array) || !message.samples.length) {
          throw new Error('Fast voice generated invalid audio.');
        }
        const buffer = pending.context.createBuffer(1, message.samples.length, 24000);
        buffer.copyToChannel(message.samples, 0);
        pending.buffers.push(buffer);
        if (pending.onChunk) pending.onChunk(buffer);
      } catch (error) {
        this.pending.delete(message.id);
        pending.reject(error);
      }
    } else if (message.type === 'ready' || message.type === 'done') {
      this.pending.delete(message.id);
      pending.resolve(pending.type === 'synthesize' ? pending.buffers : undefined);
    } else if (message.type === 'error') {
      this.pending.delete(message.id);
      pending.reject(new Error(message.error || 'Fast voice failed.'));
    }
  }

  clear() {
    if (this.closed) return;
    this.worker.postMessage({ type: 'clear' });
    for (const [id, pending] of this.pending) {
      if (pending.type === 'synthesize') {
        this.pending.delete(id);
        pending.resolve([]);
      }
    }
  }

  fail(error) {
    if (this.closed) return;
    this.closed = true;
    this.worker.terminate();
    for (const pending of this.pending.values()) pending.reject(error);
    this.pending.clear();
  }

  close() {
    this.fail(new Error('Fast voice worker closed.'));
  }
}
