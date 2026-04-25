"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seededShuffle = seededShuffle;
function lcgRand(seed) {
    let state = seed;
    return () => {
        state = (state * 1664525 + 1013904223) & 0xffffffff;
        return (state >>> 0) / 0x100000000;
    };
}
function hashSeed(seed) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        const char = seed.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0;
    }
    return Math.abs(hash);
}
function seededShuffle(arr, seed) {
    const result = [...arr];
    const rand = lcgRand(hashSeed(seed));
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}
//# sourceMappingURL=shuffle.js.map