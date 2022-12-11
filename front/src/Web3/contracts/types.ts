export type NetworkContractConfig = {
    name: string;
    abi: string;
    [chainId: number]: string;
};

export type RenderedTokenType = {
    name: string;
    image: string;
    amount: number;
};

export type ERC20TokenListItem = {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    logoURI: string;
    type: string;
    asset?: string;
    chainId?: number;
};
