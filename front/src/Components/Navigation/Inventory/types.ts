import { BigNumber } from "ethers";
import { SupportedChainId } from "../../../Utils/Chains";

export type SupportedContractType = `ERC${20 | 721 | 1155}` | "ETH";
export type ContractType = SupportedContractType | { other: string };

export enum ItemContext {
    Inventory = "INVENTORY",
    Offer = "OFFER",
    Profile = "PROFILE",
    Bank = "BANK",
}

export interface Item<CT extends ContractType> {
    type: CT;
    chainId?: SupportedChainId;
    contractAddress?: string;
    name: string;
    symbol: string;
    tokenId?: string;
    iconUrl?: string;
    balance: BigNumber;
    originalBalance: BigNumber;
    decimals: number;
}

export interface Nft extends Item<"ERC721" | "ERC1155"> {
    nft_id: string;
    created_date?: string;
    last_sale?: {
        payment_token: PaymentToken;
        unit_price?: number;
        total_price: number;
    };
    owner_count: number;
    collection: {
        name: string;
        description: string;
        image_url?: string;
        banner_image_url?: string;
        external_url?: string;
        twitter_username?: string;
        discord_url?: string;
        marketplace_pages?: MarketplacePage[];
        floor_prices?: FloorPrices[];
        spam_score?: number | null;
        total_quantity: number;
    };
    queried_wallet_balances: WalletBalances[];
    extra_metadata?: {
        attributes?: NftAttribute[];
    };
    verified: boolean;
}

export interface GameItem {
    name: string;
    imageUrl: string;
}

export function getKeyForNft(nft: Nft) {
    return `nft-${nft.contractAddress}-${nft.tokenId}` as const;
}

export interface SimpleHashNftData {
    name: string;
    image_url: string;
    nft_id: string;
    chain: string;
    contract_address: string;
    token_id: string;
    token_count?: number;
    created_date?: string;
    last_sale?: {
        payment_token: PaymentToken;
        unit_price?: number;
        total_price: number;
    };
    owner_count: number;
    contract: {
        type: string;
        name: string;
        symbol: string;
    };
    collection: {
        name: string;
        description: string;
        image_url?: string;
        banner_image_url?: string;
        external_url?: string;
        twitter_username?: string;
        discord_url?: string;
        marketplace_pages?: MarketplacePage[];
        floor_prices?: FloorPrices[];
        spam_score?: number | null;
        total_quantity: number;
    };
    extra_metadata?: {
        attributes?: NftAttribute[];
    };
    queried_wallet_balances: WalletBalances[];
}

interface WalletBalances {
    address: string;
    quantity: number;
    first_acquired_date: string;
    last_acquired_date: string;
}

interface NftAttribute {
    trait_type: string;
    value: string;
}

interface MarketplacePage {
    marketplace_id: string;
    marketplace_name: string;
    marketplace_collection_id: string;
    nft_url: string;
    collection_url: string;
    verified: boolean;
}

interface PaymentToken {
    payment_token_id: string;
    name: string;
    symbol: string;
    address: string | null;
    decimals: number;
}

interface FloorPrices {
    marketplace_id: string;
    value: number;
    payment_token: PaymentToken;
}
