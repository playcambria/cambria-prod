<script lang="ts">
    import { QuestStatus, shownQuestStore, userQuestsStore } from "../../Stores/QuestStore";
    import { addDummyItemToGameItemList } from "../../Stores/InventoryStore";
    import { fly } from "svelte/transition";
    import { Confetti } from "svelte-confetti";
    import { updateUserQuestStatus } from "../../Supabase/user-quests";
    import { get } from "svelte/store";
    import { gameManager } from "../../Phaser/Game/GameManager";

    function updateUserQuest() {
        const userQuest = $userQuestsStore?.find((userQuest) => userQuest.quest_id === $shownQuestStore?.id);
        if (userQuest) {
            userQuest.status = QuestStatus.COMPLETED;
            const gameScene = gameManager.getCurrentGameScene();
            gameScene.playSound("victory");
            userQuestsStore.update((quests) => {
                return { ...quests, userQuest };
            });
            updateUserQuestStatus(userQuest.quest_id, QuestStatus.COMPLETED);
        }
        if (get(shownQuestStore)) {
            shownQuestStore.set(null);
        }
    }

    function claimReward() {
        addDummyItemToGameItemList();
        updateUserQuest();
    }
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
            <div class="title">Congratulations</div>
            <div class="container">
                <div class="text">You have completed: <b style="margin-left: 6px">{$shownQuestStore?.name}</b></div>
                <div class="collections-content" />
            </div>
            <div class="container">
                <div class="text">~ REWARDS ~</div>
                <div class="rewards">
                    {#each $shownQuestStore?.rewards || [] as reward}
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
        top: 15%;
        margin-left: auto;
        margin-right: auto;
        width: 350px;
        height: 530px;
        background-color: rgba(71, 71, 71, 1);
        color: white;
        border-radius: 20px;
        border: 2px solid black;
        font-size: large;
        pointer-events: auto;
        z-index: 3;
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
        font-size: 20px;
    }

    .rewards {
        display: flex;
        flex-direction: column;
        background-color: rgba(0, 0, 0, 0.5);
        border-radius: 12px;
        height: 200px;
        margin-top: 20px;
        padding-top: 20px;
    }

    .reward {
        display: flex;
        justify-content: center;
        color: #fff;
    }

    .footer {
        margin-top: 20px;
    }
</style>
