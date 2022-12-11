import { ERC20TokenListItem } from "../types";

const MAINNET_ERC20_TOKENS: ERC20TokenListItem[] = [
    {
        chainId: 1,
        asset: "c60_t0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        type: "ERC20",
        address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        name: "USD Coin",
        symbol: "USDC",
        decimals: 6,
        logoURI:
            "https://assets-cdn.trustwallet.com/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png",
    },
    {
        chainId: 1,
        asset: "c60_t0xdAC17F958D2ee523a2206206994597C13D831ec7",
        type: "ERC20",
        address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        name: "Tether",
        symbol: "USDT",
        decimals: 6,
        logoURI:
            "https://assets-cdn.trustwallet.com/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png",
    },
    {
        chainId: 1,
        asset: "c60_t0x6B175474E89094C44Da98b954EedeAC495271d0F",
        type: "ERC20",
        address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
        name: "Dai",
        symbol: "DAI",
        decimals: 18,
        logoURI:
            "https://assets-cdn.trustwallet.com/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png",
    },
    {
        chainId: 1,
        asset: "c60_t0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
        type: "ERC20",
        address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
        name: "Uniswap",
        symbol: "UNI",
        decimals: 18,
        logoURI:
            "https://assets-cdn.trustwallet.com/blockchains/ethereum/assets/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/logo.png",
    },
    {
        chainId: 1,
        asset: "c60_t0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
        type: "ERC20",
        address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
        name: "Wrapped Bitcoin",
        symbol: "WBTC",
        decimals: 8,
        logoURI:
            "https://assets-cdn.trustwallet.com/blockchains/ethereum/assets/0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599/logo.png",
    },
];

export default MAINNET_ERC20_TOKENS;
