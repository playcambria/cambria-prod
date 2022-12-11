<script>
    import { setContext, createEventDispatcher } from "svelte";
    import { fade } from "svelte/transition";
    import { key } from "./tokenMenu";

    export let x;
    export let y;

    // whenever x and y is changed, restrict box to be within bounds
    $: (() => {
        if (!menuEl) return;

        const rect = menuEl.getBoundingClientRect();
        x = Math.min(window.innerWidth - rect.width, x);
        if (y > window.innerHeight - rect.height) y -= rect.height;
    })(x, y);

    const dispatch = createEventDispatcher();

    setContext(key, {
        dispatchClick: () => dispatch("click"),
    });

    let menuEl;
    function onPageClick(e) {
        if (e.target === menuEl || menuEl.contains(e.target)) return;
        dispatch("clickoutside");
    }
</script>

<svelte:body on:click={onPageClick} />

<div class="menu" transition:fade={{ duration: 100 }} bind:this={menuEl} style="top: {y}px; left: {x}px;">
    <div class="menu-header">Choose Option</div>
    <slot />
</div>

<style>
    .menu {
        position: fixed;
        display: grid;
        border: 2px solid black;
        box-shadow: 2px 2px 5px 0px #0002;
        background: white;
        text-shadow: none;
        min-width: 55px;
        border-radius: 8px;
    }

    .menu-header {
        background-color: black;
        padding: 4px 22px 4px 14px;
        font-size: large;
        border-radius: 6px 6px 0px 0px;
    }
</style>
