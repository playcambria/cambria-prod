<script lang="ts">
    export let dark = false;
    export let active = true;
    export let icon: string;
    export let size: number = 24;
</script>

<span
    on:click
    class:md-inactive={!active}
    class:md-dark={dark}
    class:md-light={!dark}
    class="material-icons buttonContainer"
    style={`font-size: ${size}px!important;`}>{icon}</span
>

<style lang="scss">
    .buttonContainer {
        display: flex;
        align-items: center;
        height: 100%;
        cursor: pointer;
    }
</style>
