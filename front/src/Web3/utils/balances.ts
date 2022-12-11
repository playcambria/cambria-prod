import { BigNumber } from "ethers";
import { formatEther, formatUnits } from "ethers/lib/utils";

export function formatBalance(balance: BigNumber, contractDecimals?: number, displayDecimals = 3): string {
    // Respect contract decimals, eg. USDC only has 6 decimals, causes issues if using default 18!
    let asString: string;
    if (contractDecimals) {
        asString = formatUnits(balance, contractDecimals);
    } else {
        asString = formatEther(balance);
    }
    const [i, d] = asString.split(".");
    return `${i}.${d.substring(0, displayDecimals)}`;
}

export function getBalancePrecision(symbol: string): number {
    switch (symbol) {
        case 'ETH':
        case 'WETH':
            return 3;
        case 'USDC':
        case 'USDT':
        case 'DAI':
        case 'UNI':
            return 2;
        case 'WBTC':
            return 4;
        default:
            return 0;
    }
}