const SIMPLE_KEY = 'furusato-simple-session';
const ADVANCED_KEY = 'furusato-advanced-session';
function getStorage() {
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
        return null;
    }
    return window.localStorage;
}
function readState(key) {
    const storage = getStorage();
    if (!storage) {
        return null;
    }
    try {
        const raw = storage.getItem(key);
        return raw ? JSON.parse(raw) : null;
    }
    catch (_a) {
        return null;
    }
}
function writeState(key, value) {
    const storage = getStorage();
    if (!storage) {
        return;
    }
    try {
        storage.setItem(key, JSON.stringify(value));
    }
    catch (_a) {
        // Ignore quota errors or disabled storage.
    }
}
export function loadSimpleSessionState() {
    return readState(SIMPLE_KEY);
}
export function saveSimpleSessionState(state) {
    writeState(SIMPLE_KEY, state);
}
export function loadAdvancedSessionState() {
    return readState(ADVANCED_KEY);
}
export function saveAdvancedSessionState(state) {
    writeState(ADVANCED_KEY, state);
}
