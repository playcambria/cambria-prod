<script lang="ts">
    import Offer from "./Offer.svelte";
    import { BigNumber } from "ethers";
    import TradeSummaryItem from "./TradeSummaryItem.svelte";
    import {
        activeTradeStore,
        remainingTimeToApprove,
        remainingTimeToFillOrder,
        itemToSwapItem,
        buildOrder,
        showTradeScreen,
        TRADE_EXPIRATION_SECONDS,
    } from "../../Stores/TradeStore";
    import {
        estimateGasForApproval,
        estimateGasForFillOrder,
        UserFacingERC20AssetDataSerialized,
    } from "@traderxyz/nft-swap-sdk";
    import { signer } from "svelte-ethers-store";

    import success from "/resources/icons/success.png";
    import { isTokenType, isNftType, getKeyForItem } from "./utils";
    import { Token as TokenType } from "../../Stores/InventoryTokens/Token";

    import { Steps } from "svelte-steps";
    import { Nft } from "../Navigation/Inventory/types";
    import { randomBytes, formatBytes32String } from "ethers/lib/utils";
    import { getRemainingMinuteAndSeconds } from "../../Utils/Dateutils";
    import { chatMessagesStore } from "../../Stores/ChatStore";
    import { lastInventoryUpdateMs } from "../../Stores/InventoryStore";
    import { lastInventoryTokenUpdateMs } from "../../Stores/AlchemyStore";

    import { gameManager } from "../../Phaser/Game/GameManager";
    import { Jumper } from "svelte-loading-spinners";

    import Airtable from "airtable";
    import { achievementsStore } from "../../Stores/AchievementsStore";

    import { inventoryNFTIdsState } from "../../Stores/InventoryStore";

    interface ItemApproval {
        item: Nft | TokenType;
        key: string;
    }

    remainingTimeToApprove.subscribe((time: number) => {
        if (time === 3) {
            activeTradeStore.restartRemainingTimeToApproveTimer();
        }
    });

    remainingTimeToFillOrder.subscribe((time: number) => {
        if (time === TRADE_EXPIRATION_SECONDS) {
            activeTradeStore.restartRemainingTimeToFillOrderTimer();
        }
    });

    let tradeAccount = $activeTradeStore?.counterparty.playerName;

    $: {
        console.log("OFFER UPDATE", $activeTradeStore?.counterpartyOffer);
    }

    let steps = [{ text: "Set Approval For Tokens" }, { text: "Sign Order" }];
    let currentStep = 0;
    let updateRequiredApprovalsPromise: Promise<void>;

    $: approvalChecked = !!$activeTradeStore?.requiredApprovals;

    $: myOfferItemKeys = $activeTradeStore?.myTradeOffer.map((item) => {
        console.log("offerItem", item);
        return {
            item,
            key: getKeyForItem(item),
        };
    });

    $: itemsThatNeedApproval = myOfferItemKeys
        ? myOfferItemKeys.filter(({ key }) => $activeTradeStore?.requiredApprovals?.get(key) !== true)
        : [];

    $: order =
        $activeTradeStore && $activeTradeStore.nftSwap
            ? buildOrder(
                  $activeTradeStore.nftSwap,
                  [
                      {
                          address: $activeTradeStore.myAddress,
                          items: $activeTradeStore.myTradeOffer,
                      },
                      {
                          address: $activeTradeStore.counterparty.walletAddress || "",
                          items: $activeTradeStore.counterpartyOffer,
                      },
                  ],
                  new Date(0),
                  formatBytes32String("cambria_fake_salt")
              )
            : null;

    $: if ($activeTradeStore && !!$activeTradeStore.signedOrder && $activeTradeStore.role === "target") {
        console.log("We received a signed order! Need to show a button for user to fill the order");
    }

    function isToken(item: Nft | TokenType): item is TokenType {
        return (item as TokenType).address !== undefined;
    }

    function onTriggerApprovals() {
        if ($activeTradeStore) {
            approvalChecked = false;
            activeTradeStore.setIsApproving(true);

            console.log("itemsThatNeedApproval", itemsThatNeedApproval);
            const approvalTxs = itemsThatNeedApproval
                .filter(
                    (t) =>
                        isTokenType(t.item) ||
                        t.key ===
                            itemsThatNeedApproval.find(
                                (firstItem: ItemApproval) =>
                                    // If we have multiple NFTs (721 or 1155) from the same contract, with different tokenIds, we only need one approval per contract
                                    isNftType(t.item) &&
                                    isNftType(firstItem.item) &&
                                    firstItem.item.contractAddress === t.item.contractAddress
                            )?.key
                )
                .map(({ item }) => {
                    console.log("SET APPROVAL", itemToSwapItem(item), $activeTradeStore?.myAddress);

                    const erc20proxy = $activeTradeStore?.nftSwap.erc20ProxyContractAddress;
                    if (erc20proxy) {
                        if (isToken(item)) {
                            const erc20itemswap = itemToSwapItem(item) as UserFacingERC20AssetDataSerialized;
                            console.log("erc20itemswap", erc20itemswap);
                            console.log("erc20proxy", erc20proxy);

                            estimateGasForApproval(erc20proxy, erc20itemswap, $signer).then((value) => {
                                console.log("estimate value", value.toString());
                                const estimateValue = value;
                                console.log("estimate", estimateValue);
                            });

                            $signer.getAddress().then((addr) => {
                                $activeTradeStore?.nftSwap
                                    .loadApprovalStatus(erc20itemswap, addr)
                                    .then((approvalStatus) => console.log("approvalStatus ownerAddr", approvalStatus));
                            });

                            $activeTradeStore?.nftSwap
                                .loadApprovalStatus(erc20itemswap, erc20proxy)
                                .then((approvalStatus) => {
                                    console.log("approvalStatus erc20proxy", approvalStatus);
                                });
                        }
                    }

                    return $activeTradeStore?.nftSwap
                        .approveTokenOrNftByAsset(itemToSwapItem(item), $activeTradeStore?.myAddress)
                        .then((tx) => $activeTradeStore?.nftSwap.awaitTransactionHash(tx.hash))
                        .catch((err) => console.error(err));
                });

            updateRequiredApprovalsPromise = Promise.allSettled(approvalTxs)
                .then((_res) => {
                    activeTradeStore.updateRequiredApprovals();
                })
                .catch((err) => {
                    console.error(err);
                });
        }
    }

    function onTriggerSign() {
        if ($activeTradeStore && order) {
            try {
                // If we are signing (as initiator), we are the taker
                const timeLimit = 15 * 60; // seconds before the order expires
                const expiryTime = Math.floor(new Date().getTime() / 1000) + timeLimit;
                $activeTradeStore.nftSwap
                    .signOrder(
                        {
                            ...order,
                            salt: BigNumber.from([3, 5, 8, 2, ...randomBytes(28)]).toString(),
                            expirationTimeSeconds: BigNumber.from(expiryTime).toString(),
                        },
                        $activeTradeStore.myAddress
                    )
                    .then((signedOrder) => {
                        console.log("SIGNED ORDER!", signedOrder);
                        activeTradeStore.sendSignedOrder(signedOrder);
                    })
                    .catch((err) => {
                        // could be many things - user rejected, failed, etc.
                        // need to handle "retry"
                        console.error(err);
                    });
            } catch (err) {
                console.error(err);
            }
        }
    }

    function pushToAirtable(trade: any) {
        // DEMO ONLY 
        // Push to localStorage 
    }

    function onTriggerFill() {
        if ($activeTradeStore && $activeTradeStore.signedOrder) {
            console.log("TRIGGER FILL", $activeTradeStore.signedOrder);

            estimateGasForFillOrder($activeTradeStore.signedOrder, $activeTradeStore.nftSwap.exchangeContract)
                .then((gasEstimate) => console.log("gasEstimate", gasEstimate.toString()))
                .catch((e) => console.error("error calculating estimated gas", e));

            const multiple = 1.05;
            console.log("gas buffer multiple", multiple);
            $activeTradeStore.nftSwap
                .fillSignedOrder($activeTradeStore.signedOrder, { gasAmountBufferMultiple: multiple })
                .then((fillTx) => {
                    activeTradeStore.sendFillOrder();
                    const orderSummary = {
                        myAddress: $activeTradeStore?.myAddress,
                        counterpartyAddress: $activeTradeStore?.counterparty.walletAddress,
                        myTradeOffer: JSON.stringify($activeTradeStore?.myTradeOffer),
                        counterpartyOffer: JSON.stringify($activeTradeStore?.counterpartyOffer),
                    };
                    $activeTradeStore?.nftSwap
                        .awaitTransactionHash(fillTx.hash)
                        .then((receipt) => {
                            if (receipt.status === 1) {
                                console.log("ORDER FILLED! TX HASH:", receipt.transactionHash);
                                chatMessagesStore.addTradeCompletedMessage(
                                    $activeTradeStore?.counterparty.userId ?? 0,
                                    `[Trade] Trade with ${$activeTradeStore?.counterparty.playerName} completed successfully.`
                                );
                                // Update Inventory to make sure it detects new NFTs from counterparty's offer 
                                if ($activeTradeStore?.counterpartyOffer) {
                                    const _nfts = $activeTradeStore.counterpartyOffer.filter(isNftType).map(n => n.nft_id);
                                    if (_nfts && _nfts.length > 0) {
                                        inventoryNFTIdsState.update((inventoryNfts) => {
                                            const merged = inventoryNfts.concat(_nfts);
                                            return merged;
                                        });
                                    }
                                }
                                activeTradeStore.sendCompleteTrade();
                                lastInventoryUpdateMs.set(Date.now());
                                lastInventoryTokenUpdateMs.set(Date.now());
                                // .. close out of trade window, run post-trade success logic
                                const gameScene = gameManager.getCurrentGameScene();
                                gameScene.playSound('sparkle-confirm-long')
                                pushToAirtable(orderSummary);
                                window.localStorage.setItem("trade", "completed");
                                achievementsStore.completeAchievement('my_first_trade');
                            } else {
                                console.log("ORDER FAILED! Receipt:", { receipt });
                                // .. show error message - retry?
                            }
                        })
                        .catch((err) => {
                            // need to handle "retry"
                            console.error(err);
                        });
                })
                .catch((err) => {
                    // could be many things - user rejected, failed, etc.
                    // need to handle "retry"
                    console.error(err);
                });
        }
    }
</script>

<div class="trade-screen" class:visible={$showTradeScreen}>
    <div class="trade-header">
        <div>Trading with {tradeAccount}</div>
        <!-- <div>View their Inventory</div> -->
    </div>
    <div class="trade-body">
        {#if !$activeTradeStore?.counterpartConfirmed || !$activeTradeStore?.meConfirmed}
            <div class="offer-step">
                <div class="offer my">
                    <Offer isMyOffer={true} tradeAccount={tradeAccount || ""} offer={$activeTradeStore?.myTradeOffer} />
                </div>
                <div class="offer others">
                    <Offer
                        isMyOffer={false}
                        tradeAccount={tradeAccount || ""}
                        offer={$activeTradeStore?.counterpartyOffer}
                    />
                </div>
                <div class="respond">
                    {#if !$activeTradeStore?.counterpartConfirmed && $activeTradeStore?.meConfirmed}
                        <h5>You have accepted the offer</h5>
                    {/if}
                    {#if $activeTradeStore?.counterpartConfirmed && !$activeTradeStore?.meConfirmed}
                        <h5>Other player has accepted the offer</h5>
                    {/if}
                    {#if $activeTradeStore?.counterpartConfirmed && $activeTradeStore?.meConfirmed}
                        <h5>Both players have accepted the offer</h5>
                    {/if}
                    <button
                        type="button"
                        class="nes-btn smaller-button"
                        class:is-success={$remainingTimeToApprove === 0}
                        class:is-disabled={$remainingTimeToApprove >= 1}
                        on:click={() => {
                            $remainingTimeToApprove === 0 && activeTradeStore.confirmOffer();
                        }}>{$remainingTimeToApprove || "Accept"}</button
                    >
                    <button
                        type="button"
                        class="nes-btn is-error smaller-button"
                        on:click={() => {
                            activeTradeStore.declineActiveTrade();
                        }}>Decline</button
                    >
                </div>
            </div>
        {/if}
        {#if $activeTradeStore?.counterpartConfirmed && $activeTradeStore?.meConfirmed}
            <div class="confirmation-step">
                <div class="offer-summary">
                    <div class="my summary">
                        <h5 class="summary-title">Your Offer:</h5>
                        {#each $activeTradeStore.myTradeOffer as item}
                            <TradeSummaryItem {item} />
                        {/each}
                    </div>
                    <div class="their summary">
                        <h5 class="summary-title">Their Offer:</h5>
                        {#each $activeTradeStore.counterpartyOffer as item}
                            <TradeSummaryItem {item} />
                        {/each}
                    </div>
                </div>
                <div class="finalize-column">
                    <div class="finalize-title">
                        <h5 class="finalize-title-label">Finalize Your Trade</h5>
                        <h5 class="powered-0x">powered by 0x</h5>
                    </div>
                    <div class="finalize-content">
                        <Steps
                            light="#888888"
                            size="2rem"
                            {steps}
                            primary="#ffffff"
                            secondary="#252525"
                            bind:current={currentStep}
                        />
                        <div class="right-box">
                            {#if currentStep === 0}
                                <p>
                                    This is a 1-time (per token) transaction that gives the 0x protocol access to the
                                    NFTs and/or tokens listed below:
                                </p>
                                {#each $activeTradeStore.myTradeOffer as item}
                                    <div class="approve-required-items">
                                        <h6 class="list-item">- {item.name}</h6>
                                        {#if $activeTradeStore?.requiredApprovals?.get(getKeyForItem(item)) === true}
                                            <img class="success" src={success} alt="success" />
                                            <h6 class="list-item">(Already approved)</h6>
                                        {/if}
                                    </div>
                                {/each}
                                {#if itemsThatNeedApproval?.length}
                                    {#await updateRequiredApprovalsPromise}
                                        <button type="button" class="nes-btn smaller-button" disabled>
                                            Approving...
                                        </button>
                                    {:then}
                                        <button
                                            type="button"
                                            class="nes-btn smaller-button"
                                            on:click={onTriggerApprovals}
                                        >
                                            Set Approval
                                        </button>
                                    {/await}
                                {:else}
                                    <button
                                        type="button"
                                        class="nes-btn smaller-button"
                                        disabled={!approvalChecked}
                                        on:click={() => currentStep++}
                                    >
                                        {approvalChecked ? "Next" : "Checking..."}
                                    </button>
                                {/if}
                            {:else if currentStep === 1}
                                {#if $activeTradeStore.role === "target"}
                                    {#if !$activeTradeStore?.signedOrder}
                                        <p>
                                            After you sign this order, {$activeTradeStore.counterparty.playerName} will have
                                            10 minutes to execute the order before it expires.
                                        </p>
                                        <p>
                                            Your items will only leave your wallet if the order is successfully
                                            completed.
                                        </p>
                                        <button type="button" class="nes-btn smaller-button" on:click={onTriggerSign}
                                            >Sign Order</button
                                        >
                                    {:else}
                                        <div class="status-message">
                                            <img class="success" src={success} alt="success" />Successfully signed
                                            order.
                                        </div>
                                        {#if !$activeTradeStore?.orderFilled}
                                            <div class="status-message">
                                                <Jumper size="24" color="#FF3E00" unit="px" duration="2s" />
                                                Waiting for {$activeTradeStore.counterparty.playerName} to fill the order
                                                ({getRemainingMinuteAndSeconds($remainingTimeToFillOrder)})
                                            </div>
                                        {:else}
                                            <div class="status-message">
                                                <img class="success" src={success} alt="success" />{$activeTradeStore
                                                    .counterparty.playerName} has filled the order.
                                            </div>
                                            <div class="status-message">
                                                <Jumper size="24" color="#FF3E00" unit="px" duration="2s" />
                                                Transaction is pending...
                                            </div>
                                        {/if}
                                        <!-- <button
                                            type="button"
                                            class="nes-btn smaller-button"
                                            style="margin-top: 6px"
                                            on:click={() => showTradeScreen.set(false)}>Minimize</button
                                        > -->
                                    {/if}
                                {:else if $activeTradeStore && !!$activeTradeStore.signedOrder}
                                    {#if !$activeTradeStore?.orderFilled}
                                        <div class="status-message">
                                            <img class="success" src={success} alt="success" />{$activeTradeStore
                                                .counterparty.playerName} has finished signing. Fill this trade to finish
                                            ({getRemainingMinuteAndSeconds($remainingTimeToFillOrder)})
                                        </div>
                                        <button type="button" class="nes-btn smaller-button" on:click={onTriggerFill}
                                            >Fill Trade Order</button
                                        >
                                    {:else}
                                        <div class="status-message">
                                            <Jumper size="24" color="#FF3E00" unit="px" duration="2s" />
                                            Transaction is pending...
                                        </div>
                                        <!-- <button
                                            type="button"
                                            class="nes-btn smaller-button"
                                            on:click={() => showTradeScreen.set(false)}>Minimize</button
                                        > -->
                                    {/if}
                                {:else}
                                    <div class="status-message">
                                        <Jumper size="24" color="#FF3E00" unit="px" duration="2s" />
                                        Waiting for {$activeTradeStore.counterparty.playerName} to sign the order...
                                    </div>
                                {/if}
                            {/if}
                        </div>
                    </div>
                </div>
            </div>
        {/if}
    </div>
</div>

<style lang="scss">
    .trade-screen {
        display: none;
        flex-direction: column;
        left: 0;
        right: 0;
        top: 6%;
        margin-left: auto;
        margin-right: auto;
        width: 800px;
        height: 600px;
        background-color: rgba(71, 71, 71, 1);
        color: white;
        border-radius: 8px;
        z-index: 99999;
        border: 3px solid black;
        font-size: large;
        pointer-events: auto;
    }

    .trade-header {
        background-color: rgba(0, 0, 0, 1);
        height: 70px;
        color: white;
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: x-large;
        padding: 0 15px;
        border-radius: 8px 8px 0 0;
    }

    .trade-body {
        height: 100%;
        position: relative;
    }

    .offer-step {
        height: 100%;
        width: 100%;
        display: flex;
    }

    .offer {
        width: 50%;
        padding-top: 1.2rem;
        padding-left: 1.8rem;
        padding-right: 1rem;
        &.my {
            border-right: 2px solid black;
        }
        &.others {
            padding-left: 1.8rem;
        }
    }

    .smaller-button {
        font-size: x-large;
        padding-top: 4px;
        padding-bottom: 4px;
    }

    .respond {
        position: absolute;
        width: 200px;
        left: calc(50% - 100px);
        bottom: 50px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 20px;
        text-align: center;
    }

    .confirmation-step {
        display: flex;
        height: 100%;

        > .offer-summary {
            display: flex;
            flex-direction: column;
            width: 40%;
            background: rgba(37, 37, 37, 1);
            font-size: 24px;
            border-right: 2px solid black;

            > .summary {
                padding: 20px;
                display: flex;
                flex-direction: column;
                height: 50%;
                font-size: 20px;
                line-height: 25px;
            }
        }
    }
    .summary-title {
        font-size: 24px;
    }

    .finalize-column {
        padding: 20px 30px;
        width: 100%;
    }

    .finalize-title {
        display: flex;
        justify-content: space-between;
        margin-bottom: 1rem;
    }

    .finalize-title-label {
        font-size: 28px;
        line-height: 25px;
        margin-bottom: 1.5rem;
    }

    .powered-0x {
        font-size: 20px;
        font-weight: normal;
    }

    .finalize-content {
        display: flex;
        flex-direction: column;
        height: 100%;
        width: 100%;
    }

    .right-box {
        margin-top: 30px;
        width: 100%;
        font-size: 24px;
        line-height: 24px;
    }

    .list-item {
        font-size: 24px;
        margin-right: 12px;
        font-weight: normal;
    }

    .approve-required-items {
        display: flex;
        margin-bottom: 1rem;
    }

    .glasshour,
    .success {
        margin-left: 4px;
        margin-right: 2px;
        width: 18px;
        height: 18px;
    }

    .status-message {
        display: flex;
        gap: 0px 14px;
        margin-top: 1rem;
        margin-bottom: 1rem;
    }

    .visible {
        display: flex;
    }
</style>
