<script lang="ts">
    import type { Game } from "../Phaser/Game/Game";
    // import { chatVisibilityStore } from "../Stores/ChatStore";
    import { errorStore } from "../Stores/ErrorStore";
    import { errorScreenStore } from "../Stores/ErrorScreenStore";
    import { loginSceneVisibleStore } from "../Stores/LoginSceneStore";
    import { selectCharacterSceneVisibleStore } from "../Stores/SelectCharacterStore";
    import { selectCompanionSceneVisibleStore } from "../Stores/SelectCompanionStore";
    // import EnableCameraScene from "./EnableCamera/EnableCameraScene.svelte";
    // import LoginScene from "./Login/LoginScene.svelte";
    import ConnectScene from "./Connect/ConnectScene.svelte";
    import MainLayout from "./MainLayout.svelte";
    import SelectCharacterScene from "./selectCharacter/SelectCharacterScene.svelte";
    import SelectCompanionScene from "./SelectCompanion/SelectCompanionScene.svelte";
    import ErrorDialog from "./UI/ErrorDialog.svelte";
    import ErrorScreen from "./UI/ErrorScreen.svelte";

    import { onMount } from "svelte/internal";
    import { tryRehydrateWeb3, isSupportedChainId } from "../Web3";
    import { chainId, signerAddress } from "svelte-ethers-store";
    import { enableMapSet } from "immer";

    export let game: Game;

    enableMapSet();

    onMount(async () => {
        await tryRehydrateWeb3();
    });
</script>

{#if $errorScreenStore !== undefined}
    <div>
        <ErrorScreen />
    </div>
{:else if $errorStore.length > 0}
    <div>
        <ErrorDialog />
    </div>
{:else if $loginSceneVisibleStore || !$signerAddress || !$chainId || !isSupportedChainId($chainId)}
    <div>
        <ConnectScene {game} />
    </div>
{:else if $selectCharacterSceneVisibleStore}
    <div>
        <SelectCharacterScene {game} />
    </div>
{:else if $selectCompanionSceneVisibleStore}
    <div>
        <SelectCompanionScene {game} />
    </div>
    <!-- {:else if $enableCameraSceneVisibilityStore}
    <div class="scrollable">
        <EnableCameraScene {game} />
    </div> -->
{:else}
    <MainLayout />
    <!-- {#if $chatVisibilityStore} -->
{/if}
