import { writable, get } from "svelte/store";

import pfpIcon from "/resources/icons/pfp_icon.png";
import friendIcon from "/resources/icons/friend_icon.png";
import tradeIcon from "/resources/icons/coins_icon.png";

import { getPfpUrl } from "../Supabase/user";
import { addDummyItemToGameItemList } from "./InventoryStore";

import { gameManager } from "../Phaser/Game/GameManager";

export type Achievement = {
    id: string;
    name: string;
    description: string;
    isComplete: boolean;
    iconUrl: any;
};

export type AchievementDiary = {
    children: Achievement[];
    completed: boolean;
}

function createAchievementsStore() {
    const { subscribe, update, set } = writable<undefined | AchievementDiary>(undefined);

    return {
        subscribe,
        initialize: (signerAddress: string, numFriends: number) => {
            // Figure out initial state. TODO: load from supabase 
            getPfpUrl(signerAddress).then(({data}) => {
                let achievements = [];
                const hasPfp = (data && data.pfp_url && data.pfp_url.length > 0);
                const hasFriend = numFriends > 0;
                const hasTrade = Boolean(window.localStorage.getItem('trade'));
                achievements.push({
                    id: 'flair_up',
                    name: 'Flair Up',
                    description: 'Set an NFT as your Profile Picture',
                    isComplete: hasPfp,
                    iconUrl: pfpIcon,
                });
                achievements.push({
                    id: 'friendship_bracelet',
                    name: 'Three\'s Company',
                    description: 'Add another player as a Friend',
                    isComplete: hasFriend,
                    iconUrl: friendIcon,
                });
                achievements.push({
                    id: 'my_first_trade',
                    name: 'My First Trade',
                    description: 'Complete a trade with another player',
                    isComplete: hasTrade,
                    iconUrl: tradeIcon,
                });
                set({
                    children: achievements,
                    completed: hasPfp && hasFriend && hasTrade,
                });
                if (hasPfp && hasFriend && hasTrade) {
                    addDummyItemToGameItemList();
                }
            });
        },
        completeAchievement: (id: string) => {
            const current = get(achievementsStore);

            if (!current || current.completed) {
                // Exit early if this diary is already complete (so as to not trigger the post-diary complete screen multiple times)
                return;
            }
            let after: Achievement[] = [];
            if (current) {
                for (let achievement of current.children) {
                    const modified = {
                        ...achievement,
                        isComplete: (achievement.id === id) ? true : achievement.isComplete,
                    };
                    after.push(modified);
                }
                // TODO: confetti on completion, play FX
                if (after.filter(a => a.isComplete === true).length === after.length) {
                    // All achievements complete.  
                    // Trigger Achievement Completion Reward screen, play FX, confetti 
                    setTimeout(() => {
                        showCompletionStore.set(true);
                        const gameScene = gameManager.getCurrentGameScene();
                        gameScene.playSound("victory");
                    }, 3500);
                    set({
                        children: after,
                        completed: true,
                    });
                } else {
                    set({
                        children: after,
                        completed: false,
                    })
                }
            }
        },
        clear: () => {
            set(undefined);
        },
    };
}

export const achievementsStore = createAchievementsStore();

export const showCompletionStore = writable<boolean>(false);