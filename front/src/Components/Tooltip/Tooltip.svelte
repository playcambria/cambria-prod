<script>
    export let title = "";
    let isHovered = false;
    let x;
    let y;

    function mouseOver(event) {
        isHovered = true;
        x = event.pageX + 5;
        y = event.pageY - 45;
    }
    function mouseMove(event) {
        x = event.pageX + 5;
        y = event.pageY - 45;
    }
    function mouseLeave() {
        isHovered = false;
    }
</script>

<div on:mouseover={mouseOver} on:focus={mouseOver} on:mouseleave={mouseLeave} on:mousemove={mouseMove} on:click>
    <slot />
</div>

{#if isHovered}
    <div style="top: {y}px; left: {x}px;" class="tooltip">{title}</div>
{/if}

<style lang="scss">
    @keyframes fadeIn {
        0% {
            opacity: 0;
        }
        100% {
            opacity: 1;
        }
    }
    .tooltip {
        border-radius: 4px;
        padding: 4px;
        position: fixed;
        animation: fadeIn 0.3s;
    }
</style>
