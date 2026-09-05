import '@testing-library/jest-dom';

const localStorageValues = new Map();

Object.defineProperty(globalThis, 'localStorage', {
	configurable: true,
	value: {
		get length() {
			return localStorageValues.size;
		},
		clear() {
			localStorageValues.clear();
		},
		getItem(key) {
			return localStorageValues.has(String(key)) ? localStorageValues.get(String(key)) : null;
		},
		key(index) {
			return Array.from(localStorageValues.keys())[index] ?? null;
		},
		removeItem(key) {
			localStorageValues.delete(String(key));
		},
		setItem(key, value) {
			localStorageValues.set(String(key), String(value));
		},
	},
});
