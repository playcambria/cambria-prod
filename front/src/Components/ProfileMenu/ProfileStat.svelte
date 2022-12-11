<script lang="ts">
    export let amount: number;
    export let decimal = 0;
    export let unit: string;
    export let title: string;
</script>

<div class="stat">
    <div class="value">
        <span>{amount ? Number(amount).toFixed(decimal) : 0}</span>
        <span>{unit}</span>
    </div>
    <div class="title">
        <span style="font-size: 20px;">{title}</span>
    </div>
</div>

<style lang="scss">
    .stat {
        display: flex;
        flex-direction: column;
        padding: 0 20px 0 0;
        min-width: 110px;
    }

    h1, span {
        padding: 0 4px;
    }

    .value {
        display: flex;
        font-size: xx-large;
        height: 30px;
    }

    .title {
        font-size: large;
        color: #bbbbbb;
    }
</style>
