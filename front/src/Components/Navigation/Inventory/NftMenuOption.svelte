<script>
    import { getContext } from "svelte";
    import { key } from "./tokenMenu";

    export let isDisabled = false;
    export let text = "";

    import { createEventDispatcher } from "svelte";
    const dispatch = createEventDispatcher();

    const { dispatchClick } = getContext(key);

    const handleClick = () => {
        if (isDisabled) return;

        dispatch("click");
        dispatchClick();
    };
</script>

<div class:disabled={isDisabled} on:click={handleClick}>
    {#if text}
        {text}
    {:else}
        <slot />
    {/if}
</div>

<style>
    div {
        padding: 4px 25px 4px 15px;
        cursor: default;
        font-size: 20px;
        display: flex;
        align-items: center;
        grid-gap: 5px;
        color: black;
        background-color: white;
        border-radius: 6px;
    }
    div:hover {
        background: #0002;
    }
    div.disabled {
        color: #0006;
    }
    div.disabled:hover {
        background: white;
    }
</style>
