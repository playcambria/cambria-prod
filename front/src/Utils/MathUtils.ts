export class MathUtils {
    /**
     *
     * @param p Position to check.
     * @param r Rectangle to check the overlap against.
     * @returns true is overlapping
     */
    public static isOverlappingWithRectangle(
        p: { x: number; y: number },
        r: { x: number; y: number; width: number; height: number }
    ): boolean {
        return this.isBetween(p.x, r.x, r.x + r.width) && this.isBetween(p.y, r.y, r.y + r.height);
    }

    public static doRectanglesOverlap(
        r1: { x: number; y: number; width: number; height: number },
        r2: { x: number; y: number; width: number; height: number }
    ): boolean {
        return r1.x < r2.x + r2.width && r1.x + r1.width > r2.x && r1.y < r2.y + r2.height && r1.height + r1.y > r2.y;
    }

    /**
     *
     * @param value Value to check
     * @param min inclusive min value
     * @param max inclusive max value
     * @returns true if value is in <min, max>
     */
    public static isBetween(value: number, min: number, max: number): boolean {
        return value >= min && value <= max;
    }

    public static distanceBetween(p1: { x: number; y: number }, p2: { x: number; y: number }, squared = true): number {
        const distance = Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2);
        return squared ? Math.sqrt(distance) : distance;
    }

    public static randomFromArray<T>(array: T[]): T {
        return array[Math.floor(Math.random() * array.length)];
    }

    public static nFormatter(num: number, digits: number) {
        const lookup = [
            { value: 1, symbol: "" },
            { value: 1e3, symbol: "k" },
            { value: 1e6, symbol: "M" },
            { value: 1e9, symbol: "G" },
            { value: 1e12, symbol: "T" },
        ];
        const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
        const item = lookup
            .slice()
            .reverse()
            .find(function (item) {
                return num >= item.value;
            });
        return item ? (num / item.value).toFixed(digits).replace(rx, "$1") + item.symbol : "0";
    }
}
