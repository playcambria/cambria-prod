<script lang="ts">
    import placeholderEquipment from "/resources/navigation/equipment/placeholder.png";
    export let visible = false;
</script>

<div class="equipment" style={`display: ${(visible) ? 'flex' : 'none'}`}>
    <img src={placeholderEquipment} alt="placeholder" style="width: 100%;" />
    <span style="color: white; font-size: 16px; opacity: 0.78;">(No items equipped)</span>
</div>

<style lang="scss">
    .equipment {
        height: 100%;
        width: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding: 10%;
    }
</style>
