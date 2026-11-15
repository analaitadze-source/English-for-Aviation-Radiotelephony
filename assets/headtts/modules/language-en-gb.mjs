import { Language as AmericanLanguage } from "./language-en-us.mjs";

class Language extends AmericanLanguage {
  async loadDictionary(dictionary = null, force = false) {
    if (this.britishDictionary && !force) return;
    if (!dictionary || !/en-gb\.txt$/i.test(dictionary)) {
      throw new Error("British pronunciation dictionary URL is missing.");
    }

    const version = new URL(import.meta.url).search;
    const americanURL = dictionary.replace(/en-gb\.txt$/i, "en-us.txt") + version;
    const britishURL = dictionary.replace(/en-gb\.txt$/i, "en-gb.json") + version;
    const [, response] = await Promise.all([
      super.loadDictionary(americanURL, force),
      fetch(britishURL)
    ]);
    if (!response.ok) throw new Error("British pronunciation dictionary could not be loaded.");
    const entries = await response.json();
    if (!entries || typeof entries !== "object" || Array.isArray(entries)) {
      throw new Error("British pronunciation dictionary is invalid.");
    }
    this.britishDictionary = entries;
  }

  phonemizeWord(word) {
    const entries = this.britishDictionary;
    const lower = word.toLowerCase();
    const entry = entries && (Object.prototype.hasOwnProperty.call(entries, lower) ? entries[lower] :
      Object.prototype.hasOwnProperty.call(entries, word) ? entries[word] : null);
    const phonemes = typeof entry === "string" ? entry : entry && entry.DEFAULT;
    return typeof phonemes === "string" && phonemes ? [...phonemes] : super.phonemizeWord(word);
  }
}

export { Language };
