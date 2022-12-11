<script lang="ts">
    import { fly } from "svelte/transition";
    import { errorScreenStore } from "../../Stores/ErrorScreenStore";
</script>

{#if $errorScreenStore}
    <main class="errorScreen" transition:fly={{ y: -200, duration: 500 }}>
        <div style="width: 90%;">
            <h2>Game Error!</h2>
        </div>
    </main>
{/if}

<style lang="scss">
    main.errorScreen {
        pointer-events: auto;
        width: 100%;
        background-color: #000000;
        color: #ffffff;
        text-align: center;
        position: absolute;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: center;
        height: 100%;
        top: 0;
        left: 0;
        right: 0;
        margin-left: auto;
        margin-right: auto;
        min-width: 300px;
        z-index: 700;
        overflow-y: scroll;
        padding: 20px 0;
        h2 {
            font-family: "Press Start 2P";
            padding: 5px;
            font-size: 30px;
        }
    }
</style>
