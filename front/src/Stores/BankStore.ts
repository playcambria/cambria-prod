import { writable } from "svelte/store";

export const bankTabsStore = writable<string[][]>([]);
export const showBankScreen = writable<boolean>(false);
