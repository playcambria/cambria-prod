<script lang="ts">
    import { GameItem } from "./types";

    export let gameItem: GameItem;
</script>

<div class="container" style={``}>
    <img src={gameItem.imageUrl} alt={gameItem.name} />
</div>

<style lang="scss">
    .container {
        position: relative;
        width: 66px;
        height: 66px;
        text-align: center;
        display: flex;
        justify-content: center;
        align-items: center;

        // Shadow Outline
        &:before {
            content: "";
            position: absolute;
            width: 66px;
            height: 66px;
            left: 0px;
            top: 0px;

            border-radius: 50%;
            box-shadow: inset 0 0 4px black;

            transition: all 0.1s cubic-bezier(0.075, 0.82, 0.165, 1);
        }

        // Hover Overlay
        &:hover {
            &:before {
                border-radius: 50%;
                box-shadow: inset 0 0 13px rgba(254, 166, 60, 0.9), inset 0 0 13px rgba(254, 166, 60, 0.6);
            }
        }

        // On-Click down effect
        &:active {
            opacity: 0.6;
            transition: all 0.1s cubic-bezier(0.075, 0.82, 0.165, 1);
        }
    }

    img {
        width: 40px;
        height: 40px;
        border-radius: 65px;
        //box-shadow: 0 0 4px rgba(0, 0, 0, 0.5), 0 0 4px rgba(0, 0, 0, 0.5), 0 0 5px rgba(0, 0, 0, 0.5), 0 0 5px rgba(0, 0, 0, 0.5), 0 0 3px rgba(0, 0, 0, 0.5), 0 0 3px rgba(0, 0, 0, 0.5);
    }
</style>
