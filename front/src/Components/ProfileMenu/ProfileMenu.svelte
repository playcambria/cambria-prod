<script lang="ts">
    /* eslint-disable @typescript-eslint/no-explicit-any */
    import { getStats } from "../../Api/ModuleNFT.xyz";
    import { getNftCollections } from "../../Api/N.xyz";
    import { getPoaps } from "../../Api/Poap";
    import { shownProfileStore } from "../../Stores/ProfileStore";
    import { getPfpUrl } from "../../Supabase/user";
    import ProfileStat from "./ProfileStat.svelte";
    import twitterIcon from "/resources/icons/icon_twitter.png";
    import Nft from "../Navigation/Inventory/Nft.svelte";
    import { ItemContext } from "../Navigation/Inventory/types";
    import { fly } from "svelte/transition";

    let pfpPromise = getPfpUrl($shownProfileStore?.walletAddress || "");

    let popularNftCollections: any = [];
    let poapEvents: any[] = [];
    let userStats: any = {};

    getNftCollections($shownProfileStore?.walletAddress || "")
        .then((nfts) => {
            nfts.sort((a: any, b: any) => {
                if (a.collection.openSeaCollectionVerified && !b.collection.openSeaCollectionVerified) return -1;
                if (b.collection.openSeaCollectionVerified && !a.collection.openSeaCollectionVerified) return 1;

                if (a.collection?.floorPrice && !b.collection?.floorPrice) return -1;
                if (b.collection?.floorPrice && !a.collection?.floorPrice) return 1;

                if (!a.collection?.floorPrice && !b.collection?.floorPrice) return 0;

                if (a.collection.floorPrice.tokenValue > b.collection.floorPrice.tokenValue) return -1;
                if (a.collection.floorPrice.tokenValue < b.collection.floorPrice.tokenValue) return 1;
                return 0;
            });

            popularNftCollections = nfts;
        })
        .catch((err) => console.error(err));
    getPoaps($shownProfileStore?.walletAddress || "")
        .then((data) => {
            poapEvents = data ? data.slice(0, 8) : [];
        })
        .catch((err) => console.error(err));

    getStats($shownProfileStore?.walletAddress || "")
        .then(({ data }) => {
            userStats = data;
        })
        .catch((err) => console.error(err));

    const getIconUrl = (pfp_url: string) => {
        // try to parse
        try {
            return JSON.parse(pfp_url);
        } catch (e) {
            console.error(e);
            return null;
        }
    };
</script>

<div class="profile-menu" transition:fly={{ y: -50, duration: 500 }}>
    <div class="header">
        <div class="image">
            {#await pfpPromise then { data }}
                {#if data?.pfp_url && getIconUrl(data?.pfp_url)}
                    <Nft nft={getIconUrl(data?.pfp_url)} context={ItemContext.Profile} />
                {:else}
                    <div />
                {/if}
            {/await}
        </div>
        <div class="header-content">
            <div class="header-content-name">
                {$shownProfileStore?.playerName}
            </div>
            <div class="header-content-twitter">
                <img src={twitterIcon} alt="twitter" style="width: 16px; height: 16px" />
                <span style="padding-left: 4px; opacity: 0.6;">(not linked)</span>
            </div>
        </div>
        <button class="nes-btn is-error close-button" on:click={() => shownProfileStore.set(null)}>X</button>
    </div>
    <div class="body">
        <div class="body-content">
            <div class="level-box">
                <div class="level">Level 13 - NFT Trader (top 1%)</div>
            </div>
            <div class="container">
                <div class="text">Collections owned</div>
                <div class="collections-content">
                    <div class="collection-images">
                        {#each popularNftCollections.slice(0, 3) as nft}
                            <img
                                src={nft?.collection?.logoImage?.URI}
                                class="collection-image"
                                alt={nft?.collection?.name}
                            />
                        {/each}
                    </div>
                    <div class="collection-titles">
                        {#each popularNftCollections.slice(0, 3) as nft}
                            {nft.collection.name},
                        {/each}
                        {#if popularNftCollections.length > 3}
                            and {popularNftCollections.length - 3} more
                        {/if}
                    </div>
                </div>
            </div>
            <div class="container">
                <div class="text">Badges (POAP)</div>
                <div class="achievement-images">
                    {#each poapEvents.slice(0, 8) as poapEvent}
                        <img src={poapEvent.event.image_url} class="achievement-image" alt={poapEvent.event.name} />
                    {/each}
                </div>
            </div>
            <div class="container">
                <div class="text">Stats</div>
                <div class="stats">
                    <div class="row">
                        <ProfileStat amount={userStats.total_buy_volume} decimal={2} unit="ETH" title="Buy Volume" />
                        <ProfileStat amount={userStats.total_buy_qty} unit="" title="NFTs Bought" />
                        <ProfileStat amount={userStats.mint_count} unit="" title="NFTs Minted" />
                    </div>
                    <div class="row">
                        <ProfileStat amount={userStats.total_sell_volume} decimal={2} unit="ETH" title="Sell Volume" />
                        <ProfileStat amount={userStats.total_sell_qty} unit="" title="NFTs Sold" />
                        <ProfileStat
                            amount={userStats.total_mint_gas_eth}
                            decimal={2}
                            unit="ETH"
                            title="Mint Gas Costs"
                        />
                    </div>
                    <!-- {#each userStats as userStat}
                        <div>{userStat}</div>
                    {/each} -->
                </div>
            </div>
            <div class="container">
                <div class="text">Activity</div>
                <div class="achievement-images">Coming soon...</div>
            </div>
        </div>
    </div>
    <!-- <div class="footer">
        <div class="footer-content">
            <button class="nes-btn is-primary buttons">View Inventory</button>
            <button class="nes-btn is-primary buttons">Add as Friend</button>
        </div>
    </div> -->
</div>

<style lang="scss" scoped>
    div {
        display: flex;
    }

    .profile-menu {
        display: flex;
        flex-direction: column;
        left: 0;
        right: 0;
        top: 4%;
        margin-left: auto;
        margin-right: auto;
        width: 450px;
        height: 600px;
        background-color: rgba(17, 15, 28, 1);
        color: white;
        border-radius: 8px;
        border: 3px solid black;
        font-size: large;
        pointer-events: auto;
        z-index: 3;
    }

    .body {
        height: 100%;
        padding: 0 12px;
    }

    .level {
        font-size: 24px;
    }

    .header,
    .footer {
        width: 100%;
    }

    .image {
        padding: 20px;
    }

    .header-content {
        padding: 20px 10px;
        justify-content: flex-start;
        text-align: center;
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: center;
        height: 80px;
        margin-top: 20px;
    }

    .header-content-name {
        font-size: 36px;
        line-height: 36px;
    }

    .header-content-twitter {
        font-size: 16px;
        line-height: 16px;
    }

    .body-content {
        padding: 0px 10px 10px 10px;
        display: flex;
        flex-direction: column;
        width: 100%;
    }

    .footer-content {
        justify-content: space-around;
    }

    .buttons {
        height: 50px;
        margin: 15px;
    }

    .close-button {
        width: 40px;
        height: 40px;
        margin-right: -10px;
        margin-top: -10px;
    }

    .container {
        display: flex;
        flex-direction: column;
        width: 100%;
        margin-top: 5px;
        margin-bottom: 10px;
    }

    .text {
        text-transform: uppercase;
        opacity: 0.78;
    }

    .achievement-images {
        display: flex;
        margin-top: 4px;
        gap: 8px;
    }
    .achievement-image {
        width: 40px;
        height: 40px;
    }

    .collections-content {
        display: flex;
    }

    .collection-titles {
        margin-left: 40px;
        display: flex;
        justify-content: center;
        align-items: center;
    }
    .collection-image {
        width: 60px;
        height: 60px;
        margin-right: -20px;
        border-radius: 100%;
    }

    .stats {
        display: flex;
        flex-direction: column;
    }

    .row {
        display: flex;
        padding: 0 0px;
    }
</style>
