// https://medium.com/geekculture/svelte-stores-352c61759a88
import { writable, get, Unsubscriber } from "svelte/store";
import { IQueue, Queue } from "./Queue";

export interface QueueStore<T> extends IQueue<T> {
    self(): object;
    subscribe(v: T): Unsubscriber;
}
export const newQueueStore = function <T>() {
    const store = writable(new Queue<T>());
    return {
        count: () => get(store).count(),
        dequeue: () => {
            const q = get(store);
            const item = q.dequeue();
            store.set(q);
            return item;
        },
        enqueue: (...args: T[]) => {
            const q = get(store);
            q.enqueue(...args);
            store.set(q);
        },
        flush: () => {
            const q = get(store);
            const e = q.flush();
            store.set(q);
            return e;
        },
        reset: () => {
            const q = get(store);
            q.reset();
            store.set(q);
        },
        self: () => get(store),
        setFifo(fifo: boolean): void {
            const q = get(store);
            q.setFifo(fifo);
        },
        setLifo(lifo: boolean): void {
            const q = get(store);
            q.setLifo(lifo);
        },
        subscribe: store.subscribe,
        truncate: (length: number) => {
            const q = get(store);
            q.truncate(length);
            store.set(q);
        },
    } as QueueStore<T>;
};
