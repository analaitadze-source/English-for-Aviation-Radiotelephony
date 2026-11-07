// Strict ICAO digit-by-digit & NATO speech encoder
function encodeNATOSpeech(text) {
    let speakable = text;

    // 1. Expand Flight Levels (e.g. FL200 -> "Flight Level Two Zero Zero")
    speakable = speakable.replace(/FL\s*(\d+)/gi, (match, p1) => {
        let digitWords = p1.split('').map(d => NATO_MAP[d] || d).join(' ');
        return `Flight Level ${digitWords}`;
    });

    // 2. Expand Runway Designators (e.g. Runway 27L -> "Runway Two Seven Left")
    speakable = speakable.replace(/Runway\s*(\d+)([LCR]?)/gi, (match, digits, letter) => {
        let dSpoken = digits.split('').map(d => NATO_MAP[d] || d).join(' ');
        let lSpoken = letter === 'L' ? ' Left' : letter === 'C' ? ' Center' : letter === 'R' ? ' Right' : '';
        return `Runway ${dSpoken}${lSpoken}`;
    });

    // 3. FORCE ALL NUMBERS (including 452) to be spoken strictly digit-by-digit
    // Splits numbers into isolated space-separated ICAO phonetic words ("FOW-ER FIFE TOO")
    speakable = speakable.replace(/\b\d+\b/g, (match) => {
        return match.split('').map(d => NATO_MAP[d] || d).join(' ');
    });

    // 4. Expand Acronyms / Callsigns letter by letter if not common words
    speakable = speakable.replace(/\b([A-Z]{2,5})\b/g, (match) => {
        if (ICAO_DECODES[match] || match === 'MAYDAY' || match === 'PAN') return match;
        return match.split('').map(char => NATO_MAP[char] || char).join(' ');
    });

    return speakable;
}