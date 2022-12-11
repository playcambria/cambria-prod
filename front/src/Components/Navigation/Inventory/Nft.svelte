<script lang="ts">
    import tooltipBorder from "/resources/borders/tooltip-border.webp";
    import tooltipBorderRare from "/resources/borders/tooltip-border-rare.png";
    import itemPlaceholder from "/resources/icons/item_placeholder.jpg";
    import warningIcon from "/resources/icons/warning_filled.png";
    import polygonIcon from "/resources/icons/polygon.png";
    import verifiedIcon from "/resources/icons/verified.png";

    import { formatApiCurrency, toApiCurrency } from "../../../Utils/Currency";
    import { Nft as NftType, ItemContext } from "./types";

    import { activeTradeStore, showTradeScreen } from "../../../Stores/TradeStore";
    import { inventoryNFTIdsState } from "../../../Stores/InventoryStore";
    import { showBankScreen } from "../../../Stores/BankStore";
    import { setInventoryNfts } from "../../../Supabase/user";

    import { gameManager } from "../../../Phaser/Game/GameManager";
    import { rightClickMenuStore } from "../../../Stores/RightClickMenuStore";

    import { chatMessagesStore } from "../../../Stores/ChatStore";

    import { collectionMetadata } from "../../../Stores/InventoryStore";

    import { lazyLoad } from "./LazyLoad";

    const gameScene = gameManager.getCurrentGameScene();

    // Data for this NFT
    export let nft: NftType;

    // Is this an NFT shown in a Trade Offer? if false, it is an NFT shown in the Inventory
    export let context: ItemContext;

    export let onClickCallback: () => void = () => {};

    // Image and warning sizes, both width and height
    $: size = context === ItemContext.Bank ? 76 : 76;
    $: warningSize = context === ItemContext.Bank ? 30 : 30;

    // If this is an NFT shown in the Inventory, are we hiding / disabling it from view? (because its in a Trade Offer)
    export let hide = false;

    $: setInventoryNfts($inventoryNFTIdsState);

    // Rarity of the item (TODO: get from traits)
    const quality = "rare";

    // Hover Tooltip State
    let isHovered = false;
    let x: number;
    let y: number;

    let verified = false;
    $: if ($collectionMetadata && nft && nft.contractAddress) {
        const matchData = $collectionMetadata.get(nft.contractAddress);
        if (matchData?.openSeaCollectionVerified) {
            verified = true;
        }
    }

    function mouseClick(_ev: MouseEvent) {
        console.log("CLICK WITH CONTEXT", ItemContext, $activeTradeStore);
        console.log("CLICK")
        if (context === ItemContext.Inventory) {
            if (!$activeTradeStore) {
                rightClickMenuStore.triggerDefault();
            } else {
                // Clicking on NFT in Trade -> Add Item to Trade
                // Exclusions (hidden NFT - already in trade) + (ERC1155's - TODO: FIX THIS)
                if (hide === false) {
                    if (nft.type === "ERC1155") {
                        chatMessagesStore.addTradeDeclineMessage(
                            $activeTradeStore?.counterparty.userId ?? 0,
                            `[Trade] ERC-1155's are currently disabled for trading.`
                        );
                    } else {
                        activeTradeStore.addItemToTrade(nft);
                    }
                }
            }
            if ($showBankScreen) {
                inventoryNFTIdsState.update((nfts) => nfts.filter((nftId) => nftId !== nft.nft_id));
                gameScene.playSound("chat-message");
            }
        } else if (context === ItemContext.Offer) {
            // remove from trade
            if (nft.tokenId) {
                activeTradeStore.removeNftFromTrade(nft);
            }
        } else if (context === ItemContext.Profile) {
            // TODO: do something when nft is clicked on profile
        } else if (context === ItemContext.Bank) {
            inventoryNFTIdsState.update((nfts) => [...nfts, nft.nft_id]);
            gameScene.playSound("chat-message-reversed");
            onClickCallback();
        } else {
            throw new Error("Nft Item Context is null or unrecognized");
        }
    }

    // Hover Tooltip Events
    function mouseOver(ev: MouseEvent) {
        // Don't show tooltip if we're hovering over an item in Inventory, while a trade window is up
        if (!$showTradeScreen || context === ItemContext.Offer) {
            // if (context === ItemContext.Inventory && $showBankScreen === true) {
            //     return;
            // }
            gameScene.playSound("hover");
            isHovered = true;
            x = ev.clientX;
            y = ev.clientY;
        }
    }
    function mouseMove(ev: MouseEvent) {
        // Don't show tooltip if we're hovering over an item in Inventory, while a trade window is up
        if (!$showTradeScreen || context === ItemContext.Offer) {
            // if (context === ItemContext.Inventory && $showBankScreen === true) {
            //     return;
            // }
            isHovered = true;
            x = ev.clientX;
            y = ev.clientY;
        }
    }
    function mouseLeave(ev: MouseEvent) {
        isHovered = false;
        x = ev.clientX;
        y = ev.clientY;
    }
    function mouseFocus(ev: FocusEvent) {
        console.log(!!ev.target);
    }

    function shortenName(input: string, charLimit: number) {
        if (!input || !charLimit) {
            return "";
        }
        const overLength = input.length > charLimit;
        return overLength ? `${input.slice(0, charLimit)}...` : input;
    }

    function getItemColor(isRare: boolean) {
        return isRare ? "#ff8000" : "#fff";
    }

    function getBorder(isRare: boolean) {
        return isRare ? tooltipBorderRare : tooltipBorder;
    }

    function getOpacity(hide: boolean, isSpam: boolean) {
        if (hide) {
            return 0;
        } else {
            if (isSpam) {
                return 0.5;
            } else {
                return 1;
            }
        }
    }

    function isSpam(spam_score: number | null | undefined) {
        if (typeof spam_score === "undefined" || spam_score === null || spam_score > 20) {
            return true;
        } else {
            return false;
        }
    }
</script>

<div
    class="container"
    on:mouseover={mouseOver}
    on:mouseleave={mouseLeave}
    on:mousemove={mouseMove}
    on:focus={mouseFocus}
    on:click={mouseClick}
    draggable={context === ItemContext.Bank}
    on:dragstart
    on:dragend
    style="width: {size}px; height: {size}px; border: 4px solid; background-color: black; border-image: url({getBorder(
        (verified || nft?.verified)
    )}) 3 repeat; border-radius: 4px; opacity: {getOpacity(hide, isSpam(nft.collection?.spam_score))}"
>
    <img
        style="position: absolute; top: -2px; width: 72px; height: 72px; border-radius: 5px; opacity: 1"
        alt="nft"
        use:lazyLoad={(nft?.iconUrl) ? nft?.iconUrl : itemPlaceholder}
    />
    {#if isSpam(nft.collection?.spam_score)}
        <img
            style="position: absolute; left: 20px; top: 20px; width: {warningSize}px; height: {warningSize}px; opacity: 1"
            alt="warning"
            src={warningIcon}
        />
    {/if}
    {#if nft.chainId === 137}
        <img
            style="position: absolute; right: 4px; top: 4px; width: 20px; height: 20px; opacity: 1"
            alt="warning"
            src={polygonIcon}
        />
    {/if}
    {#if nft?.owner_count && nft?.owner_count > 1}
        <div class="name" style="font-size: 16px">
            {`[${nft.balance.toString()}/${nft?.collection?.total_quantity}]`}
        </div>
    {/if}
</div>

<aside
    class="tooltip-item {isHovered ? '' : 'hidden'}"
    data-quality={{ quality }}
    id={nft.nft_id}
    style={`${
        context === ItemContext.Profile || context === ItemContext.Bank || context === ItemContext.Offer
            ? `top: ${y + 15}px;`
            : `bottom: ${window.innerHeight - y + 15}px;`
    } ${
        context === ItemContext.Profile || context === ItemContext.Bank ? `left: ${x + 40}px` : `left: ${x - 325}px`
    }; border-image: url(${tooltipBorder}) 3 repeat;`}
>
    <header class="tooltip-item__header">
        {#if nft.collection.name === "Moonbirds"}
            <p class="header__equipped">(Currently Equipped)</p>
        {/if}
        <div class="header__title" style={`color: ${getItemColor((verified || nft?.verified))}`}>
            {shortenName(nft.collection.name, 19)}
            {#if (verified || nft?.verified)}
                <img src={verifiedIcon} alt="verified" style="width: 15px; height: 15px; margin-bottom: 4px;" />
            {/if}
        </div>
        <div class="header__title__sub">{shortenName(nft.name, 25)}</div>
    </header>

    {#if nft?.owner_count && nft?.owner_count > 1}
        <section class="tooltip-item__section">
            {#if nft?.last_sale?.total_price}
                <p style="">
                    Number of Items Owned - {nft?.balance.toString()} of {nft?.collection?.total_quantity}
                </p>
            {/if}
        </section>
    {/if}

    {#if nft.last_sale || (nft?.collection?.floor_prices && nft?.collection?.floor_prices.length > 0)}
        <section class="tooltip-item__section">
            {#if nft?.last_sale?.total_price}
                <p style="color: #f4d403;">
                    Last Sale - {nft.last_sale
                        ? formatApiCurrency(nft.last_sale.total_price.toString(10), toApiCurrency("ETH"))
                        : "???"}
                </p>
            {/if}
            {#if nft?.collection?.floor_prices && nft?.collection?.floor_prices.length > 0}
                <p style="color: #f4d403;">
                    Collection Floor - {nft?.collection?.floor_prices && nft?.collection?.floor_prices.length > 0
                        ? formatApiCurrency(nft.collection.floor_prices[0].value.toString(10), toApiCurrency("ETH"))
                        : "???"}
                </p>
            {/if}
        </section>
    {/if}

    {#if nft.extra_metadata && nft.extra_metadata.attributes && nft.extra_metadata.attributes.length > 0}
        <div class="tooltip-item__traits">
            {#each nft.extra_metadata.attributes.slice(0, 15) as attribute}
                <section class="tooltip-item__type">
                    <p class="type__slot">{attribute.trait_type}:</p>
                    <p class="type__item">{attribute.value}</p>
                </section>
            {/each}
        </div>
    {/if}
</aside>

<style lang="scss">
    // Variables
    $border: #a7a7ad;
    $bg: rgba(17, 15, 28, 0.86);
    $shadow: transparentize($bg, 0.3);
    $gap: 4px;

    // Item Value (Rarity)
    $crafting: #f4d403;
    $trash: #999;
    $common: white;
    $uncommon: #24ee10;
    $rare: #0070dd;
    $epic: #ad23ed;
    $legendary: #fa7c18;

    // Item Container
    .container {
        position: relative;
        margin: 4px 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        border-style: solid;
        border-width: 4px;
        border-radius: 8px;
        background-repeat: no-repeat;
        background-size: cover;
        color: white;
        background-color: $bg;
        font-size: 20px;
        font-weight: normal;
        box-shadow: -1px -1px 1px $shadow, -1px 1px 1px $shadow, 1px 1px 1px $shadow, 1px -1px 1px $shadow;
        opacity: 1;

        transition: opacity 0.05s ease-out 0.05s, transform 0.1s ease-out 0.05s;

        // Item Stackable (Amount)
        // .stack {
        //     color: white;
        //     font-size: 13px;
        //     font-style: normal;
        //     text-align: right;

        //     text-shadow: 0 0 2px black, 0 0 2px black, 0 0 3px black, 0 0 3px black, 0 0 1px black, 0 0 1px black;

        //     position: absolute;
        //     right: -1px;
        //     bottom: -4px;
        // }

        // Shadow Outline
        &:after {
            content: "";
            position: absolute;
            left: -4px;
            top: -4px;

            width: 76px;
            height: 76px;

            border-radius: 12px;
            box-shadow: inset 0 0 4px black;
        }

        // Hover Overlay
        &:hover {
            &:after {
                border-radius: 8px;
                opacity: 1;
                box-shadow: inset 0 0 13px rgba(254, 166, 60, 0.9), inset 0 0 13px rgba(254, 166, 60, 0.6) !important;
            }
        }

        // On-Click down effect
        &:active {
            opacity: 0.6 !important;
            transition: all 0.1s cubic-bezier(0.075, 0.82, 0.165, 1);
        }
    }

    .header__equipped {
        color: #adacac;
    }

    .tooltip-item {
        position: fixed;

        color: white;
        background-color: $bg;

        padding: 0.2em 0.6em;
        z-index: 9999999;
        font-size: large;

        box-shadow: -1px -1px 1px $shadow, -1px 1px 1px $shadow, 1px 1px 1px $shadow, 1px -1px 1px $shadow;

        min-width: 290px;
        width: 290px;

        z-index: 9999999999999;

        transition: opacity 0.05s ease-out 0.05s, transform 0.1s ease-out 0.05s;

        &.hidden {
            visibility: hidden;
            opacity: 0;
            transform: scale(0.9);
            transition: opacity 0.1s ease-out 0.1s, transform 0.1s ease-out 0.05s, visibility 0.01s linear 0.15s;
        }

        border-style: solid;
        border-width: 5px;
        border-radius: 8px;

        p {
            padding: 0;
            margin: 0;
        }

        &[data-quality="crafting"] {
            .header__title {
                color: $crafting;
            }
        }
        &[data-quality="trash"] {
            .header__title {
                color: $trash;
            }
        }
        &[data-quality="common"] {
            .header__title {
                color: $common;
            }
        }
        &[data-quality="uncommon"] {
            .header__title {
                color: $uncommon;
            }
        }
        &[data-quality="rare"] {
            .header__title {
                color: $rare;
            }
        }
        &[data-quality="epic"] {
            .header__title {
                color: $epic;
            }
        }
        &[data-quality="legendary"] {
            .header__title {
                color: $legendary;
            }
        }
    }

    .tooltip-item__traits {
        margin-top: $gap;
    }

    .tooltip-item__header {
        margin-bottom: 1px;
        .header__title {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 0px;
            padding-bottom: 0px;
            line-height: x-large;
            margin-top: 1px;
        }
        .header__title__sub {
            margin-top: 0px;
            padding-top: 0px;
            margin-bottom: 1px;
            line-height: x-large;
            font-size: x-large;
            font-weight: 400;
        }
    }

    .tooltip-item__section {
        margin-bottom: $gap;
        p {
            font-size: large;
            font-weight: 400;
        }
    }

    .tooltip-item__type {
        overflow: hidden;
        margin-top: 0px;

        .type {
            &__slot,
            &__item {
                float: left;
            }

            &__item {
                float: right;
                text-align: right;
            }
        }
    }

    .tooltip-item__traits {
        overflow: hidden;
    }
</style>
