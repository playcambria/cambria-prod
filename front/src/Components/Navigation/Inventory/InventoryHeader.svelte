<script lang="ts">
    import IconButton from "../../IconButton.svelte";
    import { headerState, itemType, HeaderStates, ItemTypes, filterText } from "../../../Stores/InventoryStore";
    import { menuInputFocusStore } from "../../../Stores/MenuStore";
    import { Jumper } from "svelte-loading-spinners";
    import { walletLoading } from "../../../Stores/InventoryStore";

    function onFocus() {
        menuInputFocusStore.set(true);
    }

    function onBlur() {
        menuInputFocusStore.set(false);
    }
</script>

<!-- <div class="header-bar">
    <IconButton icon="arrow_back" on:click={() => ($headerState = HeaderStates.Toggle)} />
    <span class="header-bar-title"> Inventory</span>
</div> -->

<div class="inventory-header">
    {#if $headerState === HeaderStates.Toggle}
        <div class="toggle">
            <div class="buttons">
                <button
                    class:active={$itemType === ItemTypes.Tokens}
                    on:click={() => ($itemType = ItemTypes.Tokens)}
                    class="left"
                >
                    TOKENS
                </button>
                <button
                    class:active={$itemType === ItemTypes.Nfts}
                    on:click={() => ($itemType = ItemTypes.Nfts)}
                    class="middle"
                >
                    NFTS
                </button>
                <button
                    class:active={$itemType === ItemTypes.Game}
                    on:click={() => ($itemType = ItemTypes.Game)}
                    class="right"
                >
                    GAME
                </button>
            </div>
            <!-- <IconButton icon="search" on:click={() => ($headerState = HeaderStates.Search)} /> -->
        </div>
        {#if $walletLoading}
            <div style="position: absolute; right: 20px; top: 20px;">
                <Jumper size="26" color="#FF3E00" unit="px" duration="2s" />
            </div>
        {/if}
    {:else if $headerState === HeaderStates.Search}
        <div class="search">
            <IconButton icon="arrow_back" on:click={() => ($headerState = HeaderStates.Toggle)} />
            <input
                type="search"
                class="searchInput"
                bind:value={$filterText}
                placeholder="Search..."
                on:focus={onFocus}
                on:blur={onBlur}
            />
        </div>
    {/if}
</div>

<style lang="scss">
    // .header-bar {
    //     display: flex;
    //     gap: 10px;
    //     width: 100%;
    //     align-items: center;
    //     justify-content: space-between;
    //     padding: 8px 16px;
    //     background-color: rgba(17, 15, 28, 0.9);
    //     .header-bar-title {
    //         font-size: x-large;
    //     }
    // }
    .inventory-header {
        display: flex;
        width: 100%;
        padding: 25px 18px;
        margin-bottom: 8px;
        margin-top: 5px;
        height: 60px;
        font-size: x-large;
    }
    .toggle {
        display: flex;
        width: 100%;
    }

    button {
        border: 1px solid rgba(0, 0, 0, 1);
        background-color: rgba(17, 15, 28, 0.4);
        color: rgba(255, 255, 255, 0.6);
        height: 35px;
        font-size: large;
        transition: color 0.2s;

        &:hover {
            color: white;
            background-color: rgba(17, 15, 28, 0.6);
        }
    }

    button.active {
        background-color: black;
        color: white;
    }

    .buttons {
        display: flex;
        gap: 0;
        width: 100%;
        align-items: center;
    }

    button.left {
        border-top-left-radius: 8px;
        border-bottom-left-radius: 8px;
        min-width: 30px;
        width: 80px;
    }

    button.middle {
        min-width: 30px;
        width: 80px;
    }

    button.right {
        border-top-right-radius: 8px;
        border-bottom-right-radius: 8px;
        min-width: 30px;
        width: 80px;
    }

    .search {
        display: flex;
        gap: 10px;
        width: 100%;
        align-items: center;
    }

    .searchInput {
        width: 100%;
        height: 40px;
        border-radius: 5px;
        padding: 0 10px;
        font-size: x-large;
        text-shadow: none;
    }
</style>
