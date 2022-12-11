<script lang="ts">
    import { Nft as NftType } from "../Navigation/Inventory/types";
    import Nft from "../Navigation/Inventory/Nft.svelte";
    import { ItemContext } from "../Navigation/Inventory/types";
    import Token from "../Navigation/Inventory/Token.svelte";
    import { Token as TokenType } from "../../Stores/InventoryTokens/Token";
    import { isNftType, isTokenType } from "./utils";
    import { activeTradeStore } from "../../Stores/TradeStore";
    import { RightClickMenuAction, rightClickMenuStore } from "../../Stores/RightClickMenuStore";
    import { ActionsMenuAction } from "../../Stores/ActionsMenuStore";
    import { ethers } from "ethers";
    import { textInputPromptStore } from "../../Stores/TextInputAreaStore";

    export let isMyOffer: boolean;
    export let tradeAccount: string;
    export let offer: Array<NftType | TokenType> | undefined;

    let activeToken: TokenType | null = null;

    const onAmountInput = (amount: string) => {
        if (activeToken && activeToken.balance && activeToken.decimals) {
            // Current Token Balance in Offer
            const offerBalance = activeToken.balance;

            // Amount to remove from trade
            let removeBalance = ethers.utils.parseUnits(amount.toString(), activeToken.decimals);

            // If the input value is bigger than current offer amount, we should directly remove item from offer
            if (removeBalance.gte(offerBalance)) {
                return onRemoveAll(activeToken);
            }

            activeTradeStore.removeAmountFromTokenInTrade(activeToken, removeBalance);
            activeToken = null;
        } else {
            // handle missing decimals case
        }
    };

    function onRemoveX(token: TokenType) {
        // Open Text Input Menu
        textInputPromptStore.initialize("Enter amount:", onAmountInput);
        activeToken = { ...token }; // must create new instance
    }

    function onRemoveAll(token: TokenType) {
        // Remove token from offer
        activeTradeStore.removeTokenFromTrade(token);
        activeToken = null;
    }

    $: offerParsed = offer
        ? offer.map((i) => {
              if (Object.prototype.hasOwnProperty.call(i, "nft_id")) {
                  return i as NftType;
              } else {
                  // Probably a Token
                  return i as TokenType;
              }
          })
        : [];

    function toggleTokenRightClickMenu(e: MouseEvent, token: TokenType | NftType): void {
        if (isTokenType(token)) {
            const actions = getTokenRightClickMenuActions(token);
            rightClickMenuStore.showMenu(e.clientX, e.clientY, actions.length, true);
        }
    }

    function hoverTokenRightClickMenu(e: MouseEvent, token: TokenType | NftType): void {
        if (isTokenType(token)) {
            const actions = getTokenRightClickMenuActions(token);
            rightClickMenuStore.initialize(e.clientX, e.clientY, actions.length, true);
            for (const action of actions) {
                rightClickMenuStore.addAction(action);
            }
        }
    }

    function getTokenRightClickMenuActions(token: TokenType): RightClickMenuAction[] {
        const actions: ActionsMenuAction[] = [];
        if (isMyOffer) {
            actions.push({
                actionName: `Remove-X`,
                actionContext: token.symbol,
                protected: true,
                priority: 3,
                callback: () => {
                    onRemoveX(token);
                    rightClickMenuStore.clear();
                },
            });
            actions.push({
                actionName: `Remove-All`,
                actionContext: token.symbol,
                protected: true,
                priority: 3,
                callback: () => {
                    onRemoveAll(token);
                    rightClickMenuStore.clear();
                },
            });
        }
        actions.push({
            actionName: `Examine`,
            actionContext: token.symbol,
            protected: true,
            disabled: true,
            priority: 3,
            callback: () => {
                console.log({ token });
                rightClickMenuStore.clear();
            },
        });

        return actions;
    }
</script>

<div class="trade-offer">
    <div class="offer-header">
        <h4 class="title">{isMyOffer ? "Your" : `${tradeAccount}'s`} Offer</h4>
    </div>
    <div class="offer-body grid-container">
        {#each offerParsed as token, i (i)}
            {#if isNftType(token)}
                <Nft nft={token} hide={false} context={ItemContext.Offer} />
            {:else if isTokenType(token)}
                <div 
                    on:contextmenu|preventDefault={(e) => toggleTokenRightClickMenu(e, token)}
                    on:mouseover={e => hoverTokenRightClickMenu(e, token)}
                    on:mouseleave={e => rightClickMenuStore.clearIfNotVisible()}
                    on:click={e => rightClickMenuStore.triggerDefault()}
                >
                    <Token
                        inventoryToken={token}
                        context={ItemContext.Offer}
                    />
                </div>
            {/if}
        {/each}
    </div>
</div>

<style lang="scss">
    .title {
        font-size: 22px;
    }
    .trade-offer {
        display: flex;
        flex-direction: column;
        width: 100%;
    }
    .offer-header {
        display: flex;
        justify-content: center;
        color: white;
    }
    .offer-body {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        width: 100%;
    }
</style>
