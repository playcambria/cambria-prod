import axios from "axios";

import { POAP_API_KEY } from "../Enum/EnvironmentVariable";

const poapApiKey = POAP_API_KEY || "";

const SCAN_ENDPOINT = "https://api.poap.tech/actions/scan";

export async function getPoaps(walletAddress: string) {
    if (!walletAddress) return [];

    // My wallet doesn't have poap so I use this wallet temporarily for dev purposes
    const demoWalletAddress = "0x9e352CD0bd893d1b0cB783b057fd68De27AD3c92";
    try {
        const url = `${SCAN_ENDPOINT}/${walletAddress}`;
        const { data } = await axios.get(url, {
            headers: {
                "X-API-Key": poapApiKey,
            },
        });
        return data;
    } catch (err) {
        console.error({ err });
    }
}
