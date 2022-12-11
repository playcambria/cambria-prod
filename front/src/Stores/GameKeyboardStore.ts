import { writable } from "svelte/store";

// Chat Input
export const gameKeyboardStore = writable<string | undefined>(undefined);
