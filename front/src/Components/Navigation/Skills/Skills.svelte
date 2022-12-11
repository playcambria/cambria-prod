<script lang="ts">
    import placeholderSkills from "/resources/navigation/skills/placeholder.png";
    import tradeIcon from "/resources/icons/coins_icon.png";
    import collectorIcon from "/resources/icons/collector_icon.png";
    import minterIcon from "/resources/icons/minter_icon.png";
    import tooltipBorderBlack from "/resources/borders/tooltip-border-black.webp";
    import Tooltip from "../../Tooltip/Tooltip.svelte";
    import { skillDetailOpen } from "../../../Stores/SkillsStore";

    export let visible = false;

    const SkillDetail = {
        Trading: "Trading",
        Collecting: "Collecting",
        Mining: "Mining",
    };
    let selectedSkill = null;
</script>

<div class="skills" style={`display: ${(visible) ? 'flex' : 'none'}`}>
    <!-- <img src={placeholderSkills} alt="placeholder" style="height: 30px; width: auto;" /> -->
    <div class="skills-grid">
        <Tooltip title="Trading" on:click={() => skillDetailOpen.set("trading")}>
            <div class="skills-chip" style={`border-image: url(${tooltipBorderBlack}) 3 repeat; border-radius: 4px;`}>
                <img src={tradeIcon} alt="trade" class="skills-icon" />
                <span class="skills-label">3/99</span>
            </div>
        </Tooltip>
        <Tooltip title="Collecting" on:click={() => skillDetailOpen.set("collecting")}>
            <div class="skills-chip" style={`border-image: url(${tooltipBorderBlack}) 3 repeat; border-radius: 4px;`}>
                <img src={collectorIcon} alt="trade" class="skills-icon" />
                <span class="skills-label">3/99</span>
            </div>
        </Tooltip>
        <Tooltip title="Minting" on:click={() => skillDetailOpen.set("minting")}>
            <div class="skills-chip" style={`border-image: url(${tooltipBorderBlack}) 3 repeat; border-radius: 4px;`}>
                <img src={minterIcon} alt="trade" class="skills-icon" />
                <span class="skills-label">3/99</span>
            </div>
        </Tooltip>
    </div>
</div>

<style lang="scss">

    $bg: rgba(17, 15, 28, 1);
    $shadow: transparentize($bg, 0.3);

    .skills {
        height: 100%;
        width: 100%;
        display: flex;
        flex-direction: column;
        padding: 10%;
    }

    .skills-icon {
        position: absolute;
        left: 8px;
        top: 5px;
        height: 36px;
    }

    .skills-label {
        position: absolute;
        right: 14px;
        top: 0px;
        font-size: 30px;
    }

    .skills-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
    }

    .skills-chip {
        padding: 8px;
        border-radius: 2px;
        border: 4px solid; 
        position: relative;
        margin: 4px 8px;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: flex-start;
        border-style: solid;
        border-width: 4px;
        height: 56px;
        background-repeat: no-repeat;
        background-size: cover;
        color: white;
        background-color: rgba(17, 15, 28, 0.86);
        font-size: 20px;
        font-weight: normal;
        box-shadow: -1px -1px 1px $shadow, -1px 1px 1px $shadow, 1px 1px 1px $shadow, 1px -1px 1px $shadow;
        opacity: 1;
        transition-timing-function: ease-in-out;
        transition: all 0.3s;
        &:hover {
            background-color: rgba(17, 15, 28, 0.5);
        }
    }
</style>
