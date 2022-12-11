<script lang="ts">
    /* eslint-disable @typescript-eslint/no-explicit-any */
    import { fly } from "svelte/transition";
    import { skillDetailOpen } from "../../../Stores/SkillsStore";

</script>

<div class="skills-menu" transition:fly={{ y: -50, duration: 500 }}>
    <div class="header">
        <div class="image">

        </div>
        <div class="header-content">
            {$skillDetailOpen}
        </div>
        <button class="nes-btn is-error close-button" on:click={() => skillDetailOpen.set(null)}>X</button>
    </div>
    <div class="body">
        <div class="body-content">
            <div class="container">

            </div>
        </div>
    </div>
</div>

<style lang="scss" scoped>
    div {
        display: flex;
    }

    .skills-menu {
        display: flex;
        flex-direction: column;
        left: 0;
        right: 0;
        top: 4%;
        margin-left: auto;
        margin-right: auto;
        width: 450px;
        height: 600px;
        background-color: rgba(17, 15, 28, 1);
        color: white;
        border-radius: 8px;
        border: 3px solid black;
        font-size: large;
        pointer-events: auto;
        z-index: 3;
    }

    .body {
        height: 100%;
        padding: 0 12px;
    }

    .level {
        font-size: 24px;
    }

    .header,
    .footer {
        width: 100%;
    }

    .image {
        padding: 20px;
    }

    .header-content {
        padding: 20px 10px;
        justify-content: flex-start;
        text-align: center;
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: center;
        height: 80px;
        margin-top: 20px;
    }

    .header-content-name {
        font-size: 36px;
        line-height: 36px;
    }

    .header-content-twitter {
        font-size: 16px;
        line-height: 16px;
    }

    .body-content {
        padding: 0px 10px 10px 10px;
        display: flex;
        flex-direction: column;
        width: 100%;
    }

    .footer-content {
        justify-content: space-around;
    }

    .buttons {
        height: 50px;
        margin: 15px;
    }

    .close-button {
        width: 40px;
        height: 40px;
        margin-right: -10px;
        margin-top: -10px;
    }

    .container {
        display: flex;
        flex-direction: column;
        width: 100%;
        margin-top: 5px;
        margin-bottom: 10px;
    }
</style>
