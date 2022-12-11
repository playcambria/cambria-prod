<script lang="ts">
    import { onDestroy } from "svelte";

    import { BigNumber, ethers } from "ethers";
    import { signer, contracts } from "svelte-ethers-store";

    import { formatBalance } from "../../../Web3";
    import { Weth } from "../../../Web3/typechain";

    import { tokenMapStore } from "../../../Stores/InventoryStore";

    import { parseEther } from "ethers/lib/utils";

    let wethContract = $contracts.WETH as Weth;
    console.log("$contracts", $contracts);

    let ethBalance: BigNumber | undefined;

    let amount: number;
    let isLoading = false;
    let isPending = false;

    async function loadBalances(_signer: ethers.Signer) {
        let address = await $signer.getAddress();
        ethBalance = await $signer.getBalance();
        let wethBalance = await wethContract.balanceOf(address);

        const ethToken = tokenMapStore.get("ETH");
        if (ethToken) tokenMapStore.set("ETH", { ...ethToken, balance: ethBalance });

        const wethToken = tokenMapStore.get(wethContract.address.toLowerCase());
        if (wethToken) tokenMapStore.set(wethContract.address.toLowerCase(), { ...wethToken, balance: wethBalance });
    }

    async function wrapEth() {
        if (isNaN(amount)) {
            return;
        }
        const options = { value: ethers.utils.parseEther(amount.toString()) };
        try {
            isLoading = true;
            const txn = await wethContract.deposit(options);
            isLoading = false;
            isPending = true;
            const receipt = await txn.wait();
            console.log("receipt", receipt);
            await loadBalances($signer);
        } catch (err) {
            console.error(err);
        } finally {
            isLoading = false;
            isPending = false;
        }
    }

    const greaterThanBalance = (_amount: number) => {
        return ethBalance ? parseEther(_amount.toString()).gt(ethBalance) : false;
    };

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    const unsubscribeSigner = signer.subscribe(async (_signer) => {
        if (_signer) {
            await loadBalances(_signer);
        }
    });

    onDestroy(() => {
        unsubscribeSigner();
    });
</script>

<div class="wrapEth">
    {#if $signer && wethContract}
        <p style="font-size: x-large">Current Balance: {ethBalance && formatBalance(ethBalance)} ETH</p>
        <div class="nes-field" style="margin-bottom: 1.2rem">
            <input
                type="number"
                step="0.001"
                id="name_field"
                class="nes-input"
                placeholder="Amount to Wrap"
                bind:value={amount}
            />
        </div>
        <button
            type="button"
            class="nes-btn is-warning"
            class:is-disabled={isNaN(amount) || amount <= 0 || greaterThanBalance(amount)}
            class:invisible={isLoading === true || isPending === true}
            on:click={wrapEth}>Wrap</button
        >
        <span class:invisible={isLoading === false}>Pending in Wallet...</span>
        <span class:invisible={isPending === false}>Awaiting Transaction...</span>
    {/if}
</div>

<style lang="scss">
    @import "../../../../style/breakpoints.scss";

    .wrapEth {
        color: white;
        display: block;
        opacity: 1;
    }

    .invisible {
        display: none;
        transition: opacity 0.5s ease-in-out;
        opacity: 0;
    }
</style>
