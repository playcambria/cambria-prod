<script lang="ts">
    import { QuestStatus, shownQuestStore, userQuestsStore } from "../../Stores/QuestStore";
    import { addDummyItemToGameItemList } from "../../Stores/InventoryStore";
    import { fly } from "svelte/transition";
    import { Confetti } from "svelte-confetti";
    import { itemType, ItemTypes } from "../../Stores/InventoryStore";
    import { updateUserQuestStatus } from "../../Supabase/user-quests";
    import { get } from "svelte/store";
    import { gameManager } from "../../Phaser/Game/GameManager";
    import objectivesColor from "/resources/navigation/icon_objectives_color.png";
    import { showCompletionStore } from "../../Stores/AchievementsStore";

    function claimReward() {
        addDummyItemToGameItemList();
        showCompletionStore.set(false);
        itemType.set(ItemTypes.Game);
    }

    const rewards = [
        {
            name: "Pet Spawner",
            amount: 1,
        }
    ];
</script>

<div
    style="position: fixed;
            top: -50px;
            left: 0;
            height: 100vh;
            width: 100vw;
            display: flex;
            justify-content: center;
            overflow: hidden;
            pointer-events: none;"
>
    <Confetti x={[-5, 5]} y={[0, 0.1]} delay={[0, 1500]} infinite duration="5000" amount="500" fallDistance="100vh" />
</div>

<div class="quest-menu nes-container is-dark" transition:fly={{ y: -50, duration: 500 }}>
    <div class="body">
        <div class="body-content">
            <div style="width: 100%; text-align: center; display: flex; justify-content: center;">
                <img src={objectivesColor} alt="objectives" style="height: 65px" />
            </div>
            <div class="title">Congratulations!</div>
            <div style="display: flex; justify-content: center; margin-top: 1.5rem;">
                [Diary Complete]
            </div>
            <div style="display: flex; justify-content: center; font-size: 1.9rem; font-weight: bold;">
                Alpha Test v0.3
            </div>
            <div class="container">
                <div class="text">[Rewards]</div>
                <div class="rewards">
                    {#each rewards as reward}
                        <div class="reward">
                            {reward.amount <= 1 ? "" : reward.amount}
                            {reward.name}
                        </div>
                    {/each}
                </div>
            </div>
        </div>
    </div>
    <div class="footer">
        <div class="footer-content">
            <button class="nes-btn is-warning buttons" on:click={claimReward}>Claim Reward</button>
        </div>
    </div>
</div>

<style lang="scss" scoped>
    div {
        display: flex;
    }

    .quest-menu {
        position: absolute;
        display: flex;
        flex-direction: column;
        left: 0;
        right: 0;
        top: 5%;
        margin-left: auto;
        margin-right: auto;
        width: 400px;
        height: 550px;
        background-color: rgba(71, 71, 71, 1);
        border: 3px solid black;
        color: white;
        border-radius: 20px;
        border: 2px solid black;
        font-size: large;
        pointer-events: auto;
        z-index: 3;

        &::after {
            border-radius: 6px !important;
        }
    }

    .title {
        display: flex;
        font-size: 36px;
        justify-content: center;
        margin-bottom: 0px;
        font-weight: bold;
        color: #e59400;
    }

    .body {
        height: 100%;
    }

    .footer {
        height: 100px;
        width: 100%;
    }

    .body-content {
        padding: 15px;
        display: flex;
        flex-direction: column;
        width: 100%;
    }

    .footer-content {
        justify-content: center;
        width: 100%;
    }

    .buttons {
        height: 45px;
    }

    .container {
        display: flex;
        flex-direction: column;
        width: 100%;
        margin-top: 1rem;
        margin-bottom: 0;
    }

    .text {
        display: flex;
        justify-content: center;
    }

    .rewards {
        display: flex;
        flex-direction: column;
        background-color: rgba(0, 0, 0, 0.3);
        height: 120px;
        margin-top: 10px;
    }

    .reward {
        display: flex;
        justify-content: center;
        margin-top: 12px;
        font-size: 22px;
        color: #FFF;
        font-family: 'RSChat';
    }

    .footer {
        margin-top: 10px;
    }
</style>
