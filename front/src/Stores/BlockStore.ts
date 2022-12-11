/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-misused-promises */
import { derived, writable, get, Readable } from "svelte/store";
import { provider, signer, contracts } from "svelte-ethers-store";

const DEBUG = false;

export type OnBlockHook = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    context: any;
    // eslint-disable-next-line @typescript-eslint/ban-types
    fn: Function;
    utilBlock?: number;
};

// ---------------

const onBlockHooks = writable<OnBlockHook[]>();

export const addBlockHook = (hook: OnBlockHook) => {
    if (DEBUG) console.log("Adding block hook", hook);
    onBlockHooks.update((hooks) => {
        if (hooks) {
            const matches = hooks.some((existingHook) => {
                if (JSON.stringify(hook) === JSON.stringify(existingHook)) {
                    return true;
                }
                return false;
            });
            if (matches) {
                if (DEBUG) console.log("attempted to add an existing hook");
                return hooks;
            } else {
                if (DEBUG) console.log("new hook added");
                hooks.push(hook);
                return hooks;
            }
        } else {
            return [hook];
        }
    });
};

const pruneExpiredHooks = (currentBlock: number) => {
    const hooks = get(onBlockHooks);
    // remove expired hooks
    const idxToDel: number[] = [];
    hooks.map((hook, idx) => {
        if (hook.utilBlock && currentBlock > hook.utilBlock) {
            idxToDel.push(idx);
        }
    });
    idxToDel.map((idx) => hooks.splice(idx, 1)); // remove the fcn
    onBlockHooks.set(hooks);
};

export const onBlockStore: Readable<number> = derived(
    [signer, provider, contracts],
    ([$signer, $provider, $contracts], set) => {
        if (!$signer || !$provider || !$contracts) return set(0);

        // sets initial value
        // NOTE: Should only run once, but hot-reload will run this on every
        //       change in dev
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        (async () => {
            // Initial work here
            const block = await $provider.getBlockNumber();
            // run initial hooks on-load if present
            const hooks = get(onBlockHooks);
            if (hooks) {
                await Promise.all(hooks.map((hook) => hook.fn($signer, $contracts)));
                pruneExpiredHooks(block);
            }
            // finally set block number
            set(block);
        })();

        // Updated value on each block
        // https://docs.ethers.io/v5/api/providers/provider/#Provider--events
        provider.subscribe(async (provider) => {
            if (!provider) return;

            provider.on("block", async (block: number) => {
                if (DEBUG) console.log("new block:", block);
                const hooks = get(onBlockHooks);
                if (DEBUG) console.log("current hooks", hooks);

                if (hooks) {
                    await Promise.all(
                        hooks.map((hook) => {
                            hook.fn($signer, $contracts);
                        })
                    );
                    pruneExpiredHooks(block);
                }
                set(block);
            });
        });
    }
);
