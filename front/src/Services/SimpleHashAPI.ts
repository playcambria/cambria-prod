import axios, { Axios, AxiosInstance } from "axios";
import { SIMPLEHASH_API_KEY } from "../Enum/EnvironmentVariable";

import { SupportedChainId } from "../Utils/Chains";
import { narrowChainIdType } from "../Web3";
import { Nft, SimpleHashNftData } from "../Components/Inventory/types";

import { BigNumber } from "ethers";

const TESTNETS = [SupportedChainId.GOERLI, SupportedChainId.RINKEBY, SupportedChainId.POLYGON_MUMBAI];
const MAINNETS = [
    SupportedChainId.MAINNET,
    SupportedChainId.POLYGON,
    SupportedChainId.ARBITRUM_ONE,
    SupportedChainId.OPTIMISM,
];

function baseURL(_chainId: string | number) {
    const chainId = narrowChainIdType(_chainId);
    if (MAINNETS.includes(chainId)) {
        return "https://api.simplehash.com/api/v0/";
    } else if (TESTNETS.includes(chainId)) {
        return "https://api-testnets.simplehash.com/api/v0/";
    } else {
        throw new Error(`Unsupported chainID for Inventory! ChainID: ${chainId}`);
    }
}

function chainQarg(_chainId: string | number) {
    const chainId = narrowChainIdType(_chainId);
    switch (chainId) {
        case SupportedChainId.MAINNET:
            return "ethereum";
        case SupportedChainId.POLYGON:
            return "polygon";
        case SupportedChainId.OPTIMISM:
            return "optimism";
        case SupportedChainId.ARBITRUM_ONE:
            return "arbitrum";
        case SupportedChainId.GOERLI:
            return "ethereum-goerli";
        case SupportedChainId.RINKEBY:
            return "ethereum-rinkeby";
        case SupportedChainId.POLYGON_MUMBAI:
            return "polygon-mumbai";
        default:
            throw new Error(`Unsupported chainID for Inventory! ChainID: ${chainId}`);
    }
}

function chainIdForQarg(_Qarg: string) {
    switch (_Qarg) {
        case "ethereum":
            return SupportedChainId.MAINNET;
        case "polygon":
            return SupportedChainId.POLYGON;
        case "optimism":
            return SupportedChainId.OPTIMISM;
        case "arbitrum":
            return SupportedChainId.ARBITRUM_ONE;
        case "ethereum-goerli":
            return SupportedChainId.GOERLI;
        case "ethereum-rinkeby":
            return SupportedChainId.RINKEBY;
        case "polygon-mumbai":
            return SupportedChainId.POLYGON_MUMBAI;
        default:
            throw new Error(`Unsupported Qarg for Inventory! Qarg: ${_Qarg}`);
    }
}

export const simpleHashParser = (nfts: SimpleHashNftData[]): Nft[] => {
    return nfts.map((nft_data: SimpleHashNftData) => {
        return <Nft>{
            type: nft_data.contract.type,
            chainId: chainIdForQarg(nft_data.chain),
            contractAddress: nft_data.contract_address,
            name: nft_data.name,
            symbol: nft_data.contract.symbol,
            owner_count: nft_data.owner_count,
            tokenId: nft_data.token_id,
            iconUrl: nft_data?.previews.image_small_url,
            balance: nft_data.queried_wallet_balances && nft_data.queried_wallet_balances.length > 0
                ? BigNumber.from(nft_data.queried_wallet_balances[0].quantity)
                : BigNumber.from(1),
            originalBalance: nft_data.queried_wallet_balances && nft_data.queried_wallet_balances.length > 0
                ? BigNumber.from(nft_data.queried_wallet_balances[0].quantity)
                : BigNumber.from(1),
            decimals: 0,
            nft_id: nft_data.nft_id,
            created_date: nft_data?.created_date,
            last_sale: nft_data?.last_sale,
            collection: nft_data.collection,
            extra_metadata: nft_data?.extra_metadata,
            verified:
                nft_data?.collection?.marketplace_pages && nft_data.collection.marketplace_pages[0]?.verified
                    ? true
                    : false,
        };
    });
};

async function getNFTData(endpointUrl: string, axiosInstance: AxiosInstance) {
    let nfts:any = [];
    let lastResult = {};
    let nextUrl = "";
    let page = 0;
    const PAGE_MAX = 100;
    do {
      try {
        const resp = await axiosInstance.get((nextUrl) ? nextUrl : endpointUrl);
        const data = resp.data;
        lastResult = data;
        nfts = nfts.concat(data.nfts);
        nextUrl = data.next;
        page++;
      } catch (err) {
        console.error(`Oeps, something is wrong ${err}`);
      }
      // keep running until there's no next page
    } while (nextUrl !== null && nextUrl.length > 0 && page < PAGE_MAX);
    return nfts;
  }

class SimpleHashAPI {
    client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            responseType: "json",
            headers: {
                "X-API-KEY": SIMPLEHASH_API_KEY || "",
            },
        });
    }

    getNFTs(chainId: string | number, signerAddress: string) {
        const _baseURL = baseURL(chainId);
        const _chainQarg = chainQarg(chainId);
        const _endpointUrl = `${_baseURL}nfts/owners?chains=${_chainQarg}&wallet_addresses=${signerAddress}&queried_wallet_balances=1`;
        return getNFTData(_endpointUrl, this.client);
    }

    getNftOwners(chainId: string | number, signerAddress: string) {
        const _baseURL = baseURL(chainId);
        const _chainQarg = chainQarg(chainId);
        return this.client.get(
            `${_baseURL}nfts/owners?chains=${_chainQarg}&wallet_addresses=${signerAddress}&queried_wallet_balances=1`
        );
    }
}

export default new SimpleHashAPI();
