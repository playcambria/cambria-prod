import axios from "axios";

import { NXYZ_API_KEY } from "../Enum/EnvironmentVariable";

const nxyzApiKey = NXYZ_API_KEY || "";

const WALLET_ENDPOINT = "https://api.n.xyz/api/v1/address";

export async function getNftCollections(walletAddress: string, chainId = "ethereum") {
    if (!walletAddress) return [];
    try {
        const url = `${WALLET_ENDPOINT}/${walletAddress}/balances/collection-nfts?chainID=${chainId}&apikey=${nxyzApiKey}&limit=100`;
        const { data } = await axios.get(url);
        return data;
    } catch (err) {
        console.error({ err });
    }
}

export type CollectionMetadata = {
    blockchain: {
        name: string;
        shortName: string;
        chainID: string;
        shortChainID: string;
    };
    contractAddress: string;
    symbol: string;
    slug: string;
    name: string;
    createdDate: string;
    floorPrice: {
        value: string;
        tokenValue: number;
        pretty: number;
        decimals: number;
        symbol: string;
    };
    totalSupply: number;
    bannerImage: {
        URI: string;
    };
    featuredImage: {
        URI: string;
    };
    openSeaCollectionVerified: true;
}

const NFT_ENDPOINT = "https://api.n.xyz/api/v1/nfts";
export async function getCollectionMetadata(contractAddress: string, chainId = "ethereum") {
    if (!contractAddress) return [];
    try {
        const url = `${NFT_ENDPOINT}/${contractAddress}/metadata?chainID=${chainId}&apikey=${nxyzApiKey}`;
        const { data } = await axios.get(url);
        return data;
    } catch (err) {
        console.error({ err });
    }
}
