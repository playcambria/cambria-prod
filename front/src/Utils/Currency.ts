import { BigNumber } from "@ethersproject/bignumber";
import { formatUnits } from "@ethersproject/units";
import { SupportedChainId } from "./Chains";

export type Erc20PayableCurrency = "USDC" | "uUSDC" | "DAI" | "WETH";
export type PayableCurrency = "ETH" | Erc20PayableCurrency;

import daiIcon from "/resources/currency/dai.svg";
import ethIcon from "/resources/currency/eth.png";
import usdcIcon from "/resources/currency/usdc.svg";

export function allErc20PayableCurrencies(chainId: number): Erc20PayableCurrency[] {
    switch (chainId) {
        case SupportedChainId.MAINNET: {
            return ["USDC", "DAI", "WETH"];
        }
        case SupportedChainId.GOERLI: {
            return ["USDC", "uUSDC", "DAI", "WETH"];
        }
        default: {
            throw new Error(`Chain ID ${chainId} is not supported`);
        }
    }
}

export const decimalsByCurrency: Record<PayableCurrency, number> = {
    ETH: 18,
    DAI: 18,
    USDC: 6,
    uUSDC: 6,
    WETH: 18,
};

type ApiEthCurrency = {
    type: "ETH";
};

type ApiErc20Currency = {
    type: "ERC20";
    symbol: Erc20PayableCurrency;
};

export type ApiCurrency = ApiEthCurrency | ApiErc20Currency;

export function parseApiCurrency(currency: ApiCurrency): PayableCurrency {
    if (currency.type === "ERC20") {
        return currency.symbol;
    } else {
        return "ETH";
    }
}

export function toApiCurrency(currency: PayableCurrency): ApiCurrency {
    switch (currency) {
        case "ETH":
            return { type: "ETH" };
        case "USDC":
        case "uUSDC":
        case "DAI":
        case "WETH":
            return { type: "ERC20", symbol: currency };
    }
}

export function formatApiCurrency(amount: string, apiCurrency: ApiCurrency): string {
    return formatCurrency(BigNumber.from(amount), parseApiCurrency(apiCurrency));
}

export function formatCurrency(amount: BigNumber, currency: PayableCurrency): string {
    const decimals = decimalsByCurrency[currency];
    const formattedAmount = trimDecimals(formatUnits(amount, decimals), 3);
    return `${formattedAmount} ${currency}`;
}

function trimDecimals(num: string, maxDecimals: number): string {
    const decimalPointIndex = num.indexOf(".");
    if (decimalPointIndex === -1) {
        return num;
    }

    return num.slice(0, decimalPointIndex + 1 + maxDecimals);
}

export type CurrencyDetails = {
    fullName: string;
    shortName: string;
    icon: string;
};

// available options for currency dropdown
export const allCurrencyDetails: Record<PayableCurrency, CurrencyDetails> = {
    USDC: {
        fullName: "USD Coin",
        shortName: "USDC",
        icon: usdcIcon,
    },
    uUSDC: {
        // Goerli-only
        fullName: "USD Coin on Uniswap",
        shortName: "USDC",
        icon: usdcIcon,
    },
    ETH: {
        fullName: "Ethereum",
        shortName: "ETH",
        icon: ethIcon,
    },
    WETH: {
        fullName: "Wrapped Ethereum",
        shortName: "WETH",
        icon: ethIcon,
    },
    DAI: {
        fullName: "MakerDAO Dai",
        shortName: "DAI",
        icon: daiIcon,
    },
};
