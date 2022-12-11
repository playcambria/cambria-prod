<script lang="ts">
    export let visible = false;

    import questsHeader from "/resources/logos/quests_header.png";
    import achievementsHeader from "/resources/logos/achievements_header.png";
    import tradeIcon from "/resources/icons/coins_icon.png";
    import IconButton from "../../IconButton.svelte";
    import { achievementsStore } from "../../../Stores/AchievementsStore";
    import { signerAddress } from "svelte-ethers-store";
    import { friendsListStore } from "../../../Stores/FriendsStore";

    const ObjectiveTabs = {
        Achievements: 0,
        Quests: 1,
    };
    let activeTab = ObjectiveTabs.Achievements;

    $: {
        if (!$achievementsStore) {
            if ($signerAddress && $friendsListStore) {
                achievementsStore.initialize($signerAddress, Object.entries($friendsListStore).length);
            }
        }
    }
</script>

<div class="objectives" style={`display: ${visible ? "block" : "none"}`}>
    <div class="objectives-header">
        <div class="toggle">
            <div class="buttons">
                <button
                    class:active={activeTab === ObjectiveTabs.Achievements}
                    on:click={() => (activeTab = ObjectiveTabs.Achievements)}
                    class="left"
                >
                    ACHIEVE
                </button>
                <button
                    class:active={activeTab === ObjectiveTabs.Quests}
                    on:click={() => (activeTab = ObjectiveTabs.Quests)}
                    class="right"
                >
                    QUESTS
                </button>
            </div>
        </div>
    </div>
    <div class="objectives-content">
        <div class="grid-container" style="height: 100%;padding-bottom: 60px;">
            {#if activeTab === ObjectiveTabs.Achievements && $achievementsStore && $achievementsStore.children}
                <div style="text-align: center; width: 100%;">
                    <img src={achievementsHeader} alt="achievements-header" style="height: 30px" />
                </div>
                <div style="padding-left: 3rem; padding-right: 3rem; margin-top: 1.5rem;">
                    <span style="font-weight: bold; font-size: 26px; padding-left: 6px;">Alpha Test v0.3</span>
                    <div>
                        <progress class="nes-progress is-success" value={$achievementsStore.children.filter(a => a.isComplete).length * (100 / $achievementsStore.children.length)} max="100" style="height: 15px;" />
                    </div>
                </div>
                {#each $achievementsStore.children as achievement}
                    <div style="display: flex; padding-left: 3rem; padding-right: 3rem; align-items: center; gap: 10px; margin-top: 5px; margin-bottom: 10px;">
                        <div style="">
                            <img src={achievement.iconUrl} alt="trade-icon" style="height: 40px" />
                        </div>
                        <div style="display: flex; flex-direction: column;">
                            <div class="task-header" style="display: flex; align-items: center;">
                                <span style={`font-size: 24px; font-weight: ${(achievement.isComplete === true) ? 'bold' : 'normal'};`}>{achievement.name}</span>
                                {#if achievement.isComplete === true}
                                    <div style="margin-left: 8px;">
                                        <IconButton icon="check_circle" size={16} />
                                    </div>
                                {/if}
                            </div>
                            <span style="font-size: 16px;">{achievement.description}</span>
                        </div>
                    </div>
                {/each}
            {/if}
            {#if activeTab === ObjectiveTabs.Quests}
                <div
                    style="display: flex; flex-direction: column; justify-content: space-between; height: 100%; padding-left: 3rem; padding-right: 3rem;"
                >
                    <div style="width: 100%;">
                        <div style="width: 100%; text-align: center;">
                            <img src={questsHeader} alt="quests-header" style="height:30px" />
                        </div>
                        <div style="width: 100%; margin-top: 1.5rem;">
                            <span class="quest-incomplete">One Small Favour</span>
                        </div>
                    </div>
                    <div style="display: flex; justify-content: center; align-items: center;">
                        <div class="quests-footer">
                            <div>
                                <span style="margin-right: 8px;">Completed: 0 / 0</span>
                                ·
                                <span style="margin-left: 8px;">Quest Points: 0</span>
                            </div>
                        </div>
                    </div>
                </div>
            {/if}
        </div>
    </div>
</div>

<style lang="scss">
    .objectives {
        height: 100%;
        width: 100%;
        display: flex;
        flex-direction: column;
    }
    .objectives-content {
        height: 100%;
        padding-bottom: 30px;
    }
    .task-header {
        .material-icons {
            font-size: 16px;
            color: #09FF04;
        }
    }
    .objectives-header {
        display: flex;
        width: 100%;
        padding: 25px 18px;
        margin-bottom: 8px;
        margin-top: 5px;
        justify-content: center;
        height: 60px;
        font-size: x-large;
    }
    .quests-footer {
        display: flex;
        flex-direction: column;
        justify-content: center;
        color: #ff9040;
    }
    .quest-incomplete {
        color: #ff0000;
        font-size: 24px;
        &:hover {
            color: white;
        }
    }
    .toggle {
        display: flex;
        width: 100%;
        justify-content: center;
    }

    button {
        border: 1px solid rgba(0, 0, 0, 1);
        background-color: rgba(17, 15, 28, 0.4);
        color: rgba(255, 255, 255, 0.6);
        height: 35px;
        font-size: large;
        transition: color 0.2s;

        &:hover {
            color: white;
            background-color: rgba(17, 15, 28, 0.6);
        }
    }

    button.active {
        background-color: black;
        color: white;
    }

    .buttons {
        display: flex;
        gap: 0;
        width: 100%;
        align-items: center;
        justify-content: center;
    }

    button.left {
        border-top-left-radius: 8px;
        border-bottom-left-radius: 8px;
        min-width: 30px;
        width: 120px;
    }

    button.middle {
        min-width: 30px;
        width: 120px;
    }

    button.right {
        border-top-right-radius: 8px;
        border-bottom-right-radius: 8px;
        min-width: 30px;
        width: 120px;
    }
</style>
