<script lang="ts">
    import { onMount } from "svelte";
    import { audioManagerVisibilityStore } from "../Stores/AudioManagerStore";
    import { embedScreenLayoutStore, hasEmbedScreen } from "../Stores/EmbedScreensStore";
    import { emoteMenuStore } from "../Stores/EmoteStore";
    // import { myCameraVisibilityStore } from "../Stores/MyCameraStoreVisibility";
    import { requestVisitCardsStore } from "../Stores/GameStore";
    // import { helpCameraSettingsVisibleStore } from "../Stores/HelpCameraSettingsStore";
    import { layoutManagerActionVisibilityStore } from "../Stores/LayoutManagerStore";
    import { menuIconVisiblilityStore, menuVisiblilityStore, warningContainerStore } from "../Stores/MenuStore";
    import { showReportScreenStore, userReportEmpty } from "../Stores/ShowReportScreenStore";
    import AudioManager from "./AudioManager/AudioManager.svelte";
    // import CameraControls from "./CameraControls.svelte";
    import EmbedScreensContainer from "./EmbedScreens/EmbedScreensContainer.svelte";
    // import HelpCameraSettingsPopup from "./HelpCameraSettings/HelpCameraSettingsPopup.svelte";
    import LayoutActionManager from "./LayoutActionManager/LayoutActionManager.svelte";
    import Menu from "./Menu/Menu.svelte";
    import MenuIcon from "./Menu/MenuIcon.svelte";
    // import MyCamera from "./MyCamera.svelte";
    import ReportMenu from "./ReportMenu/ReportMenu.svelte";
    import VisitCard from "./VisitCard/VisitCard.svelte";
    import WarningContainer from "./WarningContainer/WarningContainer.svelte";
    import { isMediaBreakpointDown, isMediaBreakpointUp } from "../Utils/BreakpointsUtils";
    import CoWebsitesContainer from "./EmbedScreens/CoWebsitesContainer.svelte";

    import { banMessageStore } from "../Stores/TypeMessageStore/BanMessageStore";
    import BanMessageContainer from "./TypeMessage/BanMessageContainer.svelte";
    import { textMessageStore } from "../Stores/TypeMessageStore/TextMessageStore";
    import TextMessageContainer from "./TypeMessage/TextMessageContainer.svelte";
    import { soundPlayingStore } from "../Stores/SoundPlayingStore";
    import AudioPlaying from "./UI/AudioPlaying.svelte";
    import { showLimitRoomModalStore, showShareLinkMapModalStore } from "../Stores/ModalStore";
    import LimitRoomModal from "./Modal/LimitRoomModal.svelte";
    import ShareLinkMapModal from "./Modal/ShareLinkMapModal.svelte";
    import { LayoutMode } from "../WebRtc/LayoutManager";
    import { actionsMenuStore } from "../Stores/ActionsMenuStore";
    import ActionsMenu from "./ActionsMenu/ActionsMenu.svelte";
    import Lazy from "./Lazy.svelte";
    import { showDesktopCapturerSourcePicker } from "../Stores/ScreenSharingStore";
    import UiWebsiteContainer from "./UI/Website/UIWebsiteContainer.svelte";
    import { uiWebsitesStore } from "../Stores/UIWebsiteStore";
    import { rightClickMenuStore, mouseContextStore } from "../Stores/RightClickMenuStore";
    import RightClickMenu from "./RightClickMenu/RightClickMenu.svelte";
    import TradeScreen from "./Trade/TradeScreen.svelte";
    import ProfileMenu from "./ProfileMenu/ProfileMenu.svelte";
    import { activeTradeStore } from "../Stores/TradeStore";
    import { shownProfileStore } from "../Stores/ProfileStore";
    import { skillDetailOpen } from "../Stores/SkillsStore";

    import { transactionVisibilityStore } from "../Stores/TransactionStore";
    import TransactionMenu from "./Web3/TransactionMenu.svelte";
    import QuestCompleteMenu from "./Quest/QuestCompleteMenu.svelte";
    import { showBankScreen } from "../Stores/BankStore";
    import BankScreen from "./Bank/BankScreen.svelte";
    import AchievementCompleteMenu from "./Achievements/AchievementCompleteMenu.svelte";
    import { chainId, signerAddress } from "svelte-ethers-store";
    import { gameManagerReadyStore } from "../Stores/GameStore";
    import { shownQuestStore } from "../Stores/QuestStore";
    import { showCompletionStore } from "../Stores/AchievementsStore";
    import Navigation from "./Navigation/Navigation.svelte";
    import Chat from "./Chat/Chat.svelte";
    import EmoteMenu from "./EmoteMenu/EmoteMenu.svelte";
    import SkillsMenu from "./Navigation/Skills/SkillsMenu.svelte";

    let mainLayout: HTMLDivElement;

    let displayCoWebsiteContainerMd = isMediaBreakpointUp("md");
    let displayCoWebsiteContainerLg = isMediaBreakpointDown("lg");

    const resizeObserver = new ResizeObserver(() => {
        displayCoWebsiteContainerMd = isMediaBreakpointUp("md");
        displayCoWebsiteContainerLg = isMediaBreakpointDown("lg");
    });

    onMount(() => {
        resizeObserver.observe(mainLayout);
    });
</script>

<!-- Components ordered by z-index -->
<div id="main-layout" bind:this={mainLayout}>
    <section id="main-left-column">
        <aside id="main-layout-context">
            <span style="font-size: 32px; color: white; text-shadow: 2px 2px black; font-family: 'RSChat'; ">
                {$mouseContextStore.action}
                {" "}
                <span
                    style="color:#FF9040!important;font-size: 32px; text-shadow: 2px 2px black; font-family: 'RSChat';"
                    >
                    {$mouseContextStore.context}</span
                >
            </span>
        </aside>
        <aside id="main-layout-left-aside">
            {#if $menuIconVisiblilityStore}
                <MenuIcon />
            {/if}

            {#if $embedScreenLayoutStore === LayoutMode.VideoChat || displayCoWebsiteContainerMd}
                <CoWebsitesContainer vertical={true} />
            {/if}
        </aside>
        <section id="main-layout-main">
            <Lazy
                when={$showDesktopCapturerSourcePicker}
                component={() => import("./Video/DesktopCapturerSourcePicker.svelte")}
            />

            {#if $menuVisiblilityStore}
                <Menu />
            {/if}

            {#if $banMessageStore.length > 0}
                <BanMessageContainer />
            {:else if $textMessageStore.length > 0}
                <TextMessageContainer />
            {/if}

            {#if $soundPlayingStore}
                <AudioPlaying url={$soundPlayingStore} />
            {/if}

            {#if $warningContainerStore}
                <WarningContainer />
            {/if}

            {#if $showReportScreenStore !== userReportEmpty}
                <ReportMenu />
            {/if}

            {#if $activeTradeStore}
                <TradeScreen />
            {/if}

            {#if $showBankScreen}
                <BankScreen />
            {/if}

            {#if $shownProfileStore}
                <ProfileMenu />
            {/if}

            {#if $skillDetailOpen}
                <SkillsMenu />
            {/if}

            {#if $shownQuestStore}
                <QuestCompleteMenu />
            {/if}

            {#if $showCompletionStore}
                <AchievementCompleteMenu />
            {/if}

            <!-- {#if $helpCameraSettingsVisibleStore}
            <HelpCameraSettingsPopup />
            {/if} -->

            {#if $audioManagerVisibilityStore}
                <AudioManager />
            {/if}

            {#if $showLimitRoomModalStore}
                <LimitRoomModal />
            {/if}

            {#if $showShareLinkMapModalStore}
                <ShareLinkMapModal />
            {/if}

            {#if $actionsMenuStore}
                <ActionsMenu />
            {/if}

            {#if $rightClickMenuStore}
                <RightClickMenu />
            {/if}

            {#if $transactionVisibilityStore}
                <TransactionMenu />
            {/if}

            {#if $requestVisitCardsStore}
                <VisitCard visitCardUrl={$requestVisitCardsStore} />
            {/if}

            {#if $emoteMenuStore}
                <EmoteMenu />
            {/if}

            {#if hasEmbedScreen}
                <EmbedScreensContainer />
            {/if}

            {#if $uiWebsitesStore}
                <UiWebsiteContainer />
            {/if}
            <section>
                {#if displayCoWebsiteContainerLg}
                    <CoWebsitesContainer />
                {/if}

                {#if $layoutManagerActionVisibilityStore}
                    <LayoutActionManager />
                {/if}

                <!-- {#if $myCameraVisibilityStore}
                <MyCamera />
                <CameraControls />
            {/if} -->
            </section>
        </section>

        <section id="main-layout-bottom">
            {#if $gameManagerReadyStore}
                <Chat />
            {/if}
        </section>
    </section>
    <section id="main-right-column">
        {#if $chainId && $gameManagerReadyStore}
            <Navigation />
        {/if}
    </section>
</div>

<style lang="scss">
    @import "../../style/breakpoints.scss";

    #main-layout {
        display: flex;
        &-left-aside {
            min-width: 80px;
        }
        &-baseline {
            grid-column: 1/3;
        }
    }

    #main-layout-left-aside {
        position: absolute;
        width: 120px;
        bottom: 270px;
        left: 15px;
    }

    #main-layout-context {
        position: absolute;
        top: 25px;
        left: 25px;
    }

    @include media-breakpoint-up(md) {
        #main-layout {
            grid-template-columns: 15% 85%;

            &-left-aside {
                min-width: auto;
            }
        }
    }

    @include media-breakpoint-up(sm) {
        #main-layout {
            grid-template-columns: 20% 80%;
        }
    }

    #main-layout-main {
        display: flex;
        align-items: center;
        height: calc(100% - 250px);
    }

    #main-layout-bottom {
        min-height: 250px;
    }

    #main-left-column {
        height: 100%;
        width: calc(100% - 300px);
        display: flex;
        flex-direction: column;
    }

    #main-right-column {
        min-width: 375px;
        height: 100%;
    }
</style>
