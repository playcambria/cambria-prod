<script lang="ts">
    import Inventory from "./Inventory/Inventory.svelte";
    import Friends from "./Friends/Friends.svelte";
    import Equipment from "./Equipment/Equipment.svelte";
    import Spellbook from "./Spellbook/Spellbook.svelte";
    import Skills from "./Skills/Skills.svelte";
    import Objectives from "./Objectives/Objectives.svelte";
    import Settings from "./Settings/Settings.svelte";
    import inventoryColor from "/resources/navigation/icon_inventory_color.svg";
    import inventoryGray from "/resources/navigation/icon_inventory_gray.svg";
    import skillsColor from "/resources/navigation/icon_skills_color.svg";
    import skillsGray from "/resources/navigation/icon_skills_gray.svg";
    import spellbookColor from "/resources/navigation/icon_spellbook_color.svg";
    import spellbookGray from "/resources/navigation/icon_spellbook_gray.svg";
    import equipmentColor from "/resources/navigation/icon_equipment_color.svg";
    import equipmentGray from "/resources/navigation/icon_equipment_gray.svg";
    import friendsColor from "/resources/navigation/icon_friends_color.svg";
    import friendsGray from "/resources/navigation/icon_friends_gray.svg";
    import objectivesColor from "/resources/navigation/icon_objectives_color.png";
    import objectivesGray from "/resources/navigation/icon_objectives_gray.png";
    import settingsColor from "/resources/navigation/icon_settings_color.png";
    import settingsGray from "/resources/navigation/icon_settings_gray.png";
    import Tooltip from "../Tooltip/Tooltip.svelte";

    const Tabs = {
        Inventory: "Inventory",
        Objectives: "Objectives",
        Skills: "Skills",
        Equipment: "Equipment",
        Spellbook: "Spellbook",
        Friends: "Friends",
        Settings: "Settings",
    };
    let selectedTab = Tabs.Inventory;
</script>

<svelte:window />

<aside class="navigation-window">
    <div class="navigation-content">
        <Inventory visible={selectedTab === Tabs.Inventory} />
        <Objectives visible={selectedTab === Tabs.Objectives} />
        <Skills visible={selectedTab === Tabs.Skills} />
        <Spellbook visible={selectedTab === Tabs.Spellbook} />
        <Equipment visible={selectedTab === Tabs.Equipment} />
        <Friends visible={selectedTab === Tabs.Friends} />
        <Settings visible={selectedTab === Tabs.Settings} />
    </div>
    <div class="navigation-bar">
        <Tooltip title={Tabs.Inventory} on:click={() => (selectedTab = Tabs.Inventory)}>
            <img class="icon" class:hide={selectedTab !== Tabs.Inventory} src={inventoryColor} alt="inventory" />
            <img class="icon" class:hide={selectedTab === Tabs.Inventory} src={inventoryGray} alt="inventory" />
        </Tooltip>
        <Tooltip title={Tabs.Objectives} on:click={() => (selectedTab = Tabs.Objectives)}>
            <img class="icon" class:hide={selectedTab !== Tabs.Objectives} src={objectivesColor} alt="objectives" />
            <img class="icon" class:hide={selectedTab === Tabs.Objectives} src={objectivesGray} alt="objectives" />
        </Tooltip>
        <Tooltip title={Tabs.Skills} on:click={() => (selectedTab = Tabs.Skills)}>
            <img class="icon" class:hide={selectedTab !== Tabs.Skills} src={skillsColor} alt="skills" />
            <img class="icon" class:hide={selectedTab === Tabs.Skills} src={skillsGray} alt="skills" />
        </Tooltip>
        <Tooltip title={Tabs.Spellbook} on:click={() => (selectedTab = Tabs.Spellbook)}>
            <img class="icon" class:hide={selectedTab !== Tabs.Spellbook} src={spellbookColor} alt="spellbook" />
            <img class="icon" class:hide={selectedTab === Tabs.Spellbook} src={spellbookGray} alt="spellbook" />
        </Tooltip>
        <Tooltip title={Tabs.Equipment} on:click={() => (selectedTab = Tabs.Equipment)}>
            <img class="icon" class:hide={selectedTab !== Tabs.Equipment} src={equipmentColor} alt="equipment" />
            <img class="icon" class:hide={selectedTab === Tabs.Equipment} src={equipmentGray} alt="equipment" />
        </Tooltip>
        <Tooltip title={Tabs.Friends} on:click={() => (selectedTab = Tabs.Friends)}>
            <img class="icon" class:hide={selectedTab !== Tabs.Friends} src={friendsColor} alt="friends" />
            <img class="icon" class:hide={selectedTab === Tabs.Friends} src={friendsGray} alt="friends" />
        </Tooltip>
        <Tooltip title={Tabs.Settings} on:click={() => (selectedTab = Tabs.Settings)}>
            <img class="icon" class:hide={selectedTab !== Tabs.Settings} src={settingsColor} alt="settings" />
            <img class="icon" class:hide={selectedTab === Tabs.Settings} src={settingsGray} alt="settings" />
        </Tooltip>
    </div>
</aside>

<style lang="scss">
    @import "../../../style/breakpoints.scss";

    .navigation-window {
        z-index: 9999999;
        pointer-events: auto;
        position: absolute;
        display: flex;
        flex-direction: column;
        bottom: 0;
        right: 0;
        height: 40%;
        width: 40%;
        background: rgba(17, 15, 28, 0.8);
        border: 3px solid black;
        color: whitesmoke;
    }

    .navigation-content {
        display: flex;
        height: calc(100% - 50px);
    }

    .navigation-bar {
        display: flex;
        justify-content: center;
        gap: 5%;
        width: 100%;
        height: 50px;
        padding: 10px 30px;
        background-color: rgba(17, 15, 28, 1);
    }

    @include media-breakpoint-up(xxl) {
        aside.navigation-window {
            height: 55%;
            width: 375px;
        }
    }

    @include media-breakpoint-up(sm) {
        aside.navigation-window {
            height: calc(99vh - 50px);
            width: 95vw;
        }
    }

    .icon {
        cursor: pointer;
        width: 30px;
        height: 30px;
    }

    .hide {
        display: none;
    }
</style>
