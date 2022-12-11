/**
 * Modified from TrustWallet's token list:
 * https://github.com/trustwallet/assets/tree/master/blockchains/polygon
 */

import { ERC20TokenListItem } from "../types";

const POLYGON_ERC20_TOKENS: ERC20TokenListItem[] = [
    {
        asset: "c966_t0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
        type: "POLYGON",
        address: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
        name: "Wrapped Ether",
        symbol: "WETH",
        decimals: 18,
        logoURI:
            "https://assets-cdn.trustwallet.com/blockchains/polygon/assets/0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619/logo.png",
    },
    {
        asset: "c966_t0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
        type: "POLYGON",
        address: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
        name: "Wrapped MATIC",
        symbol: "WMATIC",
        decimals: 18,
        logoURI:
            "https://assets-cdn.trustwallet.com/blockchains/polygon/assets/0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270/logo.png",
    },
    {
        asset: "c966_t0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
        type: "POLYGON",
        address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
        name: "USD Coin (PoS)",
        symbol: "USDC",
        decimals: 6,
        logoURI:
            "https://assets-cdn.trustwallet.com/blockchains/polygon/assets/0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174/logo.png",
    },
    {
        asset: "c966_t0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
        type: "POLYGON",
        address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
        name: "(PoS) Tether USD",
        symbol: "USDT",
        decimals: 6,
        logoURI:
            "https://assets-cdn.trustwallet.com/blockchains/polygon/assets/0xc2132D05D31c914a87C6611C10748AEb04B58e8F/logo.png",
    },
    {
        asset: "c966_t0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
        type: "POLYGON",
        address: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
        name: "(PoS) Dai Stablecoin",
        symbol: "DAI",
        decimals: 18,
        logoURI:
            "https://assets-cdn.trustwallet.com/blockchains/polygon/assets/0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063/logo.png",
    },
    {
        asset: "c966_t0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39",
        type: "POLYGON",
        address: "0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39",
        name: "ChainLink Token",
        symbol: "LINK",
        decimals: 18,
        logoURI:
            "https://assets-cdn.trustwallet.com/blockchains/polygon/assets/0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39/logo.png",
    },
    {
        asset: "c966_t0x831753DD7087CaC61aB5644b308642cc1c33Dc13",
        type: "POLYGON",
        address: "0x831753DD7087CaC61aB5644b308642cc1c33Dc13",
        name: "QuickSwap",
        symbol: "QUICK",
        decimals: 18,
        logoURI:
            "https://assets-cdn.trustwallet.com/blockchains/polygon/assets/0x831753DD7087CaC61aB5644b308642cc1c33Dc13/logo.png",
    },
    {
        asset: "c966_t0xD6DF932A45C0f255f85145f286eA0b292B21C90B",
        type: "POLYGON",
        address: "0xD6DF932A45C0f255f85145f286eA0b292B21C90B",
        name: "Aave (PoS)",
        symbol: "AAVE",
        decimals: 18,
        logoURI:
            "https://assets-cdn.trustwallet.com/blockchains/polygon/assets/0xD6DF932A45C0f255f85145f286eA0b292B21C90B/logo.png",
    },
];

export default POLYGON_ERC20_TOKENS;
