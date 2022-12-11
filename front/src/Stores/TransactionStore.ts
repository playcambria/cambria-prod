import { writable } from "svelte/store";

export const transactionVisibilityStore = writable(false);

export enum Transaction {
    wrap = "Wrap",
    unwrap = "Unwrap",
}

function createActiveTransactionStore() {
    const { subscribe, set } = writable<Transaction>(Transaction.unwrap);

    return {
        subscribe,
        set,
    };
}

export const activeTransactionStore = createActiveTransactionStore();

export function handleTransaction(token: string, txn: Transaction) {
    // could certainly support other UI triggers here
    activeTransactionStore.set(txn);
    transactionVisibilityStore.set(true);
}
