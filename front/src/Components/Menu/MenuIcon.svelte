<script lang="ts">
    // import logoTalk from "../images/logo-message-pixel.png";
    import logoCambriaIcon from "../images/logo-CAMBRIA-pixel.png";
    import logoInvite from "../images/logo-invite-pixel.png";
    import logoRegister from "../images/logo-register-pixel.png";
    import iconEmoji from "/resources/icons/joy.png";
    // import { chatVisibilityStore } from "../../Stores/ChatStore";
    import { limitMapStore } from "../../Stores/GameStore";
    import { get } from "svelte/store";
    import { ADMIN_URL } from "../../Enum/EnvironmentVariable";
    import { showShareLinkMapModalStore } from "../../Stores/ModalStore";
    import LL from "../../i18n/i18n-svelte";
    import { analyticsClient } from "../../Administration/AnalyticsClient";
    import { shownProfileStore } from "../../Stores/ProfileStore";
    import { signerAddress } from "svelte-ethers-store";
    import { gameManager } from "../../Phaser/Game/GameManager";
    import { emoteMenuStore } from "../../Stores/EmoteStore";
    import { shownQuestStore } from "../../Stores/QuestStore";
    import { showBankScreen } from "../../Stores/BankStore";

    let miniLogo = logoCambriaIcon;

    // function showMenu() {
    //     menuVisiblilityStore.set(!get(menuVisiblilityStore));
    // }

    function showMenu() {
        const playerName = gameManager.getCurrentGameScene()?.CurrentPlayer?.playerName;
        const walletAddress = $signerAddress;

        if (playerName && walletAddress) {
            shownProfileStore.set({
                walletAddress,
                playerName,
            });
        }
    }

    function showEmoteMenu() {
        if (get(emoteMenuStore)) {
            emoteMenuStore.closeEmoteMenu();
        } else {
            emoteMenuStore.openEmoteMenu();
        }

        // // Auto-open Game item tab
        // itemType.set(ItemTypes.Game);
    }

    function showUserQuestMenu() {
        if (get(shownQuestStore)) {
            shownQuestStore.set(null);
        } else {
            shownQuestStore.set({
                id: 1,
                name: "First Trade",
                rewards: [
                    { name: "Trading XP", amount: 2000 },
                    { name: "Cat (item)", amount: 1 },
                ],
            });
        }
    }

    // function showChat() {
    //     chatVisibilityStore.set(true);
    // }

    function register() {
        window.open(`${ADMIN_URL}/second-step-register`, "_self");
    }

    function showInvite() {
        showShareLinkMapModalStore.set(true);
    }

    function noDrag() {
        return false;
    }
</script>

<svelte:window />

<main class="menuIcon noselect">
    {#if $limitMapStore}
        <img
            src={logoInvite}
            alt={$LL.menu.icon.open.invite()}
            class="nes-pointer"
            draggable="false"
            on:dragstart|preventDefault={noDrag}
            on:click={() => analyticsClient.openInvite()}
            on:click={showInvite}
        />
        <img
            src={logoRegister}
            alt={$LL.menu.icon.open.register()}
            class="nes-pointer"
            draggable="false"
            on:dragstart|preventDefault={noDrag}
            on:click={() => analyticsClient.openRegister()}
            on:click={register}
        />
    {:else}
        <img
            src={miniLogo}
            alt={"menu"}
            class="nes-pointer"
            draggable="false"
            on:dragstart|preventDefault={noDrag}
            on:click={() => analyticsClient.openedMenu()}
            on:click={showMenu}
        />
        <img
            src={iconEmoji}
            alt={"emoji"}
            class="nes-pointer"
            draggable="false"
            on:dragstart|preventDefault={noDrag}
            on:click={() => analyticsClient.openedMenu()}
            on:click={showEmoteMenu}
        />
        <!-- <img
            src={iconEmoji}
            alt={"quest"}
            class="nes-pointer"
            draggable="false"
            on:dragstart|preventDefault={noDrag}
            on:click={showUserQuestMenu}
        /> -->
        <!-- <img
            src={iconEmoji}
            alt={"quest"}
            class="nes-pointer"
            draggable="false"
            on:dragstart|preventDefault={noDrag}
            on:click={() => showBankScreen.set(true)}
        /> -->
    {/if}
</main>

<style lang="scss">
    @import "../../../style/breakpoints.scss";

    .menuIcon {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        margin-top: 20%;
        z-index: 800;
        position: relative;

        img {
            pointer-events: auto;
            width: 60px;
            padding-top: 0;
            margin: 5%;
        }
    }

    .menuIcon img:hover {
        transform: scale(1.2);
    }

    @include media-breakpoint-up(sm) {
        .menuIcon {
            margin-top: 10%;
            img {
                pointer-events: auto;
                width: 60px;
                padding-top: 0;
            }
        }
        .menuIcon img:hover {
            transform: scale(1.2);
        }
    }

    @include media-breakpoint-up(md) {
        .menuIcon {
            img {
                width: 50px;
            }
        }
    }
</style>
