import { writable } from "svelte/store";

export const skillDetailOpen = writable<string|null>(null);
