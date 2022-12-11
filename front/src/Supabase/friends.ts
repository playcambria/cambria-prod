import { supabase } from "./supabaseClient";
import { friendsListStore } from "../Stores/FriendsStore";
import { gameManager } from "../Phaser/Game/GameManager";

const TABLE = "friends";

export async function getFriends(walletAddress: string) {
    const { data, error } = await supabase
        .from(TABLE)
        .select("friend_wallet_address")
        .eq("user_wallet_address", walletAddress);
    if (error) {
        console.error(error);
    }
    return { friends: data?.map((record) => record.friend_wallet_address as string) };
}

export async function addFriend(friendWalletAddress: string) {
    console.log({ friendWalletAddress });
    const userWalletAddress = gameManager.getWalletAddress();
    if (!friendWalletAddress) {
        return console.log("No wallet address for friend");
    }
    // First check if user already exists. Create otherwise
    const { friends } = await getFriends(userWalletAddress);
    if (friends?.includes(friendWalletAddress)) {
        return console.log("Friend already added");
    }

    supabase
        .from(TABLE)
        .insert({ user_wallet_address: userWalletAddress, friend_wallet_address: friendWalletAddress })
        .then(({ error }) => {
            console.error(error);
            if (!error) {
                friendsListStore.update((friends) => {
                    return { ...friends, [friendWalletAddress]: true };
                });
            }
        });
}

export async function removeFriend(friendWalletAddress: string) {
    // First check if user already exists.
    const userWalletAddress = gameManager.getWalletAddress();
    const { friends } = await getFriends(userWalletAddress);
    if (!friends?.includes(friendWalletAddress)) {
        return console.log("Friend already removed");
    }

    const { error: deleteError } = await supabase
        .from(TABLE)
        .delete()
        .eq("user_wallet_address", userWalletAddress)
        .eq("friend_wallet_address", friendWalletAddress);
    console.log({ deleteError });
    if (!deleteError) {
        friendsListStore.update((friends) => {
            delete friends[friendWalletAddress];
            return friends;
        });
    }
}
