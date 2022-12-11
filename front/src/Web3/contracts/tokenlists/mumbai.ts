/**
 * Modified from TrustWallet's token list:
 * https://github.com/trustwallet/assets/tree/master/blockchains/polygon
 */

import { ERC20TokenListItem } from "../types";

const MUMBAI_ERC20_TOKENS: ERC20TokenListItem[] = [
    {
        type: "POLYGON",
        address: "0x2d7882beDcbfDDce29Ba99965dd3cdF7fcB10A1e",
        name: "Test Token",
        symbol: "TST",
        decimals: 18,
        logoURI: "",
    },
    {
        type: "POLYGON",
        address: "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889",
        name: "Wrapped MATIC",
        symbol: "WMATIC",
        decimals: 18,
        logoURI:
            "https://assets-cdn.trustwallet.com/blockchains/polygon/assets/0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270/logo.png",
    },
    {
        type: "POLYGON",
        address: "0x326C977E6efc84E512bB9C30f76E30c160eD06FB",
        name: "ChainLink Token",
        symbol: "LINK",
        decimals: 18,
        logoURI:
            "https://assets-cdn.trustwallet.com/blockchains/polygon/assets/0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39/logo.png",
    },
];

export default MUMBAI_ERC20_TOKENS;
