import { getKeyForNft, Nft as NftType } from "../Navigation/Inventory/types";
import { getKeyForToken, Token as TokenType } from "../../Stores/InventoryTokens/Token";

export function isNftType(x: NftType | TokenType): x is NftType {
    return (x as NftType).nft_id !== undefined;
}

export function isTokenType(x: NftType | TokenType): x is TokenType {
    return (x as TokenType).address !== undefined;
}

export function getKeyForItem(item: NftType | TokenType): string {
    return isTokenType(item) ? getKeyForToken(item) : getKeyForNft(item);
}
