import { ethers } from "ethers";
import { SupportedChainId } from "../../Utils/Chains";
import { DEPLOY_CHAIN_MODE } from "../../Enum/EnvironmentVariable";

export function narrowChainIdType(_chainId: string | number): number {
    let chainId: number;
    // narrow type
    if (typeof _chainId === "string") {
        chainId = parseInt(_chainId);
    } else if (typeof _chainId === "number") {
        chainId = _chainId;
    } else {
        throw new TypeError("ChainID !== string | number");
    }
    return chainId;
}

type ChainDisplay = {
    full: string;
    simple: string;
};

export function chainIdToDisplayName(_chainId: string | number): ChainDisplay {
    const chainId = narrowChainIdType(_chainId);

    switch (chainId) {
        case SupportedChainId.MAINNET:
            return { full: "Ethereum Mainnet", simple: "Mainnet" };
        case SupportedChainId.GOERLI:
            return { full: "Ethereum Goerli", simple: "Testnet" };
        case SupportedChainId.POLYGON:
            return { full: "Polygon", simple: "Polygon" };
        case SupportedChainId.POLYGON_MUMBAI:
            return { full: "Polygon Mumbai", simple: "Polygon Testnet" };
        default:
            return { full: "Unsupported Chain", simple: "Unsupported" };
    }
}

export function isSupportedChainId(_chainId: string | number): boolean {
    const chainId = narrowChainIdType(_chainId);

    if (DEPLOY_CHAIN_MODE) {
        switch (chainId) {
            case SupportedChainId.MAINNET:
                return DEPLOY_CHAIN_MODE === "mainnet";
            case SupportedChainId.GOERLI:
                return DEPLOY_CHAIN_MODE === "testnet" || !DEPLOY_CHAIN_MODE;
            case SupportedChainId.POLYGON:
                return DEPLOY_CHAIN_MODE === "mainnet";
            case SupportedChainId.POLYGON_MUMBAI:
                return DEPLOY_CHAIN_MODE === "testnet" || !DEPLOY_CHAIN_MODE;
            default:
                return false;
        }
    } else {
        switch (chainId) {
            case SupportedChainId.MAINNET:
                return true;
            case SupportedChainId.GOERLI:
                return true;
            case SupportedChainId.POLYGON:
                return true;
            case SupportedChainId.POLYGON_MUMBAI:
                return true;
            default:
                return false;
        }
    }
}

export function chainIdAsHex(_chainId: string | number): string {
    return ethers.utils.hexValue(narrowChainIdType(_chainId));
}
