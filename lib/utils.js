export function normalizeText(text) {
    return text
        .toLowerCase()
        .replace(/[^\w\s]/gi, '') // hapus simbol
        .trim();
}

export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
