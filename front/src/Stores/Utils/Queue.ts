export interface IQueue<T> {
    count(): number;
    dequeue(): T | undefined;
    enqueue(item: T): void;
    flush(): T[];
    reset(): void;
    setFifo(fifo: boolean): void;
    setLifo(lifo: boolean): void;
    truncate(length: number): void;
}
export class Queue<T> implements IQueue<T> {
    protected elements: T[];
    protected fifo = true;
    constructor(...args: T[]) {
        this.elements = [...args];
    }
    count() {
        return this.elements.length;
    }
    dequeue(): T | undefined {
        if (this.fifo) {
            return this.elements.shift();
        }
        return this.elements.pop();
    }
    enqueue(...args: T[]) {
        return this.elements.push(...args);
    }
    // Like dequeue but will flush all queued elements
    flush(): T[] {
        const items = [];
        while (this.count()) {
            const item = this.dequeue();
            if (item) {
                items.push(item);
            }
        }
        return items;
    }
    setFifo(fifo = true) {
        this.fifo = fifo;
    }
    setLifo(lifo = true) {
        this.fifo = !lifo;
    }
    reset(): void {
        this.truncate(0);
    }
    truncate(length: number) {
        if (Number.isInteger(length) && length > -1) {
            this.elements.length = length;
        }
    }
}
