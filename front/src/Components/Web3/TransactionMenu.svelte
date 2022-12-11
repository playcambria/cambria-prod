<script lang="ts">
    import { fly } from "svelte/transition";
    import { transactionVisibilityStore, activeTransactionStore } from "../../Stores/TransactionStore";
    import { menuInputFocusStore } from "../../Stores/MenuStore";
    import { Transaction } from "../../Stores/TransactionStore";
    import { onDestroy, onMount } from "svelte";
    import type { Unsubscriber } from "svelte/store";

    import Wrap from "./Weth/Wrap.svelte";
    import Unwrap from "./Weth/Unwrap.svelte";

    let activeTransction: Transaction = $activeTransactionStore;
    let activeComponent: typeof Wrap | typeof Unwrap;
    let unsubscriberActiveTransactionStore: Unsubscriber;

    function closeTransaction() {
        transactionVisibilityStore.set(false);
    }

    function switchTransaction(txn: Transaction) {
        activeTransction = txn;
        switch (activeTransction) {
            case Transaction.unwrap:
                activeComponent = Unwrap;
                break;
            case Transaction.wrap:
                activeComponent = Wrap;
                break;
            default:
                closeTransaction();
                break;
        }
    }

    onMount(() => {
        unsubscriberActiveTransactionStore = activeTransactionStore.subscribe(() => {
            if (!$activeTransactionStore.includes(activeTransction)) {
                void switchTransaction($activeTransactionStore);
            }
        });
        menuInputFocusStore.set(true);
        switchTransaction($activeTransactionStore);
    });

    onDestroy(() => {
        if (unsubscriberActiveTransactionStore) {
            unsubscriberActiveTransactionStore();
        }
        menuInputFocusStore.set(false);
    });
</script>

<div class="menu-container-main">
    <div class="menu-submenu-container nes-container is-rounded" transition:fly={{ y: -1000, duration: 500 }}>
        <h1 class="header">{activeTransction === Transaction.unwrap ? "Unwrap ETH" : "Wrap ETH"}</h1>
        <button type="button" class="nes-btn is-error close" on:click={closeTransaction}>&times</button>
        <div class="transactionWrapper">
            <svelte:component this={activeComponent} />
        </div>
    </div>
</div>

<style lang="scss">
    @import "../../../style/breakpoints.scss";

    .nes-container {
        padding: 5% 20%;
    }

    .header {
        font-size: xx-large;
    }

    div.menu-container-main {
        --size-first-columns-grid: 200px;

        pointer-events: auto;
        height: 40%;
        width: 35%;
        top: 20%;

        text-align: center;

        left: 0;
        right: 0;
        margin-left: auto;
        margin-right: auto;

        position: absolute;
        z-index: 900;

        display: grid;

        // h2 {
        //     text-align: center;
        //     margin-bottom: 20px;
        // }

        .transactionWrapper {
            padding: 1rem;
        }

        div.menu-submenu-container {
            background-color: #333333;
            color: whitesmoke;

            .nes-btn.is-error.close {
                position: absolute;
                top: -20px;
                right: -20px;
            }
        }
    }

    @include media-breakpoint-up(md) {
        div.menu-container-main {
            --size-first-columns-grid: 120px;
            height: 50%;
            top: 55px;
            width: 30%;
            font-size: 0.5em;

            // div.menu-nav-sidebar {
            //     overflow-y: auto;
            // }

            div.menu-submenu-container {
                .nes-btn.is-error.close {
                    position: absolute;
                    top: -35px;
                    right: 0;
                }
            }
        }
    }
</style>
