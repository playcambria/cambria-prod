import { BigNumber } from "ethers";

export type Token = {
    type: "ETH" | "ERC20";
    symbol: string;
    name: string;
    address: string;
    image: string;
    decimals: number;
    balance: BigNumber;
    originalBalance: BigNumber;
};

export function getKeyForToken(token: Token) {
    // TODO: add chainId
    return `token-${token.address.toLowerCase()}` as const;
}