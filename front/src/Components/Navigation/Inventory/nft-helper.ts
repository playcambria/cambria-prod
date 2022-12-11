import { Nft as NftType } from "./types";

function isSpam(name: string) {
    if (
        name.includes("Alpha Blocks") ||
        name.includes("Diverse") ||
        name.includes("Combat") ||
        name.includes("Locked") ||
        name.includes("MoodFlip") ||
        name.includes("birdpunk") ||
        name.includes("Beautiful") ||
        name.includes("Exciting") ||
        name.includes("Dragonball") ||
        name.includes("Boxiverse") ||
        name.includes("Emma") ||
        name.includes("RiseLike") ||
        name.includes("RiseLike") ||
        name.includes("Secret Px") ||
        name.includes("Moondens")
    ) {
        return true;
    } else {
        return false;
    }
}

export function nftSorter(a: NftType, b: NftType) {
    const leftHasFloorPrice = a.collection?.floor_prices && a.collection.floor_prices.length > 0;
    const rightHasFloorPrice = b.collection?.floor_prices && b.collection.floor_prices.length > 0;
    if (leftHasFloorPrice && rightHasFloorPrice && b.collection.floor_prices && a.collection.floor_prices) {
        return b.collection.floor_prices[0].value - a.collection.floor_prices[0].value;
    } else {
        return leftHasFloorPrice ? -1 : 1;
    }
}

export function nftSpamSort(a: NftType, b: NftType) {
    if (isSpam(a.collection.name) && isSpam(b.collection.name)) {
        return 0;
    } else {
        return isSpam(b.collection.name) ? -1 : 1;
    }
}
