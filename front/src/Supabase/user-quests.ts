import { supabase } from "./supabaseClient";
import { gameManager } from "../Phaser/Game/GameManager";
import { Quest, userQuestsStore, QuestStatus, UserQuest } from "../Stores/QuestStore";
import { get } from "svelte/store";

const TABLE = "user_quests";

export async function getUserQuests(walletAddress: string) {
    const { data, error } = await supabase.from(TABLE).select().eq("user_wallet", walletAddress);
    if (error) {
        console.error(error);
    }

    return data || [];

    // We can check if user doesn't have quests and add them to user
    // return [];
}

export async function addUserQuest(quest: Quest, status: QuestStatus) {
    const userWalletAddress = gameManager.getWalletAddress();

    supabase
        .from(TABLE)
        .insert({ user_wallet: userWalletAddress, quest_id: quest.id, status })
        .then(({ error }) => {
            console.error(error);
            if (!error) {
                userQuestsStore.update((quests) => {
                    return { ...quests, quest };
                });
            }
        });
}

export async function updateUserQuestStatus(questId: number, status: QuestStatus) {
    const userWalletAddress = gameManager.getWalletAddress();
    console.log({ userWalletAddress, questId, status });
    supabase
        .from(TABLE)
        .update({ status })
        .eq("user_wallet", userWalletAddress)
        .eq("quest_id", questId)
        .then(({ error }) => {
            console.error(error);
            if (!error) {
                // Update userQuests store
                const userQuests = get(userQuestsStore);
                const quest = userQuests.find((userQuest: UserQuest) => {
                    userQuest.quest_id === questId;
                });
                const questIndex = userQuests.findIndex((userQuest: UserQuest) => {
                    userQuest.quest_id === questId;
                });
                if (quest) {
                    quest.status = status;
                    userQuests.splice(questIndex, 1, quest);
                    userQuestsStore.set(userQuests);
                }
            }
        });
}

export async function removeUserQuest(questId: number) {
    const userWalletAddress = gameManager.getWalletAddress();

    const userQuests = await getUserQuests(userWalletAddress);
    const questInDb = userQuests?.find((userQuest) => userQuest.quest_id === questId);
    if (!questInDb) {
        return console.log("Quest already removed");
    }
    const { error: deleteError } = await supabase
        .from(TABLE)
        .delete()
        .eq("user_wallet", userWalletAddress)
        .eq("quest_id", questId);
    console.log({ deleteError });
    if (!deleteError) {
        const userQuests = get(userQuestsStore);
        const questIndex = userQuests?.findIndex((userQuest) => userQuest.quest_id === questId);

        userQuestsStore.update((quests) => {
            quests.splice(questIndex, 1);
            return quests;
        });
    }
}
