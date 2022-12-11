import { writable, get } from "svelte/store";
import { SignedOrder, NftSwap, Order, SwappableAsset } from "@traderxyz/nft-swap-sdk";
import { Nft, getKeyForNft } from "../Components/Navigation/Inventory/types";
import { gameManager } from "../Phaser/Game/GameManager";
import { RemotePlayer } from "../Phaser/Entity/RemotePlayer";
import { chatMessagesStore } from "./ChatStore";
import { BigNumber } from "ethers";
import { Token, getKeyForToken } from "../Stores/InventoryTokens/Token";
import { getKeyForItem, isNftType, isTokenType } from "../Components/Trade/utils";
import { chainId, signer, provider, signerAddress } from "svelte-ethers-store";
import { narrowChainIdType } from "../Web3/index";
import { immerStore } from "svelte-immer-store";
import { Web3Provider } from "@ethersproject/providers";

type TradeRole = "target" | "initiator";
type TradeStatus =
    | { type: "negotiating" }
    | { type: "lockedIn"; orderHash: string }
    | { type: "signedOrder"; signedOrder: SignedOrder };

export interface Trade {
    counterparty: RemotePlayer; // { ..., walletAddress, userId, name }
    role: TradeRole;
    status: TradeStatus;
    meConfirmed: boolean;
    counterpartConfirmed: boolean;
    myTradeOffer: Array<Nft | Token>;
    counterpartyOffer: Array<Nft | Token>;
    signedOrder: SignedOrder | undefined;
    orderFilled: boolean;
    nftSwap: NftSwap;
    requiredApprovals?: Map<string, boolean>;
    myAddress: string;
    isApproving: boolean;
}

export const TRADE_EXPIRATION_SECONDS = 600;

// Array of User Ids that we have received a Trade Request from
export const tradeRequestStore = writable<number[]>([]); // TODO: invalidate these after a while (or post completion of a trade?)

// Array of User Id's that we have sent a Trade Request to
export const outgoingRequestStore = writable<number[]>([]); // TODO: invalidate these after a while (or post completion of a trade?)

// Array of User Id's that we need to withdraw a Trade Request from
export const outgoingRequestWithdrawStore = writable<number[]>([]);

// Used to prompt emitTradeRequestAcceptanceEvent with userId of target for request acceptance message
export const sendRequestAcceptanceStore = writable<number>(0);

export const remainingTimeToApprove = writable<number>(0);

export const remainingTimeToFillOrder = writable<number>(0);

export const showTradeScreen = writable<boolean>(false);

type SwappableAssetType = `ERC${20 | 721 | 1155}`;
export function itemToSwapItem(item: Nft | Token): SwappableAsset {
    // Map our item types (Nft | Token) to SwappableAsset in traderswap
    if (isNftType(item)) {
        return {
            type: item.type as SwappableAssetType,
            amount: item.balance.toString(),
            tokenAddress: item.contractAddress || "",
            tokenId: item.tokenId || "1",
        };
    } else {
        // TODO: check if isTokenType
        return {
            type: "ERC20" as SwappableAssetType,
            amount: item.balance.toString(),
            tokenAddress: item.address,
            tokenId: "1",
        };
    }
}

export interface OrderParticipant {
    address: string;
    items: Array<Nft | Token>;
}

export function buildOrder(
    swap: NftSwap,
    participants: [OrderParticipant, OrderParticipant],
    expiryTime: Date,
    fakeSalt: string
): Order {
    const maker = participants[0];
    const taker = participants[1];

    const builtOrder = swap.buildOrder(
        maker.items.map(itemToSwapItem),
        taker.items.map(itemToSwapItem),
        maker.address,
        {
            takerAddress: taker.address,
            salt: fakeSalt,
            expiration: expiryTime,
        }
    );
    return builtOrder;
}

function createActiveTradeStore() {
    // eslint-disable-next-line
    const { subscribe, set, update, select } = immerStore<Trade | null>(null);

    let remainingTimeToApproveTimer: NodeJS.Timer | null = null;
    let remainingTimeToFillOrderTimer: NodeJS.Timer | null = null;

    function reset() {
        clearRemainingTimeToApproveTimer();
        clearRemainingTimeToFillOrderTimer();
        const gameScene = gameManager.getCurrentGameScene();
        gameScene.playSound('menu-cancel')
        set(null);
        showTradeScreen.set(false);
        // TODO: update inventory nonce 
    }

    function restartRemainingTimeToApproveTimer() {
        clearRemainingTimeToApproveTimer();
        remainingTimeToApproveTimer = setInterval(remainingTimeToApproveCountdown, 1000);
    }

    function restartRemainingTimeToFillOrderTimer() {
        clearRemainingTimeToFillOrderTimer();
        remainingTimeToFillOrderTimer = setInterval(remainingTimeToFillOrderCountdown, 1000);
    }

    function checkHasActiveTrade() {
        const currentTrade = get(activeTradeStore);
        if (currentTrade) {
            console.log(`Already in active trade with ${currentTrade.counterparty.userId}.`);
        }
        return !!currentTrade;
    }

    function remainingTimeToApproveCountdown() {
        const tradeAtTheMoment = get(activeTradeStore); // May be different then currentTrade since it is accessed later periodically

        if (!tradeAtTheMoment) {
            console.log("No active trade found.");
            return clearRemainingTimeToApproveTimer();
        }

        if (get(remainingTimeToApprove) <= 0) {
            // If remaining time is 0, clear timer
            clearRemainingTimeToApproveTimer();
        } else {
            // If remaining time is not 0, decrease remainingTimeToConfirm by 1
            remainingTimeToApprove.update((time) => time - 1);
        }
    }

    function remainingTimeToFillOrderCountdown() {
        const tradeAtTheMoment = get(activeTradeStore); // May be different then currentTrade since it is accessed later periodically

        if (!tradeAtTheMoment) {
            console.log("No active trade found.");
            return clearRemainingTimeToFillOrderTimer();
        }

        if (get(remainingTimeToFillOrder) <= 0) {
            // If remaining time is 0, clear timer
            declineActiveTrade();
            clearRemainingTimeToFillOrderTimer();
        } else {
            // If remaining time is not 0, decrease remainingTimeToConfirm by 1
            remainingTimeToFillOrder.update((time) => time - 1);
        }
    }

    function clearRemainingTimeToApproveTimer() {
        if (remainingTimeToApproveTimer) {
            clearInterval(remainingTimeToApproveTimer);
            remainingTimeToApproveTimer = null;
        }
    }

    function clearRemainingTimeToFillOrderTimer() {
        if (remainingTimeToFillOrderTimer) {
            clearInterval(remainingTimeToFillOrderTimer);
            remainingTimeToFillOrderTimer = null;
        }
    }

    function resetRemainingTimeToApproveTimer() {
        remainingTimeToApprove.set(3);
    }

    function resetRemainingTimeToFillOrderTimer() {
        remainingTimeToFillOrder.set(TRADE_EXPIRATION_SECONDS);
    }

    function declineActiveTrade() {
        // Actively decline a trade and message counterparty notifying them of this
        const currentTrade = get(activeTradeStore);
        if (currentTrade) {
            const gameScene = gameManager.getCurrentGameScene();
            gameScene.declineTrade(currentTrade.counterparty.userId);
            return reset();
        }
    }

    return {
        subscribe,
        restartRemainingTimeToApproveTimer,
        restartRemainingTimeToFillOrderTimer,
        declineActiveTrade,
        sendTradeRequest(target: number): void {
            // If already in active trade do not send new request
            if (checkHasActiveTrade()) {
                console.log("Can not start another trade");
                return;
            }
            // First, check if this player has already sent us a trade request.  If so, auto-route to initializeTrade
            if (get(tradeRequestStore).includes(target)) {
                console.log(
                    "We already have a request from this player. Instead of creating a new request, accept the existing one."
                );

                // Accept the existing trade request
                this.sendTradeRequestAcceptance(target);
            } else {
                // Add target userId to outgoingRequestStore if doesn't exist
                outgoingRequestStore.update((requests) => {
                    const _exists = requests.indexOf(target) !== -1;
                    if (_exists) {
                        return requests;
                    } else {
                        return [...requests, target];
                    }
                });
                const gameScene = gameManager.getCurrentGameScene();
                gameScene.requestTrade(target);
                gameScene.moveToRemotePlayer(target, false); // walk up to the player we are requesting a trade from
            }
        },
        sendTradeRequestAcceptance(target: number): void {
            console.log("SENDING TRADE ACCEPTANCE TO TARGET", target);
            // If already in active trade can not accept another trade request
            if (checkHasActiveTrade()) {
                console.log("Can not accept another trade while there is an active one");
                return;
            }
            // Check if request is still on tradeRequestStore, ignore otherwise
            if (!get(tradeRequestStore).includes(target)) {
                chatMessagesStore.addTradeExpiredMessage("[Trade] Request is expired or player is busy at the moment.");
                console.log("This request has already expired.");
                return;
            }

            // Updating this will trigger subscriber in GameScene to emitTradeRequestAcceptanceEvent(target)
            sendRequestAcceptanceStore.set(target);

            // Remove request from trade store
            tradeRequestStore.update((requests) => {
                return requests.filter((request) => request !== target);
            });

            // Initialize the trade on our end as well
            this.initializeTrade("target", target);

            // Broadcast withdraw on all of our outgoing requests
            this.sendTradeRequestWithdraw();
        },
        handleTradeRequest(initiator: number): void {
            console.log("handle trade request");
            // Add to tradeRequest[] if doesn't exist
            const gameScene = gameManager.getCurrentGameScene();
            gameScene.playSound('menu-alert');
            tradeRequestStore.update((requests) => {
                const _exists = requests.indexOf(initiator) !== -1;
                if (_exists) {
                    return requests;
                } else {
                    return [...requests, initiator];
                }
            });
        },
        handleTradeRequestAcceptance(initiator: number): void {
            // Check if outgoingRequestStore contains id of player that is sending us an acceptance - aka, we've already requested a trade from them
            if (get(outgoingRequestStore).includes(initiator)) {
                // Remove request from outgoing trade store
                outgoingRequestStore.update((requests) => {
                    return requests.filter((request) => request !== initiator);
                });

                // Initialize the trade
                this.initializeTrade("initiator", initiator);

                // Broadcast withdraw on all of our outgoing requests
                this.sendTradeRequestWithdraw();
            } else {
                console.error("Received an orphaned trade acceptance message?");
            }
        },
        sendTradeRequestWithdraw(): void {
            const outgoing: number[] = get(outgoingRequestStore);
            outgoingRequestStore.set([]); // Clear out outgoing requests on our end
            outgoingRequestWithdrawStore.set(outgoing); // Push outgoing requests to store to broadcast out to original recipients
        },
        handleTradeRequestWithdraw(initiator: number): void {
            // Clear initiator's request from our list of incoming requests (invalidate)
            const incomingRequests = get(tradeRequestStore);
            if (incomingRequests.includes(initiator)) {
                tradeRequestStore.update((t) => {
                    console.log("Invalidating request from", initiator);
                    const updated = t;
                    updated.splice(incomingRequests.indexOf(initiator), 1);
                    return updated;
                });
            }
        },
        initializeTrade(role: TradeRole, counterparty: number): void {
            // Assumptions: both parties have expressed interest in a trade at this point
            const gameScene = gameManager.getCurrentGameScene();
            const counterpartyPlayer = gameScene.MapPlayersByKey.get(counterparty);
            if (!counterpartyPlayer) {
                console.error("Unable to init trade - counterparty is undefined");
                return reset();
            }

            const ethersProvider = get(provider) as Web3Provider;
            const ethersSigner = get(signer);
            const ethersChainId = get(chainId);
            const myAddress = get(signerAddress);

            console.log("INITIALIZING TRADERSWAP:", ethersProvider, ethersSigner, ethersChainId, myAddress);

            const activeTrade: Trade = {
                counterparty: counterpartyPlayer,
                role,
                status: { type: "negotiating" },
                meConfirmed: false,
                counterpartConfirmed: false,
                myTradeOffer: [],
                counterpartyOffer: [],
                signedOrder: undefined,
                orderFilled: false,
                nftSwap: new NftSwap(ethersProvider, ethersProvider.getSigner(), narrowChainIdType(ethersChainId)),
                requiredApprovals: new Map(),
                isApproving: false,
                myAddress,
            };
            console.log(`Creating a new trade.  I am the ${role} and my counterparty is ${counterparty}`);
            console.log("NFTSWAP INIT", ethersProvider, ethersSigner, narrowChainIdType(ethersChainId));
            console.log("ActiveTrade:", activeTrade);
            set(activeTrade);
            gameScene.playSound('menu-popup');
            showTradeScreen.set(true);
        },
        handleDeclineActiveTrade() {
            // Handle a decline trade message from counterparty
            return reset();
        },
        updateRequiredApprovals() {
            const gameScene = gameManager.getCurrentGameScene();
            // Called on advancing to trade finalization screen, to grab the token approval status of each item in the offer
            const currentTrade = get(activeTradeStore);
            if (currentTrade) {
                const needToFetchApprovalStatus = currentTrade.myTradeOffer
                    .map((item) => {
                        return {
                            item,
                            tokenKey: getKeyForItem(item),
                        };
                    })
                    .filter(({ tokenKey }) => !currentTrade.requiredApprovals?.get(tokenKey));

                const approvalFetchPromises: Map<string, boolean | Promise<boolean>> = new Map();

                for (const { item, tokenKey } of needToFetchApprovalStatus) {
                    const approvalStatusPromise = currentTrade.nftSwap
                        .loadApprovalStatus(itemToSwapItem(item), currentTrade.myAddress)
                        .then((status) => {
                            return status.tokenIdApproved || status.contractApproved;
                        });
                    approvalFetchPromises.set(tokenKey, approvalStatusPromise);
                }

                // TODO: don't batch this, need a way to directly set based on key in the requiredApprovals map in the store, asynchronously
                Promise.all(approvalFetchPromises.values())
                    .then((results) => {
                        const approvalResults: Map<string, boolean> = new Map();
                        let idx = 0;
                        approvalFetchPromises.forEach((value, key) => {
                            // relying on insertion order here lol to match up the results (booleans) with the token keys
                            approvalResults.set(key, results[idx]);
                            idx++;
                        });
                        // Grab requiredApprovals slice of store object as subtree from original store using svelte-immer-store
                        const requiredApprovalsSelector = select((root) => root?.requiredApprovals);
                        if (requiredApprovalsSelector) {
                            console.log("APPROVAL RESULTS", approvalResults);
                            console.log("EXISTING SELECTOR", requiredApprovalsSelector);
                            requiredApprovalsSelector.update((existing) => {
                                if (existing) {
                                    const merged = new Map([...existing, ...approvalResults]);
                                    console.log("MERGED", merged);
                                    return merged;
                                } else {
                                    return approvalResults;
                                }
                            });
                        }
                        gameScene.playSound('menu-message');
                        this.setIsApproving(false);
                        return;
                    })
                    .catch((err) => {
                        console.error(err);
                    });
            }
        },
        setIsApproving(state: boolean) {
            // Grab isApproving slice of store object as subtree from original store using svelte-immer-store
            const isApprovingSelector = select((root) => root?.isApproving);
            if (isApprovingSelector) {
                isApprovingSelector.set(state);
            }
        },
        sendSignedOrder(signedOrder: SignedOrder) {
            const gameScene = gameManager.getCurrentGameScene();
            // send a Signed Order to the target so that they can fill the order
            const currentTrade = get(activeTradeStore);
            if (currentTrade) {
                const signedOrderSelector = select((root) => root?.signedOrder);
                signedOrderSelector.set(signedOrder);
                gameScene.signedOrder(currentTrade.counterparty.userId, signedOrder);
                gameScene.playSound('menu-confirmation');
                resetRemainingTimeToFillOrderTimer();
            }

            // create cached (pending) trade, start listening on-chain to the transaction
        },
        handleSignedOrder(initiator: number, payload: string) {
            try {
                const gameScene = gameManager.getCurrentGameScene();
                const signedOrderJSON = JSON.parse(payload);
                // TODO: check if we have enough balance to pay gas, fees
                const signedOrderSelector = select((root) => root?.signedOrder);
                // TODO: do we need to check here if signedOrder already exists? what happens if counterparty sent us another order?
                signedOrderSelector.set(signedOrderJSON.signedOrder); // rest of logic is handled in TradeScreen.svelte
                gameScene.playSound('menu-confirmation');
                resetRemainingTimeToFillOrderTimer();
            } catch (err) {
                console.error(err);
            }
        },
        sendFillOrder() {
            const gameScene = gameManager.getCurrentGameScene();
            // send a Signed Order to the target so that they can fill the order
            const currentTrade = get(activeTradeStore);
            if (currentTrade) {
                const orderFilledSelector = select((root) => root?.orderFilled);
                orderFilledSelector.set(true);
                gameScene.fillOrder(currentTrade.counterparty.userId);
                gameScene.playSound('menu-confirm');
                clearRemainingTimeToFillOrderTimer();
            }

            // create cached (pending) trade, start listening on-chain to the transaction
        },
        handleFillOrder() {
            try {
                const gameScene = gameManager.getCurrentGameScene();
                const orderFilledSelector = select((root) => root?.orderFilled);
                orderFilledSelector.set(true);
                gameScene.playSound('menu-confirm');
                resetRemainingTimeToFillOrderTimer();
            } catch (err) {
                console.error(err);
            }
        },
        sendCompleteTrade() {
            // send a Signed Order to the target so that they can fill the order
            const currentTrade = get(activeTradeStore);
            if (currentTrade) {
                const gameScene = gameManager.getCurrentGameScene();
                gameScene.playSound('menu-confirm');
                gameScene.completeTrade(currentTrade.counterparty.userId);
                reset();
            }
        },
        handleClose() {
            // Cleanup the store
            reset();
        },
        addItemToTrade(item: Nft | Token): void {
            const gameScene = gameManager.getCurrentGameScene();
            update((trade) => {
                if (!trade) {
                    return trade;
                }
                let itemFound = false;
                let updatedOffer = [...trade.myTradeOffer];
                updatedOffer.forEach((tradeItem) => {
                    if (isTokenType(tradeItem) && isTokenType(item)) {
                        if (getKeyForToken(tradeItem) === getKeyForToken(item)) {
                            tradeItem.balance = tradeItem.balance.add(item.balance);
                            itemFound = true;
                        }
                    } else if (tradeItem.type === "ERC1155") {
                        // TODO: handle stacking ERC1155's
                    }
                });
                if (!itemFound) {
                    updatedOffer = [...trade.myTradeOffer, item];
                }
                gameScene.playSound('chat-message');
                this.sendOfferUpdate(trade.counterparty.userId, updatedOffer);
                return { ...trade, myTradeOffer: updatedOffer, meConfirmed: false, counterpartConfirmed: false };
            });
        },
        removeTokenFromTrade(token: Token): void {
            const gameScene = gameManager.getCurrentGameScene();
            update((trade) => {
                if (!trade) {
                    return trade;
                }
                const updatedOffer = trade.myTradeOffer.filter((itemInOffer) => {
                    if (isNftType(itemInOffer)) {
                        // Do not remove Nfts
                        return true;
                    } else {
                        return getKeyForToken(itemInOffer) !== getKeyForToken(token);
                    }
                });
                gameScene.playSound('chat-message-reversed');
                this.sendOfferUpdate(trade.counterparty.userId, updatedOffer);
                return { ...trade, myTradeOffer: updatedOffer, meConfirmed: false, counterpartConfirmed: false };
            });
        },
        removeAmountFromTokenInTrade(token: Token, removeAmount: BigNumber): void {
            const gameScene = gameManager.getCurrentGameScene();
            update((trade) => {
                if (!trade) {
                    return trade;
                }
                const updatedOffer = trade.myTradeOffer.map((itemInOffer) => {
                    if (isNftType(itemInOffer) || getKeyForToken(itemInOffer) !== getKeyForToken(token)) {
                        // Do not change Nfts or other tokens
                        return itemInOffer;
                    } else {
                        itemInOffer.balance = itemInOffer.balance.sub(removeAmount);
                        return itemInOffer;
                    }
                });
                gameScene.playSound('chat-message-reversed');
                this.sendOfferUpdate(trade.counterparty.userId, updatedOffer);
                return { ...trade, myTradeOffer: updatedOffer, meConfirmed: false, counterpartConfirmed: false };
            });
        },
        removeNftFromTrade(nft: Nft): void {
            const gameScene = gameManager.getCurrentGameScene();
            update((trade) => {
                if (!trade) {
                    return trade;
                }
                const updatedOffer = trade.myTradeOffer.filter((itemInOffer) => {
                    if (isTokenType(itemInOffer)) {
                        // Do not remove Tokens
                        return true;
                    } else {
                        return getKeyForNft(itemInOffer) !== getKeyForNft(nft);
                    }
                });
                gameScene.playSound('chat-message-reversed');
                this.sendOfferUpdate(trade.counterparty.userId, updatedOffer);
                return { ...trade, myTradeOffer: updatedOffer, meConfirmed: false, counterpartConfirmed: false };
            });
        },
        sendOfferUpdate(target: number, myOffer: Array<Nft | Token>): void {
            resetRemainingTimeToApproveTimer();
            const gameScene = gameManager.getCurrentGameScene();
            return gameScene.offerUpdate(target, myOffer);
        },
        handleOfferUpdate(payload: string): void {
            // eslint-disable-next-line
            let offerJson: any;
            resetRemainingTimeToApproveTimer();
            try {
                offerJson = JSON.parse(payload, (_key, _value) => {
                    if (_key === "balance" || _key === "originalBalance") {
                        console.log("HEX", _value.hex);
                        return BigNumber.from(_value.hex);
                    } else {
                        return _value;
                    }
                });
                update((trade) => {
                    if (!trade) {
                        return trade;
                    }
                    return {
                        ...trade,
                        counterpartyOffer: offerJson.offer,
                        meConfirmed: false,
                        counterpartConfirmed: false,
                    };
                });
            } catch (err) {
                console.error(err);
            }
        },
        confirmOffer(): void {
            const currentTrade = get(activeTradeStore);
            const gameScene = gameManager.getCurrentGameScene();
            if (!currentTrade || (currentTrade.counterpartyOffer.length <= 0 && currentTrade.myTradeOffer.length <= 0)) {
                console.log("No active trade found.");
                return;
            }
            if (currentTrade.counterpartConfirmed) {
                // Go To the Next Screen
                this.updateRequiredApprovals();
                gameScene.playSound('menu-message');
                console.log("We both confirmed, what to do now?");
            }
            update((trade) => {
                if (!trade) {
                    return trade;
                }
                return { ...trade, meConfirmed: true };
            });
            return gameScene.offerConfirm(currentTrade.counterparty.userId);
        },
        handleOfferConfirm(): void {
            console.log("Handling offer confirm");
            const currentTrade = get(activeTradeStore);
            const gameScene = gameManager.getCurrentGameScene();
            if (!currentTrade) {
                console.log("No active trade found.");
                return;
            }
            if (currentTrade.meConfirmed) {
                // Go To the Next Screen
                this.updateRequiredApprovals();
                gameScene.playSound('menu-message');
                console.log("We both confirmed, what to do now?");
            }
            update((trade) => {
                if (!trade) {
                    return trade;
                }
                return { ...trade, counterpartConfirmed: true };
            });
        },
    };
}

export const activeTradeStore = createActiveTradeStore();

// export const myOfferMenuToken = writable("");
// export const otherOfferMenuToken = writable("");

// export const tradeStateStore = writable<TradeState>("off");
// export const tradeRoleStore = writable<TradeRole>("target");

// function createTradeUserStore() {
//     const { subscribe, set } = writable<number>(0);

//     function reset() {
//         // ...
//     }

//     return {
//         subscribe,
//         makeTradeRequest(target: number): void {
//             set(target);
//         },
//         acceptTrade(user: number): void {
//             set(user);
//         },
//         /**
//          * Stops the trade with user.
//          * Will update tradeStateStore and tradeRoleStore.
//          */
//         declineTrade(): void {
//             set(0);
//             reset();
//         },
//     };
// }

// export const tradeUserStore = createTradeUserStore();
