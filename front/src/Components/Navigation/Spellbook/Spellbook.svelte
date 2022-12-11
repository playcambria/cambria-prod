<script lang="ts">
    import placeholderSpellbook from "/resources/navigation/magic/placeholder.png";
    export let visible = false;
</script>

<div class="spellbook" style={`display: ${(visible) ? 'flex' : 'none'}`}>
    <img src={placeholderSpellbook} alt="placeholder" style="width: 100%;" />
</div>

<style lang="scss">
    .spellbook {
        height: 100%;
        width: 100%;
        opacity: 0.4;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: flex-start;
        padding: 10%;
    }
</style>
