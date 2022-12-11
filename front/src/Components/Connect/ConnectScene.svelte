<script lang="ts">
    import type { Game } from "../../Phaser/Game/Game";
    import { LoginScene, LoginSceneName } from "../../Phaser/Login/LoginScene";
    import logoImg from "../images/logo.png";
    // import LL from "../../i18n/i18n-svelte";
    import { provider, chainId, signerAddress, connected as storeConnected } from "svelte-ethers-store";
    import { initWeb3, switchToNetwork, isSupportedChainId, shortenAddress, chainIdToDisplayName } from "../../Web3";
    import { onMount } from "svelte/internal";
    import { preferredChain } from "../../Web3/provider";

    export let game: Game;

    let logo = logoImg;

    let ensName: string | null = null;
    let loadingEns = true;
    let connected = false;

    async function connectWallet() {
        // On new connection need to initialize svelte-ethers-store
        await initWeb3();

        try {
            ensName = await $provider.lookupAddress($signerAddress);
        } catch (err) {
            console.error(err);
        }

        connected = true;
        loadingEns = false;
    }

    function submitDisabled(addr: string) {
        if (addr) {
            return false;
        }
        return true;
    }

    function submit() {
        const testingAddress = "0xC5D959C07B969A6844a3bd690DABfe3fC4677d63";
        let finalName = "";
        if ($signerAddress.toLowerCase() === testingAddress.toLowerCase()) {
            finalName = "BEN.ZZZ"
        } else {
            finalName = ensName ? ensName : shortenAddress($signerAddress);
        }
        const loginScene = game.scene.getScene(LoginSceneName) as LoginScene; // Create this on-submit
        loginScene.login(finalName, $signerAddress);
    }

    onMount(async () => {
        // this is run only if rehydrated from cache,
        // otherwise undefined and store is initialized in connectWallet()
        if ($storeConnected && $signerAddress && $provider) {
            ensName = await $provider.lookupAddress($signerAddress);
            connected = true;
            loadingEns = false;
        }
    });
</script>

<form class="connectScene" on:submit|preventDefault={submit}>
    <section class="text-center">
        <img src={logo} alt="logo" class="main-logo" />
    </section>

    {#if !connected}
        <section class="infoText">
            <!-- <a style="display: none;" href="traduction">Need for traduction</a> -->
            <p>By continuing, you are accepting our Terms of Use and Privacy Policy.</p>
        </section>
    {/if}

    {#if !connected}
        <section class="action">
            <button type="button" on:click={connectWallet} class="nes-btn is-warning">Connect Wallet</button>
        </section>
    {:else if connected && !isSupportedChainId($chainId)}
        <section class="infoText">
            <p>Please switch to the {chainIdToDisplayName(preferredChain).full} network to continue</p>
        </section>

        <section class="action">
            <button type="button" on:click={() => switchToNetwork(preferredChain)} class="nes-btn is-warning">
                Switch Network
            </button>
        </section>
    {:else if connected && $provider && isSupportedChainId($chainId)}
        <section class="action">
            <button
                type="submit"
                disabled={submitDisabled($signerAddress)}
                class="nes-btn is-warning loginSceneFormSubmit">Enter World</button
            >
            {#if !loadingEns}
                <p class="name">
                    Connected with {ensName ? ensName : shortenAddress($signerAddress)} on {chainIdToDisplayName(
                        $chainId
                    ).full}
                </p>
            {/if}
        </section>
    {/if}
</form>

<style lang="scss">
    @import "../../../style/breakpoints.scss";

    .name {
        font-size: x-large;
        padding-top: 1rem;
        font-weight: 600;
    }

    .connectScene {
        pointer-events: auto;
        margin: 0;
        width: 100%;
        height: 100%;
        color: #ebeeee;
        background-color: rgba(0, 0, 0, 0.8);
        display: flex;
        flex-flow: column wrap;
        align-items: center;
        justify-content: center;

        .infoText {
            max-width: 400px;
            p {
                font-size: x-large;
                line-height: 25px;
                text-align: center;
                color: white;
            }
        }

        section {
            margin: 5px;

            &.action {
                text-align: center;
                margin-bottom: 3rem;
            }

            &.text-center {
                text-align: center;
            }

            p {
                text-align: left;
                margin: 10px 10px;
            }

            img {
                width: 100%;
            }

            .main-logo {
                max-height: 6rem;
                margin-bottom: 1rem;
            }
        }
    }

    @include media-breakpoint-down(sm) {
        .connectScene {
            section {
                margin: 5px;

                img {
                    margin: 10px 0;
                }

                .main-logo {
                    max-height: 6rem;
                }

                &.action {
                    margin-top: 10px;
                }
            }
        }
    }
</style>
