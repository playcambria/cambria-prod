import {
    Alchemy,
    TokenBalanceType,
    TokenBalancesOptionsErc20,
    TokenBalanceSuccess,
    TokenBalanceFailure,
    TokenMetadataResponse,
} from "alchemy-sdk";
import { BigNumber } from "ethers";

import LocalTokenMetadata from "../Web3/contracts/LocalTokenMetadata";

const zeroBN = BigNumber.from(0);

// Type Gaurd
function _isTokenBalanceSuccess(token: TokenBalanceSuccess | TokenBalanceFailure): token is TokenBalanceSuccess {
    return (token as TokenBalanceSuccess).tokenBalance !== null;
}

const _isGreaterThanZeroBalance = (token: TokenBalanceSuccess): boolean => {
    try {
        return BigNumber.from(token.tokenBalance).gt(zeroBN);
    } catch {
        return false;
    }
};

type TokenMetadata = TokenMetadataResponse;
export type AlchemyToken = TokenMetadata & TokenBalanceSuccess;

export class AlchemySDKClient {
    sdk: Alchemy;
    isBusy: boolean;
    // address mapping from token's contractAddress -> TokenMetadata
    cachedTokenMetadata: typeof LocalTokenMetadata;
    completeBalances: Map<string, Map<string, AlchemyToken>>;

    constructor(sdk: Alchemy) {
        this.sdk = sdk;
        this.isBusy = false;
        this.cachedTokenMetadata = LocalTokenMetadata;
        this.completeBalances = new Map<string, Map<string, AlchemyToken>>();
    }

    async updateBalancesByTokenAddress(address: string, tokenAddresses: string[]) {
        const tokensToUpdate = await this.sdk.core.getTokenBalances(address, tokenAddresses);
        const existingTokens = this.completeBalances.get(address);

        if (!existingTokens) {
            throw new Error(`Not yet initialized alchemy balances for ${address}`);
        }

        tokensToUpdate.tokenBalances.map((token) => {
            if (existingTokens.has(token.contractAddress) && token.tokenBalance) {
                // get the existing token
                const exisitngToken = existingTokens.get(token.contractAddress) as AlchemyToken;
                // only update the balance key in the token
                existingTokens.set(exisitngToken.contractAddress, {
                    ...exisitngToken,
                    tokenBalance: token.tokenBalance,
                });
            }
        });

        this.completeBalances.set(address, existingTokens);
        const updated = this.completeBalances.get(address) as Map<string, AlchemyToken>;
        return Array.from(updated.values());
    }

    async getERC20s(address: string) {
        this.isBusy = true;

        // Fetch all ERC20s owned by address
        const allBalances = await this._getAllTokenBalances(address);
        console.log("allBalances", allBalances);

        // Filter out errored tokens & 0 balance tokens
        // TODO: Handle errored (retry?)
        const filteredBalances = allBalances.filter(_isTokenBalanceSuccess).filter(_isGreaterThanZeroBalance);

        // fetch all metadata, uses cachedTokenMetadata if exists
        const completeTokens = await this._getAllMetadata(filteredBalances);
        console.log("complette tokens", completeTokens);

        // Store as an inventory map, so updates are quick.
        // Map of Map in object bc
        const tokenMap = new Map<string, AlchemyToken>();
        completeTokens.map((token) => tokenMap.set(token.contractAddress, token));
        this.completeBalances.set(address, tokenMap);

        this.isBusy = false;
        return completeTokens;
    }

    async _getAllTokenBalances(accountAddress: string) {
        const firstPage = await this.sdk.core.getTokenBalances(accountAddress, {
            type: TokenBalanceType.ERC20,
        } as TokenBalancesOptionsErc20);

        let allBalances = firstPage.tokenBalances;
        let priorPage = firstPage;
        // if there's a page key, going to need to make additional calls
        while (priorPage.pageKey) {
            const currentPage = await this.sdk.core.getTokenBalances(accountAddress, {
                type: TokenBalanceType.ERC20,
                pageKey: priorPage.pageKey,
            } as TokenBalancesOptionsErc20);
            // set current to prior page for pagekey check
            priorPage = currentPage;
            // extend balance results
            allBalances = [...allBalances, ...currentPage.tokenBalances];
        }

        return allBalances;
    }

    async _getAllMetadata(tokens: TokenBalanceSuccess[]): Promise<AlchemyToken[]> {
        const completeTokens: AlchemyToken[] = [];

        const promiseArray = tokens.map(async (token) => {
            if (this.cachedTokenMetadata.has(token.contractAddress)) {
                // checked for has, but map get returns undefined so typecast
                const metadata = this.cachedTokenMetadata.get(token.contractAddress) as TokenMetadata;
                completeTokens.push({ ...metadata, ...token });
            } else {
                // if not in cache, fetch, cache result, and create completed token
                const metadata = await this._fetchMetadataForToken(token.contractAddress);
                this.cachedTokenMetadata.set(token.contractAddress, metadata);
                completeTokens.push({ ...metadata, ...token });
            }
        });
        await Promise.all(promiseArray);
        return completeTokens;
    }

    async _fetchMetadataForToken(contractAddress: string) {
        const metadata = await this.sdk.core.getTokenMetadata(contractAddress);
        this.cachedTokenMetadata.set(contractAddress, metadata);
        return metadata;
    }
}
