/* eslint-disable @typescript-eslint/no-explicit-any */
import Web3Modal from "web3modal";
import { BigNumber } from "ethers";

import { providerOptions } from "./config";
import { chainId, defaultEvmStores } from "svelte-ethers-store";

import { SupportedChainId } from "../Utils/Chains";
import { chainIdAsHex, narrowChainIdType, isSupportedChainId } from "./utils/chain";
import { isAddress } from "./utils/address";

import { gameManager } from "../Phaser/Game/GameManager";

import { registerContracts } from "./contracts/register";
import { DEPLOY_CHAIN_MODE } from "../Enum/EnvironmentVariable";

export const preferredChain = DEPLOY_CHAIN_MODE === "mainnet" ? SupportedChainId.MAINNET : SupportedChainId.GOERLI;
const web3modalNetwork = DEPLOY_CHAIN_MODE === "mainnet" ? "mainnet" : "goerli";

export const web3Modal = new Web3Modal({
    network: web3modalNetwork, // optional
    cacheProvider: true, // optional
    providerOptions, // required
    theme: "dark",
});

export async function switchToNetwork(chainId: number) {
    await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: chainIdAsHex(chainId) }],
    });
}

export async function tryRehydrateWeb3() {
    if (web3Modal.cachedProvider) {
        await initWeb3();
    }
}

export async function initWeb3(): Promise<void> {
    // 1. Get provider from web3modal and set for svelte store
    const modalProvider = await web3Modal.connect();
    await defaultEvmStores.setProvider(modalProvider); //internally made an ethers provider

    // 2. Attach contracts to evm
    chainId.subscribe((_chainId) => {
        if (_chainId) {
            const _chainIdNumber = narrowChainIdType(_chainId);
            registerContracts(_chainIdNumber, defaultEvmStores)
                .then(() => {})
                .catch((e) => {
                    console.error(`Failed registering contracts for ${_chainIdNumber}: ${e}`);
                });
        }
    });

    // 3. Register event handlers from provider
    //    Working: "accountsChanged", "chainChanged"
    //    Broken : "connect", "disconnect", at least for injected metamask
    modalProvider.on("chainChanged", (_chainId: number) => {
        // _chainId passed in as hex
        const chainId = BigNumber.from(_chainId).toNumber();
        if (!isSupportedChainId(chainId)) {
            window.location.reload();
        }
    });

    modalProvider.on("accountsChanged", (accounts: string[]) => {
        // if no accounts, then equivalent to disconnect
        console.log("acounts changed", accounts);
        if (accounts.length === 0) {
            window.localStorage.clear();
            window.location.reload();
        }
        // otherwise check if the current accounts array
        // includes the already connected user.
        else {
            // TODO: Needs improved user account to work properly
            const currentPlayer = gameManager.getPlayerName();

            // This shouldn't occur if they game is already running
            // TODO: Check status on login flow
            if (currentPlayer === null) {
                window.localStorage.clear();
                window.location.reload();
                alert("Current player not found");
            }
            // There's a new account connected
            // - so check if the player's wallet is still connected
            // - if its not there's an issue
            else {
                let matchesCurrentPlayer: boolean;
                if (isAddress(currentPlayer)) {
                    console.log("is address", currentPlayer);
                    matchesCurrentPlayer = accounts.includes(currentPlayer);
                } else {
                    console.log("is not address", currentPlayer);
                    // because currently user is stored as trimmed account
                    const currentLastFour = currentPlayer.split(".")[2].toUpperCase();

                    // check if current player is connected still
                    matchesCurrentPlayer = accounts.some((acc) => {
                        const newLastFour = acc.substring(acc.length - 4).toUpperCase();
                        if (newLastFour === currentLastFour) {
                            return true;
                        }
                        return false;
                    });
                }

                if (!matchesCurrentPlayer) {
                    window.localStorage.clear();
                    window.location.reload();
                }
            }
        }
    });
}
