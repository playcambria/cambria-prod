<script lang="ts">
    import settingsLogo from "/resources/logos/settings_header.png";

    export let visible = false;
</script>

<div class="settings" style={`display: ${visible ? "flex" : "none"}`}>
    <div style="text-align: center;">
        <img src={settingsLogo} alt="settings-header" style="height: 25px" />
        <div style="display: flex; flex-direction: column; align-items: flex-start; justify-content: flex-start; margin-top: 2rem;">
            <label>
                <input type="checkbox" class="nes-checkbox is-dark" checked={false} />
                <span style="font-size: 20px; margin-left: 6px;">Show Spam / Airdrop NFTs</span>
            </label>
            <label>
                <input type="checkbox" class="nes-checkbox is-dark" checked />
                <span style="font-size: 20px; margin-left: 6px;">Lorem Ipsum Doloret</span>
            </label>
            <label>
                <input type="checkbox" class="nes-checkbox is-dark" checked />
                <span style="font-size: 20px; margin-left: 6px;">Lorem Ipsum Doloret</span>
            </label>
        </div>
    </div>
    <div style="margin-bottom: 1.5rem; text-align: center;">
        <div>
            <span>License: GPL v3, forked from WorkAdventure </span>
        </div>
        <div>
            <span><a href="https://github.com/triple-finance/cambria-prod" target="_blank" alt="src">Source (on GH)</a></span>
        </div>
    </div>
</div>

<style lang="scss">
    .settings {
        height: 100%;
        width: 100%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: center;
        flex-direction: column;
        padding-top: 3rem;
    }
</style>
