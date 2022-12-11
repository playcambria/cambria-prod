<script lang="ts">
    // import { MathUtils } from "../../Utils/MathUtils";
    import { formatBalance } from "../../../Web3";
    import { Token } from "../../../Stores/InventoryTokens/Token";
    import { ItemContext } from "./types";

    import { CountUp } from "countup.js";
    import { onMount } from "svelte";
    import { getBalancePrecision } from "../../../Web3/utils/balances";

    export let inventoryToken: Token;

    // Is this a Token shown in a Trade Offer?
    export let context: ItemContext;

    let countUp: CountUp | null = null;

    function triggerAnimation(balance: string) {
        if (!countUp || isNaN(parseFloat(balance))) {
            return;
        }
        countUp.update(parseFloat(balance));
    }

    onMount(() => {
        countUp = new CountUp(`${inventoryToken.symbol}-balance`, 0, {
            decimalPlaces: getBalancePrecision(inventoryToken.symbol),
        });
    });

    let displayBalance = "...";
    $: {
        if (context === ItemContext.Inventory) {
            // if ($liveTokenBalance) {
            //     // console.log("$liveTokenBalance for", $liveTokenBalance, inventoryToken.symbol)
            //     displayBalance = formatBalance($liveTokenBalance, inventoryToken.decimals);
            //     triggerAnimation(displayBalance);
            // } else
            if (inventoryToken.balance) {
                displayBalance = formatBalance(inventoryToken.balance, inventoryToken.decimals);
                // console.log(displayBalance)
                triggerAnimation(displayBalance);
            }
        } else if (context === ItemContext.Offer) {
            // Should always use passed in balance
            displayBalance = inventoryToken.balance
                ? formatBalance(inventoryToken.balance, inventoryToken.decimals)
                : "~";
            triggerAnimation(displayBalance);
        } else if (context === ItemContext.Profile) {
            // ... do nothing
        } else {
            throw new Error("Missing Item Context on Token");
        }
    }
</script>

<div
    class="container"
    style={`visibility: ${inventoryToken?.balance?.isZero() ? "hidden" : "visible"}`}
>
    <img src={inventoryToken.image} alt={inventoryToken.symbol} />
    <div class="balance">
        {inventoryToken.balance ? formatBalance(inventoryToken.balance, inventoryToken.decimals) : ""}
    </div>
    <!-- id={`${inventoryToken.symbol}-balance`} /> -->
    <!-- <div class="balance" id={`${inventoryToken.symbol}-balance`} /> -->
    <div class="name">{inventoryToken.symbol.substr(0, 10)}</div>
</div>

<style lang="scss">
    .container {
        position: relative;
        width: 70px;
        height: 90px;
        margin: 2px 5%;

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

    // .container:hover {
    //     transform: translate(0, -0.525rem);
    //     transition: .3s all cubic-bezier(.4, 0, .2, 1);
    // }

    .balance {
        position: absolute;
        left: 0;
        top: 0;
        font-size: x-large;
        line-height: 14px;
    }

    .name {
        position: absolute;
        display: flex;
        width: 100%;
        justify-content: center;
        bottom: 0;
        font-size: large;
    }

    img {
        width: 64px;
        height: 65px;
        border-radius: 65px;
        //box-shadow: 0 0 4px rgba(0, 0, 0, 0.5), 0 0 4px rgba(0, 0, 0, 0.5), 0 0 5px rgba(0, 0, 0, 0.5), 0 0 5px rgba(0, 0, 0, 0.5), 0 0 3px rgba(0, 0, 0, 0.5), 0 0 3px rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
    }
</style>
