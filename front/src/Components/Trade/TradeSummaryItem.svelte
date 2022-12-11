<script lang="ts">
    import { isNftType, isTokenType } from "./utils";
    import { formatBalance } from "../../Web3";
    import verifiedIcon from "/resources/icons/verified.png";
    import { Token } from "../../Stores/InventoryTokens/Token";
    import { Nft } from "../../Components/Navigation/Inventory/types";

    export let item: Nft | Token;
</script>

<div>
    {#if isNftType(item)}
        {item.name}
        {#if item.verified}
            <img src={verifiedIcon} alt="verified" style="width: 15px; height: 15px; margin-bottom: 4px;" />
        {/if}
    {:else if isTokenType(item)}
        {formatBalance(item.balance, item.decimals)} {item.name}
    {/if}
</div>
