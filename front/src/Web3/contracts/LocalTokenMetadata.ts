import { TokenMetadataResponse } from "alchemy-sdk";
import { ERC20TokenListItem } from "./types";

import MAINNET_ERC20_TOKENS from "./tokenlists/mainnet";
import MAINNET_ERC20_TOKENS_TRIMMED from "./tokenlists/mainnet_trimmed";
import GOERLI_ERC20_TOKENS from "./tokenlists/goerli";
import POLYGON_ERC20_TOKENS from "./tokenlists/polygon";
import MUMBAI_ERC20_TOKENS from "./tokenlists/mumbai";

type SupportedChainID = 1 | 5 | 137 | 80001;

const narrowChainToSupported = (chainId: number) => {
    if (chainId === 1) {
        return 1 as SupportedChainID;
    } else if (chainId === 5) {
        return 5 as SupportedChainID;
    } else if (chainId === 137) {
        return 137 as SupportedChainID;
    } else if (chainId === 80001) {
        return 80001 as SupportedChainID;
    } else {
        throw new Error(`${chainId} is not a SupportedChainId`);
    }
};

class LocalTokenMetadata {
    useTrimmed = true;
    chainId: SupportedChainID | undefined;
    addressMetadataMap = {
        1: this.useTrimmed
            ? this.buildSymbolMap(MAINNET_ERC20_TOKENS_TRIMMED)
            : this.buildSymbolMap(MAINNET_ERC20_TOKENS),
        5: this.buildSymbolMap(GOERLI_ERC20_TOKENS),
        137: this.buildSymbolMap(POLYGON_ERC20_TOKENS),
        80001: this.buildSymbolMap(MUMBAI_ERC20_TOKENS), // TODO
    };

    buildSymbolMap(tokenList: ERC20TokenListItem[]): Map<string, TokenMetadataResponse> {
        const map = new Map<string, TokenMetadataResponse>();
        tokenList.map((token) => {
            map.set(token.address, {
                name: token.name,
                symbol: token.symbol,
                decimals: token.decimals,
                logo: token.logoURI,
            } as TokenMetadataResponse);
        });
        return map;
    }

    setChainId(chainId: number) {
        this.chainId = narrowChainToSupported(chainId);
    }

    chainGuard(chainId: number | undefined): SupportedChainID {
        if (chainId) {
            // handle number input & check
            return narrowChainToSupported(chainId);
        } else if (this.chainId) {
            // if undefined, fallback to set chain
            return this.chainId;
        } else {
            throw new Error("No this.chainId set or chainId provided");
        }
    }

    has(address: string, _chainId?: number): boolean {
        const chainId = this.chainGuard(_chainId);
        return this.addressMetadataMap[chainId].has(address);
    }

    get(address: string, _chainId?: number): TokenMetadataResponse | null {
        const chainId = this.chainGuard(_chainId);

        if (this.addressMetadataMap[chainId].has(address)) {
            return this.addressMetadataMap[chainId].get(address) as TokenMetadataResponse;
        }
        return null;
    }

    set(address: string, tokenMetadata: TokenMetadataResponse, _chainId?: number): TokenMetadataResponse {
        const chainId = this.chainGuard(_chainId);
        if (!tokenMetadata.symbol) {
            throw new Error("Not token symbol key for provided metadata");
        }
        this.addressMetadataMap[chainId].set(address, tokenMetadata);
        return tokenMetadata;
    }
}

export default new LocalTokenMetadata();
