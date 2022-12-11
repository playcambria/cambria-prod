import { writable } from "svelte/store";

export const friendsListStore = writable<{ [key: string]: boolean }>({});
