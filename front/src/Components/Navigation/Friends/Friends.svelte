<script lang="ts">
    import { ActionsMenuAction } from "../../../Stores/ActionsMenuStore";
    import { friendsListStore } from "../../../Stores/FriendsStore";
    import { RightClickMenuAction, rightClickMenuStore } from "../../../Stores/RightClickMenuStore";
    import { removeFriend } from "../../../Supabase/friends";
    import { shortenAddress } from "../../../Web3";

    export let visible = false;

    function getRightClickMenuActions(walletAddress: string): RightClickMenuAction[] {
        const actions: ActionsMenuAction[] = [];

        // Send PM
        actions.push({
            actionName: `Send a DM`,
            actionContext: "",
            protected: true,
            disabled: true,
            priority: 3,
            callback: () => {
                rightClickMenuStore.clear();
            },
        });

        // Remove Friend
        actions.push({
            actionName: `Remove Friend`,
            actionContext: "",
            protected: true,
            priority: 2,
            callback: () => {
                removeFriend(walletAddress);
                rightClickMenuStore.clear();
            },
        });
        return actions;
    }

    function toggleRightClickMenu(e: MouseEvent, walletAddress: string): void {
        const actions = getRightClickMenuActions(walletAddress);
        rightClickMenuStore.showMenu(e.clientX, e.clientY, actions.length, true);
    }

    function hoverRightClickMenu(e: MouseEvent, walletAddress: string): void {
        const actions = getRightClickMenuActions(walletAddress);
        rightClickMenuStore.initialize(e.clientX, e.clientY, actions.length, true);
        for (const action of actions) {
            rightClickMenuStore.addAction(action);
        }
    }
</script>

<div class="friend-list" style={`display: ${visible ? "block" : "none"}`}>
    <div class="friend-list-header">Friends List</div>
    <div class="friend-list-content">
        {#each Object.entries($friendsListStore) as [walletAddress, status]}
            <div
                class="friend"
                on:contextmenu|preventDefault={(e) => toggleRightClickMenu(e, walletAddress)}
                on:mouseover={(e) => hoverRightClickMenu(e, walletAddress)}
                on:click={(e) => rightClickMenuStore.triggerDefault()}
                on:mouseleave={e => rightClickMenuStore.clearIfNotVisible()}
            >
                <div class="name">
                    {shortenAddress(walletAddress)}
                </div>
                <div class:online={status}>{status ? "Online" : "Offline"}</div>
            </div>
        {/each}
        {#if Object.entries($friendsListStore).length <= 0}
            <div style="text-align: center; opacity: 0.8; margin-top: 80px;">No friends yet!</div>
        {/if}
    </div>
</div>

<style lang="scss">
    .friend-list {
        height: 100%;
        width: 100%;
        display: flex;
        flex-direction: column;
    }
    .friend-list-header {
        height: 30px;
        width: 100%;
        display: flex;
        justify-content: center;
        padding: 10px;
        padding-top: 2rem;
        padding-left: 14px;
        padding-bottom: 1.5rem;
        font-size: 26px;
    }
    .friend-list-content {
        height: 100%;
        width: 100%;
        display: flex;
        flex-direction: column;
        padding: 30px;
        font-size: 20px;
    }

    .friend {
        display: flex;
        justify-content: space-between;
        padding: 4px;

        &:hover {
            background-color: #4f4f4f80;
            cursor: pointer;
        }
    }

    .online {
        color: #3afe88;
    }
</style>
