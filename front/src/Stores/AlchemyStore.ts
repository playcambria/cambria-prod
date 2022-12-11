import { derived, Readable, writable } from "svelte/store";
import { signer, chainId, defaultEvmStores } from "svelte-ethers-store";
import { BigNumber, ethers } from "ethers";

import { Network, Alchemy } from "alchemy-sdk";

import {
    ALCHEMY_API_KEY_GOERLI,
    ALCHEMY_API_KEY_MAINNET,
    ALCHEMY_API_KEY_MUMBAI,
    ALCHEMY_API_KEY_POLYGON,
} from "../Enum/EnvironmentVariable";

import { narrowChainIdType } from "../Web3";
import { SupportedChainId } from "../Utils/Chains";

export const alchemyProviderStore: Readable<ethers.providers.AlchemyProvider> = derived(
    [signer, chainId],
    ([$signer, $chainId], set) => {
        if ($signer && $chainId) {
            const chainIdNumber = narrowChainIdType($chainId);
            switch (chainIdNumber) {
                case SupportedChainId.MAINNET:
                    set(new ethers.providers.AlchemyProvider(SupportedChainId.MAINNET, ALCHEMY_API_KEY_MAINNET));
                    break;
                case SupportedChainId.GOERLI:
                    set(new ethers.providers.AlchemyProvider(SupportedChainId.GOERLI, ALCHEMY_API_KEY_GOERLI));
                    break;
                case SupportedChainId.POLYGON:
                    set(new ethers.providers.AlchemyProvider(SupportedChainId.POLYGON, ALCHEMY_API_KEY_POLYGON));
                    break;
                case SupportedChainId.POLYGON_MUMBAI:
                    set(new ethers.providers.AlchemyProvider(SupportedChainId.POLYGON_MUMBAI, ALCHEMY_API_KEY_MUMBAI));
                    break;
                default:
                    throw new Error("Unsupported Alchemy Chain or API Key");
            }
        }
    }
);

import { AlchemySDKClient, AlchemyToken } from "../Services/AlchemySDK";

export const alchemySDKStore: Readable<AlchemySDKClient> = derived([signer, chainId], ([$signer, $chainId], set) => {
    if ($signer && $chainId) {
        const chainIdNumber = narrowChainIdType($chainId);
        switch (chainIdNumber) {
            case SupportedChainId.MAINNET:
                set(
                    new AlchemySDKClient(new Alchemy({ network: Network.ETH_MAINNET, apiKey: ALCHEMY_API_KEY_MAINNET }))
                );
                break;
            case SupportedChainId.GOERLI:
                set(new AlchemySDKClient(new Alchemy({ network: Network.ETH_GOERLI, apiKey: ALCHEMY_API_KEY_GOERLI })));
                break;

            case SupportedChainId.POLYGON:
                set(
                    new AlchemySDKClient(
                        new Alchemy({ network: Network.MATIC_MAINNET, apiKey: ALCHEMY_API_KEY_POLYGON })
                    )
                );
                break;
            case SupportedChainId.POLYGON_MUMBAI:
                set(
                    new AlchemySDKClient(new Alchemy({ network: Network.MATIC_MUMBAI, apiKey: ALCHEMY_API_KEY_MUMBAI }))
                );
                break;
            default:
                throw new Error("Unsupported Alchemy Chain or API Key");
        }
    }
});

import { ERC20 } from "../Web3/contracts/standards";
const ERC20Abi = JSON.stringify(ERC20);

// import { Erc20 } from "../";
import { tokenMapStore } from "./InventoryStore";
import { Token } from "./InventoryTokens";
import defaultToken from "/resources/icons/default_token.svg";
import { getTokenLogo } from "./InventoryTokens";
//import { addBlockHook, OnBlockHook } from "./BlockStore";
import ethToken from "/resources/tokens/eth.svg";
import maticToken from "/resources/tokens/matic.svg";
import { Erc20 } from "../Web3/typechain";
import { addBlockHook, OnBlockHook } from "./BlockStore";

/**
 * [Data State] lastInventoryUpdateMs: Track datetime of last update for Inventory contents. Update this to trigger a re-pull of data
 */
export const lastInventoryTokenUpdateMs = writable<number>(Date.now());

export const alchemyTokensStore: Readable<AlchemyToken[]> = derived(
    [alchemySDKStore, signer, lastInventoryTokenUpdateMs],
    ([$alchemySDKStore, $signer, lastInventoryTokenUpdateMs], set) => {
        if (!$alchemySDKStore || !$signer) return set([] as AlchemyToken[]);
        // This runs on initial load, but warning, with hot-reload will run again!
        // - though the metadata calls are cached, so shouldn't hit 429 too many request errors
        // eslint-disable-next-line @typescript-eslint/no-floating-promises, @typescript-eslint/require-await
        (async () => {
            const signerAddress = await $signer.getAddress();
            const ethBal = await $signer.getBalance();
            console.log("signerAddress", signerAddress);
            console.log("ethBal", ethers.utils.formatEther(ethBal));
            $alchemySDKStore
                .getERC20s(signerAddress)
                .then((tokens) => {
                    // set initial ETH in MapStore
                    console.log("$alchemySDKStore.sdk.config.network", $alchemySDKStore.sdk.config.network);
                    if ($alchemySDKStore.sdk.config.network.includes("eth")) {
                        tokenMapStore.set("ETH", {
                            type: "ETH",
                            symbol: "ETH",
                            name: "Ethereum",
                            address: "",
                            image: ethToken,
                            decimals: 18,
                            balance: ethBal,
                            originalBalance: ethBal,
                        });
                    } else if ($alchemySDKStore.sdk.config.network.includes("polygon")) {
                        tokenMapStore.set("MATIC", {
                            type: "ETH",
                            symbol: "MATIC",
                            name: "MATIC",
                            address: "",
                            image: maticToken,
                            decimals: 18,
                            balance: ethBal,
                            originalBalance: ethBal,
                        });
                    }

                    // Add to souce wallet mapping
                    tokens.map((token) => {
                        if (token.symbol) {
                            //console.log("token.contractAddress", token.contractAddress);
                            const logo = token.logo ? token.logo : defaultToken;
                            tokenMapStore.set(token.contractAddress, {
                                type: "ERC20",
                                symbol: token.symbol,
                                name: token.name,
                                address: token.contractAddress,
                                image: getTokenLogo(token.symbol, logo),
                                decimals: token.decimals ? token.decimals : undefined,
                                balance: token.tokenBalance ? BigNumber.from(token.tokenBalance) : undefined,
                                originalBalance: token.tokenBalance ? BigNumber.from(token.tokenBalance) : undefined,
                            } as Token);

                            const updateTokenBalance: OnBlockHook = {
                                context: {
                                    name: token.symbol,
                                    store: tokenMapStore,
                                },
                                fn: async function (
                                    $signer: ethers.Signer,
                                    $contracts: Record<string, ethers.Contract>
                                ) {
                                    const signerAddress = await $signer.getAddress();
                                    const TokenContract = $contracts[this.context.name] as Erc20;
                                    try {
                                        const balance = await TokenContract.balanceOf(signerAddress);
                                        const token = tokenMapStore.get(this.context.name);
                                        if (token) {
                                            tokenMapStore.set(this.context.name, { ...token, balance });
                                        }
                                        // newERC20.setBalance(balance);
                                    } catch (e) {
                                        console.log("error getting balance for", this.context.name, e);
                                    }
                                },
                            };
                            addBlockHook(updateTokenBalance);
                        }
                    });

                    // Take all ERC20 Tokens and attach contracts, so they are available in
                    // the inventory store to be connected in buildERC20s.
                    // - WETH is excempt because of its alternate ABI w/ swap/unswap
                    const filteredTokens = tokens.filter((token) => token.symbol !== "WETH");
                    filteredTokens.map(async (token) => {
                        if (token.symbol) {
                            await defaultEvmStores.attachContract(token.symbol, token.contractAddress, ERC20Abi);
                        }
                    });
                    set(filteredTokens);
                })
                .catch((e) => {
                    console.log("Error fetching Alchemy token balances", e);
                });
        })();
        // - - - - - - - - - - - - - - - - - - - - - - -
        // May be useful later, but currently the hook update on-block should satisfy
        // the current use for this code.
        // - - - - - - - - - - - - - - - - - - - - - - -
        // if ($alchemySDKStore && isAddress($signerAddress)) {
        //     if ($alchemyIsInitial) {
        //         $alchemySDKStore
        //             .getERC20s($signerAddress)
        //             .then((tokens) => {
        //                 set(tokens);
        //             })
        //             .catch((e) => {
        //                 console.log("Error fetching Alchemy token balances", e);
        //             });
        //     } else if ($alchemyTokenReloadAddresses.length > 0) {
        //         const tokensToUpdate = $alchemyTokenReloadAddresses;
        //         console.log("updating tokens", tokensToUpdate);
        //         updateBalancesForTokenAddress.set([]);
        //         $alchemySDKStore
        //             .updateBalancesByTokenAddress($signerAddress, tokensToUpdate)
        //             .then((tokens) => {
        //                 set(tokens);
        //             })
        //             .catch((e) => {
        //                 console.log("Error fetching Alchemy token balances", e);
        //             });
        //     }
        // }
        // - - - - - - - - - - - - - - - - - - - - - - -
    },
    [] as AlchemyToken[]
);
