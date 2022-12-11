<script lang="ts">
    import { inventoryNFTIdsState, walletNFTContentsState, netWorthEth } from "../../Stores/InventoryStore";
    import { ItemContext, Nft as NftType } from "../Navigation/Inventory/types";
    import { nftSorter, nftSpamSort } from "../Navigation/Inventory/nft-helper";
    import { rightClickMenuStore, RightClickMenuAction } from "../../Stores/RightClickMenuStore";
    import Nft from "../Navigation/Inventory/Nft.svelte";
    import { bankTabsStore, showBankScreen } from "../../Stores/BankStore";
    import { setBankTabs } from "../../Supabase/user";
    import bankLogo from "/resources/logos/bank_logo.png";
    import emptyIcon from "/resources/icons/question_gray.png";
    import { gameManager } from "../../Phaser/Game/GameManager";

    let selectedTab = 0;

    let isDragging = false;
    let draggedNft: NftType | null = null;
    let draggedFrom: number;

    $: bankNfts = $walletNFTContentsState
        .filter((nft) => !$inventoryNFTIdsState.includes(nft.nft_id))
        .sort(nftSorter)
        .sort(nftSpamSort);

    $: tabs = bankNfts
        ? $bankTabsStore.map((bankTab) => {
              const nfts: NftType[] = [];
              bankTab.forEach((nftId) => {
                  const nft = bankNfts.find((nft) => nft.nft_id === nftId);
                  if (nft) {
                      nfts.push(nft);
                  }
              });
              return nfts;
          })
        : [];

    $: defaultTab = bankNfts.filter((nft) => !tabs.some((tab) => tab.includes(nft)));

    function convertToIds(tabs: NftType[][]) {
        return tabs.map((tab) => tab.map((nft) => nft.nft_id));
    }

    $: setBankTabs(convertToIds(tabs));

    function addTab() {
        bankTabsStore.update((tabs) => [...tabs, []]);
    }

    function toggleNftRightClickMenu(e: MouseEvent, nft: NftType, index: number): void {
        const actions = getNftRightClickMenuActions(nft, index);
        rightClickMenuStore.showMenu(e.clientX, e.clientY, actions.length, true);
    }

    function hoverNftRightClickMenu(e: MouseEvent, nft: NftType, index: number): void {
        const actions = getNftRightClickMenuActions(nft, index);
        rightClickMenuStore.initialize(e.clientX, e.clientY, actions.length, true);
        for (const action of actions) {
            rightClickMenuStore.addAction(action);
        }
    }

    function getNftRightClickMenuActions(nft: NftType, index: number): RightClickMenuAction[] {
        const actions: RightClickMenuAction[] = [];
        const gameScene = gameManager.getCurrentGameScene();
        // Withdraw
        actions.push({
            actionName: `Withdraw`,
            actionContext: nft.symbol,
            protected: true,
            priority: 4,
            callback: () => {
                rightClickMenuStore.clear();
                // TODO: merge this with code in Nft.svelte
                inventoryNFTIdsState.update((nfts) => [...nfts, nft.nft_id]);
                gameScene.playSound("chat-message-reversed");
                if (index !== -1) {
                    // mirror onClickCalback
                    removeNftFromTab(nft, index);
                }
            },
        });
        // Set PFP
        actions.push({
            actionName: `Examine`,
            actionContext: nft.symbol,
            protected: true,
            priority: 3,
            callback: () => {
                console.log("Examine");
                rightClickMenuStore.clear();
            },
        });
        return actions;
    }

    function handleDragStart(e: DragEvent, nft: NftType, tabIndex: number) {
        console.log({ e });
        console.log("Drag start");
        draggedNft = nft;
        draggedFrom = tabIndex;
    }

    function handleDragEnd(e: DragEvent) {
        isDragging = false;
    }

    function handleDropOnNewTab(e: DragEvent) {
        e.preventDefault();
        const newTabs = [...tabs];
        console.log({ draggedFrom });
        if (draggedFrom) {
            // Remove item from tab
            const itemIndex = newTabs[draggedFrom - 1].findIndex((nft) => nft.nft_id === draggedNft?.nft_id);
            newTabs[draggedFrom - 1].splice(itemIndex, 1);
            // Remove tab if empty
            if (!newTabs[draggedFrom - 1].length) {
                newTabs.splice(draggedFrom - 1, 1);
            }
        }
        // Add item to new tab
        if (draggedNft) {
            newTabs.push([draggedNft]);
        }
        bankTabsStore.set(convertToIds(newTabs));
        draggedNft = null;
    }

    function handleDropOnSection(e: DragEvent, droppedIn: number) {
        console.log({ e, droppedIn, draggedFrom });
        e.preventDefault();
        if (!draggedNft) {
            return;
        }

        const existingItem = tabs[droppedIn - 1].find((nft) => nft.nft_id === draggedNft?.nft_id);
        if (!existingItem) {
            const newTabs = [...tabs];
            if (draggedFrom) {
                // Remove item from tab
                const itemIndex = newTabs[draggedFrom - 1].findIndex((nft) => nft.nft_id === draggedNft?.nft_id);
                newTabs[draggedFrom - 1].splice(itemIndex, 1);
                // Remove tab if empty
                if (!newTabs[draggedFrom - 1].length) {
                    newTabs.splice(draggedFrom - 1, 1);
                }
            }
            // Add item to new tab
            newTabs[droppedIn - 1].push(draggedNft);
            bankTabsStore.set(convertToIds(newTabs));
            draggedNft = null;
        }
    }

    function handleDropOnDefaultTab(e: DragEvent) {
        e.preventDefault();
        if (!draggedNft) {
            return;
        }

        if (draggedFrom) {
            const newTabs = [...tabs];
            // Remove item from tab
            const itemIndex = newTabs[draggedFrom - 1].findIndex((nft) => nft.nft_id === draggedNft?.nft_id);
            newTabs[draggedFrom - 1].splice(itemIndex, 1);
            // Remove tab if empty
            if (!newTabs[draggedFrom - 1].length) {
                newTabs.splice(draggedFrom - 1, 1);
            }
            bankTabsStore.set(convertToIds(newTabs));
            draggedNft = null;
        }
    }

    function removeNftFromTab(removedNft: NftType, draggedFrom: number) {
        console.log({ draggedFrom });
        if (removedNft) {
            const newTabs = [...tabs];
            // Remove item from tab
            const itemIndex = newTabs[draggedFrom - 1].findIndex((nft) => nft.nft_id === removedNft.nft_id);
            newTabs[draggedFrom - 1].splice(itemIndex, 1);
            // Remove tab if empty
            if (!newTabs[draggedFrom - 1].length) {
                newTabs.splice(draggedFrom - 1, 1);
            }
            bankTabsStore.set(convertToIds(newTabs));
        }
    }
</script>

<div class="bank-screen" style={`border-radius: 10px;`}>
    <div class="bank-header">
        <img
            src={bankLogo}
            alt="bank logo"
            style="height: 30px; margin-left: 3px; margin-bottom: 10px; margin-top: 5px;"
        />
        <div class="bank-net-worth">
            <span>Collection Value: ~{$netWorthEth?.toFixed(2)} ETH</span>
            <span style="color: #09FF04;">(+5.2%)</span>
        </div>
        <div>
            <button class="nes-btn is-error close-button" on:click={() => showBankScreen.set(false)}>X</button>
        </div>
    </div>
    <div class="tabs">
        <div class="tabIconContainer" class:selected={selectedTab === 0} on:click={() => (selectedTab = 0)}>
            {#if bankNfts?.length && bankNfts[0].iconUrl}
                <img class="tabIcon" src={bankNfts?.length ? bankNfts[0].iconUrl : ""} alt="tab" />
            {:else}
                <img class="tabIcon" src={emptyIcon} alt="empty" />
            {/if}
        </div>
        {#each tabs as tab, index}
            <div
                class="tabIconContainer"
                class:selected={selectedTab - 1 === index}
                on:click={() => (selectedTab = index + 1)}
                on:drop={(e) => handleDropOnSection(e, index + 1)}
                ondragover="return false"
            >
                {#if tab?.length && tab[0].iconUrl}
                    <img class="tabIcon" src={tab?.length ? tab[0].iconUrl : ""} alt="tab" />
                {:else}
                    <img class="tabIcon" src={emptyIcon} alt="empty" />
                {/if}
            </div>
        {/each}
        <div
            class="tabIconContainer nes-container is-centered"
            on:click={() => addTab()}
            on:drop={handleDropOnNewTab}
            ondragover="return false"
        >
            <div class="plus">+</div>
        </div>
    </div>
    <div class="bank-body">
        {#if selectedTab === 0}
            <div class="section" on:drop={handleDropOnDefaultTab} ondragover="return false">
                {#each defaultTab as nft (nft.nft_id)}
                    <div
                        on:contextmenu|preventDefault={(e) => toggleNftRightClickMenu(e, nft, -1)}
                        on:mouseover={(e) => hoverNftRightClickMenu(e, nft, -1)}
                        on:mouseleave={(e) => rightClickMenuStore.clearIfNotVisible()}
                    >
                        <Nft
                            {nft}
                            on:dragstart={(e) => handleDragStart(e, nft, 0)}
                            on:dragend={handleDragEnd}
                            context={ItemContext.Bank}
                        />
                    </div>
                {/each}
            </div>
            {#each tabs as tab, index}
                <div class="section" on:drop={(e) => handleDropOnSection(e, index + 1)} ondragover="return false">
                    {#each tab as nft (nft.nft_id)}
                        <div
                            on:contextmenu|preventDefault={(e) => toggleNftRightClickMenu(e, nft, index + 1)}
                            on:mouseover={(e) => hoverNftRightClickMenu(e, nft, index + 1)}
                            on:mouseleave={(e) => rightClickMenuStore.clearIfNotVisible()}
                        >
                            <Nft
                                {nft}
                                on:dragstart={(e) => handleDragStart(e, nft, index + 1)}
                                on:dragend={handleDragEnd}
                                context={ItemContext.Bank}
                                onClickCallback={() => removeNftFromTab(nft, index + 1)}
                            />
                        </div>
                    {/each}
                </div>
            {/each}
        {:else}
            <div class="section">
                {#each tabs[selectedTab - 1] as nft (nft.nft_id)}
                    <div
                        on:contextmenu|preventDefault={(e) => toggleNftRightClickMenu(e, nft, -1)}
                        on:mouseover={(e) => hoverNftRightClickMenu(e, nft, -1)}
                        on:mouseleave={(e) => rightClickMenuStore.clearIfNotVisible()}
                    >
                        <Nft
                            {nft}
                            on:dragstart={(e) => handleDragStart(e, nft, selectedTab)}
                            on:dragend={handleDragEnd}
                            context={ItemContext.Bank}
                        />
                    </div>
                {/each}
            </div>
        {/if}

        <div class="respond" />
    </div>
</div>

<style lang="scss">
    $bg: rgba(17, 15, 28, 1);
    $shadow: transparentize($bg, 0.3);

    .bank-screen {
        display: flex;
        flex-direction: column;
        left: 0;
        right: 0;
        top: 6%;
        margin-left: auto;
        margin-right: auto;
        width: 65%;
        max-width: 835px;
        height: 80%;
        background-color: rgba(71, 71, 71, 1);
        color: white;
        border-radius: 8px;
        z-index: 99999;
        font-size: large;
        pointer-events: auto;
        border: 4px solid rgb(29, 29, 29);
        border-style: solid;
        border-width: 4px;
        border-radius: 6px;
    }

    .bank-net-worth {
        margin-top: 10px;
        font-size: 19px;
    }

    .close-button {
        width: 40px;
        height: 40px;
        margin-right: -28px;
        margin-top: -38px;
    }

    .bank-header {
        background-color: rgba(0, 0, 0, 1);
        min-height: 120px;
        color: white;
        display: flex;
        padding-top: 15px !important;
        justify-content: space-between;
        font-size: x-large;
        padding: 0 15px;
        border-radius: 8px 8px 0 0;
    }

    .tabs {
        display: flex;
        margin: -50px 0 0 20px;
        gap: 5px;
    }

    .tabIconContainer {
        width: 56px;
        height: 50px;
        padding: 8px;
        cursor: pointer;
        border-radius: 6px 6px 0px 0px;
        background-color: rgba(71, 71, 71, 1);
        border: solid rgba(0, 0, 0, 1);
    }

    .plus {
        font-family: "Press Start 2P";
        padding: 5px;
        cursor: pointer;
    }

    .bank-body {
        height: 100%;
        width: 100%;
        position: relative;
        padding: 10px;
        overflow-y: scroll;
    }

    .tabIcon {
        width: 34px;
        height: 34px;
        cursor: pointer;
    }

    .selected {
        background-color: rgba(71, 71, 71, 1);
        border-bottom: 0;
    }

    .section {
        display: grid;
        grid-template-columns: repeat(9, minmax(0, 1fr));
        justify-items: center;
        padding: 10px;
        text-shadow: 0 0 1px black, 0 0 1px black, 0 0 2px black, 0 0 2px black, 0 3px 3px black;
        user-select: none;
        border-bottom: 2px solid rgba(26, 26, 26, 0.6);
    }
</style>
