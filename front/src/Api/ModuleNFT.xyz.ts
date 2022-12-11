import axios from "axios";

const STATS_ENDPOINT = "https://api.modulenft.xyz/api/v2/eth/nft/userStats";

export async function getStats(walletAddress: string) {
    if (!walletAddress) return [];
    try {
        const url = `${STATS_ENDPOINT}?address=${walletAddress}`;
        const { data } = await axios.get(url);
        return data;
    } catch (err) {
        console.error({ err });
    }
}
