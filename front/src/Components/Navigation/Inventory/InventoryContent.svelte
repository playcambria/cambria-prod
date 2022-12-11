<script lang="ts">
    import {
        itemType,
        ItemTypes,
        filterText,
        inventoryNFTIdsState,
        walletNFTContentsState,
    } from "../../../Stores/InventoryStore";
    import Token from "./Token.svelte";
    import Nft from "./Nft.svelte";
    import GameItem from "./GameItem.svelte";
    import { Nft as NftType, ItemContext, GameItem as GameItemType } from "./types";

    import { activeTradeStore, showTradeScreen } from "../../../Stores/TradeStore";

    import { handleTransaction } from "../../../Stores/TransactionStore";
    import { Transaction } from "../../../Stores/TransactionStore";
    import { textInputPromptStore } from "../../../Stores/TextInputAreaStore";

    import { onDestroy } from "svelte";
    import { ethers } from "ethers";

    import { Token as TokenType } from "../../../Stores/InventoryTokens/Token";

    import { tokenInventoryStore, gameInventoryStore } from "../../../Stores/InventoryStore";
    import { RightClickMenuAction, rightClickMenuStore } from "../../../Stores/RightClickMenuStore";
    import { ActionsMenuAction } from "../../../Stores/ActionsMenuStore";
    import { setPfpUrl } from "../../../Supabase/user";
    import { gameManager } from "../../../Phaser/Game/GameManager";
    import { menuIconVisiblilityStore, menuVisiblilityStore } from "../../../Stores/MenuStore";
    import { selectCompanionSceneVisibleStore } from "../../../Stores/SelectCompanionStore";
    import { SelectCompanionScene, SelectCompanionSceneName } from "../../../Phaser/Login/SelectCompanionScene";
    import { nftSorter, nftSpamSort } from "./nft-helper";

    import { showBankScreen } from "../../../Stores/BankStore";

    import { achievementsStore } from "../../../Stores/AchievementsStore";
    import { collectionMetadata } from "../../../Stores/InventoryStore";

    let inventoryTokens: TokenType[] = [];
    let tokenInvUnsub = tokenInventoryStore.subscribe((tokens) => {
        inventoryTokens = tokens;
    });

    let activeToken: TokenType | null = null;

    $: nftsInInventory = $walletNFTContentsState.filter((nft) => $inventoryNFTIdsState.includes(nft.nft_id));

    const onAmountInput = (amount: string) => {
        if (activeToken && activeToken.balance && activeToken.decimals) {
            // Current Token Balance
            const inventoryBalance = activeToken.balance;

            // Amount to offer as part of trade
            let offerBalance = ethers.utils.parseUnits(amount.toString(), activeToken.decimals);

            // If the input value is bigger than inventory balance, we should use inventory balance as offer value
            if (offerBalance.gt(inventoryBalance)) {
                offerBalance = inventoryBalance;
            }

            let tradeToken: TokenType = activeToken;
            tradeToken.balance = offerBalance;
            tradeToken.originalBalance = inventoryBalance;

            activeTradeStore.addItemToTrade(tradeToken);
            activeToken = null;
        } else {
            // handle missing decimals case
        }
    };

    function onOfferX(token: TokenType) {
        // Open Text Input Menu
        textInputPromptStore.initialize("Enter amount:", onAmountInput);
        activeToken = { ...token }; // must create new instance
    }

    function onOfferAll(token: TokenType) {
        // Offer All of token
        activeToken = { ...token }; // must create new instance
        if (activeToken && activeToken.balance) {
            const inventoryBalance = activeToken.balance;

            let tradeToken: TokenType = activeToken;
            tradeToken.balance = inventoryBalance;
            tradeToken.originalBalance = inventoryBalance;

            activeTradeStore.addItemToTrade(tradeToken);
            activeToken = null;
        }
    }

    function handleTokenClick(token: TokenType) {
        // Are we in a trade?
        if ($activeTradeStore) {
            // If so, trigger default action (Offer X)
            onOfferX(token);
        } else {
            // TODO: implement (should trigger default item action of right-click context menu) - maybe examine?
            // no-op
        }
    }

    function toggleTokenRightClickMenu(e: MouseEvent, token: TokenType): void {
        const actions = getTokenRightClickMenuActions(token);
        rightClickMenuStore.showMenu(e.clientX, e.clientY, actions.length, true);
    }

    function hoverTokenRightClickMenu(e: MouseEvent, token: TokenType): void {
        const actions = getTokenRightClickMenuActions(token);
        rightClickMenuStore.initialize(e.clientX, e.clientY, actions.length, true);
        for (const action of actions) {
            rightClickMenuStore.addAction(action);
        }
    }

    function getTokenRightClickMenuActions(token: TokenType): RightClickMenuAction[] {
        const actions: ActionsMenuAction[] = [];

        if (!$showTradeScreen) {
            if (token.symbol === "WETH") {
                actions.push({
                    actionName: Transaction.unwrap,
                    actionContext: token.symbol,
                    protected: true,
                    priority: 3,
                    callback: () => {
                        handleTransaction("weth", Transaction.unwrap);
                        rightClickMenuStore.clear();
                    },
                });
            }
            if (token.symbol === "ETH") {
                actions.push({
                    actionName: Transaction.wrap,
                    actionContext: token.symbol,
                    protected: true,
                    priority: 3,
                    callback: () => {
                        handleTransaction("eth", Transaction.wrap);
                        rightClickMenuStore.clear();
                    },
                });
                actions.push({
                    actionName: "Bridge",
                    actionContext: token.symbol,
                    disabled: true,
                    protected: true,
                    priority: 3,
                    callback: () => {
                        console.log("TODO: Bridge");
                        rightClickMenuStore.clear();
                    },
                });
                actions.push({
                    actionName: `Swap`,
                    actionContext: token.symbol,
                    protected: true,
                    disabled: true,
                    priority: 3,
                    callback: () => {
                        rightClickMenuStore.clear();
                    },
                });
            }
        } else {
            if (token.symbol !== "ETH") {
                actions.push({
                    actionName: "Offer-X",
                    actionContext: token.symbol,
                    protected: true,
                    priority: 3,
                    callback: () => {
                        onOfferX(token);
                        rightClickMenuStore.clear();
                    },
                });
                actions.push({
                    actionName: "Offer-All",
                    actionContext: token.symbol,
                    protected: true,
                    priority: 3,
                    callback: () => {
                        onOfferAll(token);
                        rightClickMenuStore.clear();
                    },
                });
            }
        }

        // Examine
        actions.push({
            actionName: `Examine`,
            actionContext: token.symbol,
            protected: true,
            disabled: true,
            priority: 3,
            callback: () => {
                rightClickMenuStore.clear();
            },
        });

        return actions;
    }

    function toggleNftRightClickMenu(e: MouseEvent, nft: NftType): void {
        const actions = getNftRightClickMenuActions(nft);
        rightClickMenuStore.showMenu(e.clientX, e.clientY, actions.length, true);
    }

    function hoverNftRightClickMenu(e: MouseEvent, nft: NftType): void {
        const actions = getNftRightClickMenuActions(nft);
        rightClickMenuStore.initialize(e.clientX, e.clientY, actions.length, true);
        for (const action of actions) {
            rightClickMenuStore.addAction(action);
        }
    }

    function getNftRightClickMenuActions(nft: NftType): RightClickMenuAction[] {
        const actions: ActionsMenuAction[] = [];
        // Are we in a trade?
        if ($activeTradeStore !== null) {
            // TODO: refine this to detect whether we're minimized
            actions.push({
                actionName: `Offer`,
                actionContext: nft.symbol,
                protected: true,
                priority: 3,
                callback: () => {
                    rightClickMenuStore.clear();
                    // ... do nothing, Nft will handle it
                    // TODO: bring Nft click implementation up here, so that we can keep right click menu. then add on:click to parent div to call triggerDefault
                },
            });
        } else {
            if ($showBankScreen) {
                const gameScene = gameManager.getCurrentGameScene();
                actions.push({
                    actionName: `Deposit`,
                    actionContext: nft.symbol,
                    protected: true,
                    priority: 4,
                    callback: () => {
                        inventoryNFTIdsState.update((nfts) => nfts.filter((nftId) => nftId !== nft.nft_id));
                        gameScene.playSound("chat-message");
                        rightClickMenuStore.clear();
                    },
                });
            } else {
                // Set PFP
                actions.push({
                    actionName: `Set as PFP`,
                    actionContext: nft.symbol,
                    protected: true,
                    priority: 3,
                    callback: () => {
                        if (nft && nft.iconUrl) {
                            setPfpUrl(JSON.stringify(nft)).catch((err) => console.error(err));
                        } else {
                            setPfpUrl("").catch((err) => console.error(err));
                        }
                        const gameScene = gameManager.getCurrentGameScene();
                        gameScene.CurrentPlayer.setPfp(nft.iconUrl || "");
                        gameScene.connection?.emitPfpUpdateEvent();
                        gameScene.playSound("button-feedback");
                        achievementsStore.completeAchievement("flair_up");
                        rightClickMenuStore.clear();
                    },
                });
            }
        }
        actions.push({
            actionName: `Examine`,
            actionContext: nft.symbol,
            protected: true,
            priority: 2,
            callback: () => {
                console.log("Examine");
            },
        });
        return actions;
    }

    function toggleGameItemRightClickMenu(e: MouseEvent, gameItem: GameItemType): void {
        const actions = getGameItemRightClickMenuActions(gameItem);
        rightClickMenuStore.showMenu(e.clientX, e.clientY, actions.length, true);
    }

    function hoverGameItemRightClickMenu(e: MouseEvent, gameItem: GameItemType): void {
        const actions = getGameItemRightClickMenuActions(gameItem);
        rightClickMenuStore.initialize(e.clientX, e.clientY, actions.length, true);
        for (const action of actions) {
            rightClickMenuStore.addAction(action);
        }
    }

    function disableMenuStores() {
        menuVisiblilityStore.set(false);
        menuIconVisiblilityStore.set(false);
    }

    function openEditCompanionScene() {
        disableMenuStores();
        selectCompanionSceneVisibleStore.set(true);
        gameManager.leaveGame(SelectCompanionSceneName, new SelectCompanionScene());
    }

    function getGameItemRightClickMenuActions(gameItem: GameItemType): RightClickMenuAction[] {
        const actions: ActionsMenuAction[] = [];

        actions.push({
            actionName: "Claim",
            actionContext: gameItem.name,
            protected: true,
            priority: 3,
            callback: () => {
                openEditCompanionScene();
                rightClickMenuStore.clear();
            },
        });

        return actions;
    }

    $: filteredTokens = inventoryTokens.filter((inventoryToken: TokenType) =>
        inventoryToken.name.toLowerCase().includes($filterText.toLowerCase())
    );

    $: nftItems =
        $activeTradeStore !== null
            ? $activeTradeStore?.myTradeOffer.filter((item) => "nft_id" in item).map((item) => item as NftType)
            : [];

    onDestroy(() => {
        tokenInvUnsub();
    });

    function isSpam(name: string) {
        if (
            name.includes("Alpha Blocks") ||
            name.includes("Diverse") ||
            name.includes("Combat") ||
            name.includes("Locked") ||
            name.includes("MoodFlip") ||
            name.includes("birdpunk") ||
            name.includes("Beautiful") ||
            name.includes("Exciting") ||
            name.includes("Dragonball") ||
            name.includes("Boxiverse") ||
            name.includes("Emma") ||
            name.includes("RiseLike") ||
            name.includes("RiseLike") ||
            name.includes("Secret Px") ||
            name.includes("Moondens")
        ) {
            return true;
        } else {
            return false;
        }
    }

    function nftSorter(a: NftType, b: NftType) {
        const leftHasFloorPrice = a.collection?.floor_prices && a.collection.floor_prices.length > 0;
        const rightHasFloorPrice = b.collection?.floor_prices && b.collection.floor_prices.length > 0;
        if (leftHasFloorPrice && rightHasFloorPrice && b.collection.floor_prices && a.collection.floor_prices) {
            return b.collection.floor_prices[0].value - a.collection.floor_prices[0].value;
        } else {
            return leftHasFloorPrice ? -1 : 1;
        }
    }

    function nftSpamSort(a: NftType, b: NftType) {
        if (isSpam(a.collection.name) && isSpam(b.collection.name)) {
            return 0;
        } else {
            return isSpam(b.collection.name) ? -1 : 1;
        }
    }

    $: {
        console.log("SERIALIZE");
        console.log(JSON.stringify(Array.from($collectionMetadata.entries())));
    }
</script>

<div class="inventory-content">
    <div class="grid-container">
        {#if $itemType === ItemTypes.Tokens}
            {#if !$tokenInventoryStore.length}
                <div style="padding: 20px; width: 100%; height: 100%; padding-top: 30%; text-align: center;">
                    <span>Loading...</span>
                </div>
            {:else}
                {#each filteredTokens as token (token.address)}
                    <div
                        on:contextmenu|preventDefault={(e) => toggleTokenRightClickMenu(e, token)}
                        on:mouseover={(e) => hoverTokenRightClickMenu(e, token)}
                        on:mouseleave={(e) => rightClickMenuStore.clearIfNotVisible()}
                        on:click={(e) => {
                            if (!token?.balance?.isZero()) {
                                rightClickMenuStore.triggerDefault();
                            }
                        }}
                    >
                        <Token inventoryToken={token} context={ItemContext.Inventory} />
                    </div>
                {/each}
            {/if}
        {:else if $itemType === ItemTypes.Game}
            {#if !$gameInventoryStore.length}
                <div style="width: 100%; height: 100%; padding-top: 30%; text-align: center;">
                    <span>No items...</span>
                </div>
            {:else}
                {#each $gameInventoryStore as gameItem, index (index)}
                    <div
                        on:contextmenu|preventDefault={(e) => toggleGameItemRightClickMenu(e, gameItem)}
                        on:mouseover={(e) => hoverGameItemRightClickMenu(e, gameItem)}
                        on:mouseleave={(e) => rightClickMenuStore.clearIfNotVisible()}
                        on:click={(e) => rightClickMenuStore.triggerDefault()}
                    >
                        <GameItem {gameItem} />
                    </div>
                {/each}
            {/if}
        {:else if $itemType === ItemTypes.Nfts}
            {#if !nftsInInventory.length}
                <div style="padding: 20px; width: 100%; height: 100%; padding-top: 30%; text-align: center;">
                    <span>No items</span>
                </div>
            {:else}
                {#each nftsInInventory
                    // .concat(fakeItems)
                    .sort(nftSorter)
                    .sort(nftSpamSort) as nft (nft.nft_id)}
                    <div
                        on:contextmenu|preventDefault={(e) => toggleNftRightClickMenu(e, nft)}
                        on:mouseover={(e) => hoverNftRightClickMenu(e, nft)}
                        on:mouseleave={(e) => rightClickMenuStore.clearIfNotVisible()}
                        on:click={(e) => console.log("HANDLED IN NFT CLASS")}
                    >
                        <Nft
                            {nft}
                            hide={Boolean(
                                nftItems.find(
                                    (i) => i.contractAddress === nft.contractAddress && i.tokenId === nft.tokenId
                                )
                            )}
                            context={ItemContext.Inventory}
                        />
                    </div>
                {/each}
            {/if}
        {/if}
    </div>
</div>

<style lang="scss">
    .inventory-content {
        height: 100%;
        overflow-y: auto;
        overflow-x: hidden;
    }

    .grid-container {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        justify-items: center;
        padding: 0 10px;
        text-shadow: 0 0 1px black, 0 0 1px black, 0 0 2px black, 0 0 2px black, 0 3px 3px black;
        user-select: none;
    }

    /* .icon {
        width: 50px;
        height: 50px;
    } */
</style>
