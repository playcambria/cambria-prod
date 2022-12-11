<script lang="ts">
    import { chatMessagesStore } from "../../Stores/ChatStore";
    import ChatMessageForm from "./ChatMessageForm.svelte";
    import ChatElement from "./ChatElement.svelte";
    import { afterUpdate, beforeUpdate, onMount } from "svelte";
    import LL from "../../i18n/i18n-svelte";
    import { textInputPromptStore } from "../../Stores/TextInputAreaStore";
    import { onDestroy } from "svelte/internal";

    let listDom: HTMLElement;
    let autoscroll: boolean;
    let formInputValue: string;

    let myInput: HTMLInputElement | undefined = undefined;
    let showInputOverlay = false;

    const unsubscribeTextInputStore = textInputPromptStore.subscribe((textInputObj) => {
        showInputOverlay = typeof textInputObj !== "undefined";
    });

    beforeUpdate(() => {
        autoscroll = listDom && listDom.offsetHeight + listDom.scrollTop > listDom.scrollHeight - 20;
    });

    onMount(() => {
        listDom.scrollTo(0, listDom.scrollHeight);
    });

    afterUpdate(() => {
        if (autoscroll) listDom.scrollTo(0, listDom.scrollHeight);
        if (showInputOverlay) myInput?.focus();
    });

    onDestroy(unsubscribeTextInputStore);

    function onInputSubmit() {
        textInputPromptStore.onSubmit(formInputValue);
        formInputValue = "";
    }
</script>

<svelte:window />

<aside class="chatWindow">
    <div class="chatContainer">
        <section class="messagesList" bind:this={listDom}>
            <p class="system-text">{$LL.chat.intro()}</p>
            {#each $chatMessagesStore as message, i}
                <ChatElement {message} line={i} />
            {/each}
        </section>
        <section class="messageForm">
            <ChatMessageForm />
        </section>
    </div>
    <div class="textInputContainer" style={`display: ${showInputOverlay ? "flex" : "none"}`}>
        <span class="inputHeader" style="font-size: 30px;">
            {$textInputPromptStore?.promptText}
        </span>
        <form on:submit|preventDefault={onInputSubmit}>
            <input
                id="inputId"
                name="inputId"
                bind:value={formInputValue}
                bind:this={myInput}
                type="number"
                class="textInput"
                required
                step="any"
            />
        </form>
    </div>
</aside>

<style lang="scss">
    @import "../../../style/breakpoints.scss";

    .textInputContainer,
    .chatContainer {
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        left: 0;
    }

    .textInput {
        background: transparent;
        border: none;
        text-align: center;
        font-size: 30px;
        color: white;
    }

    .textInputContainer {
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        background-color: rgba(17, 15, 28, 1);
        z-index: 999;
    }

    input[type="number"]::-webkit-outer-spin-button,
    input[type="number"]::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }
    input[type="number"] {
        -moz-appearance: textfield;
    }

    p.system-text {
        border-radius: 8px;
        overflow-wrap: break-word;
        max-width: 100%;
        display: inline-block;
        font-size: 26px;
        letter-spacing: 0em;
        text-shadow: 0 0 1px black, 0 0 1px black, 0 0 2px black, 0 0 2px black, 0 3px 3px black;
        margin: 0;
    }

    aside.chatWindow {
        z-index: 1000;
        pointer-events: auto;
        position: absolute;
        bottom: 0;
        left: 0;
        height: 95%;
        width: 95%;
        background: rgba(17, 15, 28, 0.8);

        border: 3px solid black;

        color: whitesmoke;
        display: flex;
        flex-direction: column;

        padding: 0px;

        .messagesList {
            overflow-y: auto;
            flex: auto;
            padding: 5px 10px;
            height: calc(100% - 43px);
        }

        .messageForm {
            flex: 0 0;
            padding: 0px;
        }
    }

    @include media-breakpoint-up(xxl) {
        aside.chatWindow {
            height: 250px;
            width: 35%;
        }
    }

    @include media-breakpoint-up(sm) {
        aside.chatWindow {
            height: calc(99vh - 50px);
            width: 95vw;
        }
    }
</style>
