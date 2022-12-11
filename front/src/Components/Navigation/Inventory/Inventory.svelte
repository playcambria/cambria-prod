<script>
    import InventoryHeader from "./InventoryHeader.svelte";
    import InventoryContent from "./InventoryContent.svelte";
    import { onBlockStore } from "../../../Stores/BlockStore";
    import { showTradeScreen, activeTradeStore } from "../../../Stores/TradeStore";
    import { Diamonds } from "svelte-loading-spinners";

    $onBlockStore; // needs to be init'd

    export let visible = true;
</script>

<div class="inventory" style={`display: ${visible ? "flex" : "none"}`}>
    {#if $activeTradeStore && !$showTradeScreen}
        <div class="pending" on:click={() => showTradeScreen.set(true)}>Pending Trades (1)</div>
    {/if}
    <InventoryHeader />
    <InventoryContent />
</div>

<style lang="scss">
    .inventory {
        height: 100%;
        width: 100%;
        display: flex;
        flex-direction: column;
    }

    .pending {
        background-color: #ec9c00;
        color: black;
        padding: 0 15px;
        border-radius: 5px;
        font-size: 28px;
        font-weight: 500;
        cursor: pointer;
    }
</style>
