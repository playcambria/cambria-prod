import type { DefaultEVMStore } from "svelte-ethers-store";

import { wethABI } from "./abis";
import LocalTokenMetadata from "./LocalTokenMetadata";

type ContractConfig = {
    name: string;
    abi: string;
    [chainId: number]: string;
};

// -----
// Special
// -----

const WETH = {
    name: "WETH",
    abi: JSON.stringify(wethABI),
    1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    5: "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6",
} as ContractConfig;

const WMATIC = {
    name: "WMATIC",
    abi: JSON.stringify(wethABI),
    137: "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270",
    80001: "0x9c3c9283d3e44854697cd22d3faa240cfb032889",
} as ContractConfig;

// -----

export async function registerContracts(chain: number, defaultEvmStores: DefaultEVMStore) {
    // load pre-set non-erc20 standard contracts
    if (chain === 1 || chain === 5) {
        await defaultEvmStores.attachContract(WETH.name, WETH[chain], WETH.abi);
    } else if (chain === 137 || chain === 80001) {
        await defaultEvmStores.attachContract(WMATIC.name, WMATIC[chain], WMATIC.abi);
    }

    // Set chain ID for token metadata
    LocalTokenMetadata.setChainId(chain);
}
