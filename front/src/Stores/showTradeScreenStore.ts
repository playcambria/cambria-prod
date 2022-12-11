import { writable } from "svelte/store";
import { PlayerInterface } from "../Phaser/Game/PlayerInterface";

export const showTradeScreenStore = writable<PlayerInterface | undefined>();
