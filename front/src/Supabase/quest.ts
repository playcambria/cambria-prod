import { supabase } from "./supabaseClient";
import { Reward } from "../Stores/QuestStore";

const TABLE = "quests";

export async function getQuest(questId: number) {
    const { data, error } = await supabase.from(TABLE).select("*").eq("quest_id", questId);
    if (error) {
        console.error(error);
    }

    return { data, error };
}

export async function getQuests() {
    const { data, error } = await supabase.from(TABLE).select("*");
    if (error) {
        console.error(error);
    }

    return { quests: data, error };
}

export async function createQuest(quest: { name: string; rewards: Reward[] }) {
    supabase
        .from(TABLE)
        .insert(quest)
        .then(({ error }) => {
            console.error(error);
        });
}
