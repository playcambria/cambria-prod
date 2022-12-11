import { writable } from "svelte/store";
// import { RemotePlayer } from "../Phaser/Entity/RemotePlayer";

export type WalletProfile = {
    walletAddress: string;
    playerName: string;
};

export const shownProfileStore = writable<WalletProfile | null>();
