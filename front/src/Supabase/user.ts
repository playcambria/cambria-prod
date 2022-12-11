import { supabase } from "./supabaseClient";
import { gameManager } from "../Phaser/Game/GameManager";

const TABLE = "users";

const PRIMARY_KEY = "wallet_address";

export async function getUser(walletAddress: string) {
    const { data, error } = await supabase.from(TABLE).select("*").eq(PRIMARY_KEY, walletAddress).single();
    if (error) {
        console.error(error);
    }
    return { data, error };
}

export async function createUser(walletAddress: string) {
    // First check if user already exists. Create otherwise
    const { data } = await getUser(walletAddress);

    if (!data) {
        console.log("User not found. Adding user with wallet address:", walletAddress);

        const { error: insertError } = await supabase.from(TABLE).insert({ [PRIMARY_KEY]: walletAddress });
        console.log({ insertError });
    } else {
        console.log("User found:", { data });
    }
}

export async function getPfpUrl(walletAddress: string) {
    const { data, error } = await supabase.from(TABLE).select("pfp_url").eq(PRIMARY_KEY, walletAddress).single();
    return { data, error };
}

export async function setPfpUrl(pfpUrl: string) {
    const walletAddress = gameManager.getWalletAddress();
    console.log({ pfpUrl, walletAddress });
    const { error } = await supabase.from(TABLE).update({ pfp_url: pfpUrl }).eq(PRIMARY_KEY, walletAddress);
    console.log({ error });
}

export async function getCompanionPet(walletAddress: string) {
    const { data, error } = await supabase.from(TABLE).select("companion_pet").eq(PRIMARY_KEY, walletAddress).single();
    return { data, error };
}

export async function setCompanionPet(companionPet: string) {
    const walletAddress = gameManager.getWalletAddress();
    const { error } = await supabase.from(TABLE).update({ companion_pet: companionPet }).eq(PRIMARY_KEY, walletAddress);
}

export async function getUserNfts(walletAddress: string) {
    const { data, error } = await supabase
        .from(TABLE)
        .select("bank_tabs, inventory_nfts")
        .eq(PRIMARY_KEY, walletAddress)
        .single();
    return { bankTabIds: data?.bank_tabs, inventoryNftIds: data?.inventory_nfts };
}

export async function setBankTabs(tabs: string[][]) {
    console.log({ tabsToSave: tabs });
    const walletAddress = gameManager.getWalletAddress();
    const { error } = await supabase.from(TABLE).update({ bank_tabs: tabs }).eq(PRIMARY_KEY, walletAddress);
}

export async function setInventoryNfts(nfts: string[]) {
    const walletAddress = gameManager.getWalletAddress();
    const { error } = await supabase.from(TABLE).update({ inventory_nfts: nfts }).eq(PRIMARY_KEY, walletAddress);
}
