import { writable } from "svelte/store";

export interface Reward {
    name: string;
    amount: number;
}

export enum QuestStatus {
    NOT_STARTED = "Not Started",
    COMPLETED = "Completed",
    REWARD_RECEIVED = "Reward Received",
}

export interface Quest {
    id: number;
    name: string;
    rewards: Reward[];
}

export interface UserQuest {
    quest_id: number;
    status: QuestStatus;
}

export const shownQuestStore = writable<Quest | null>();
export const userQuestsStore = writable<UserQuest[]>();
