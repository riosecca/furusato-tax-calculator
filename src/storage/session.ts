export type SimpleSessionState = {
  family: string;
  income: string;
  oneStop: boolean;
  largeDeduction: boolean;
};

export type AdvancedSessionState = Record<string, string>;

const SIMPLE_KEY = 'furusato-simple-session';
const ADVANCED_KEY = 'furusato-advanced-session';

function getStorage(): Storage | null {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return null;
  }
  return window.localStorage;
}

function readState<T>(key: string): T | null {
  const storage = getStorage();
  if (!storage) {
    return null;
  }

  try {
    const raw = storage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeState<T>(key: string, value: T): void {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota errors or disabled storage.
  }
}

export function loadSimpleSessionState(): SimpleSessionState | null {
  return readState<SimpleSessionState>(SIMPLE_KEY);
}

export function saveSimpleSessionState(state: SimpleSessionState): void {
  writeState(SIMPLE_KEY, state);
}

export function loadAdvancedSessionState(): AdvancedSessionState | null {
  return readState<AdvancedSessionState>(ADVANCED_KEY);
}

export function saveAdvancedSessionState(state: AdvancedSessionState): void {
  writeState(ADVANCED_KEY, state);
}
