<script lang="ts">
    import { chatMessagesStore, chatMessageStore, chatInputFocusStore } from "../../Stores/ChatStore";
    import { gameManager } from "../../Phaser/Game/GameManager";
    import { Player } from "../../Phaser/Player/Player";
    import { gameKeyboardStore } from "../../Stores/GameKeyboardStore";
    import { onMount, onDestroy } from "svelte";
    import { signerAddress } from "svelte-ethers-store";

    let currentPlayer: Player;

    function fetchCurrentPlayer() {
        try {
            currentPlayer = gameManager.getCurrentGameScene().CurrentPlayer;
        } catch (err) {
            console.error(err);
        }
        if (!currentPlayer) {
            setTimeout(fetchCurrentPlayer, 1000);
        }
    }

    fetchCurrentPlayer();

    export const handleForm = {
        blur() {
            inputElement.blur();
        },
    };
    let inputElement: HTMLElement;
    let newMessageText = "";

    $: if ($gameKeyboardStore) {
        // This is very hacky - find some other way of bridging game keyboard events -> DOM-based chat
        if (inputElement) {
            inputElement.focus();
            gameKeyboardStore.set(undefined);
        }
    }

    function onFocus() {
        chatInputFocusStore.set(true);
    }

    function onBlur() {
        chatInputFocusStore.set(false);
    }

    function saveMessage() {
        if (!newMessageText) return;
        currentPlayer.say(newMessageText);
        chatMessagesStore.addPersonnalMessage(newMessageText);
        chatMessageStore.set(newMessageText);
        newMessageText = "";
    }

    const messages = [
        "Buying all Rojo / Foust / Helix for USDC or Gen 1s ⬇️",
        "buying rojo, foust, helix - trade me",
        "Selling Gen1 - trade 0x93",
        "Selling 444, 555 - for all gen1",
    ];

    const messages2 = [
        "Sell cheapest single digit faceless - trade",
        "Trading Remain calm #609 + The Failed Experiment #238 for The Sun",
        "doing Helix #15 swap with The Imprisoned 😹😹",
        "Sell cheapest single digit faceless - trade",
    ];

    let autoChat: any;
    let currentCounter = 0;
    const enableAutoChat = false;
    onMount(() => {
        if (enableAutoChat) {
            autoChat = setInterval(() => {
                if (
                    $signerAddress &&
                    $signerAddress.toLowerCase() === "0xCc2E94d47E67786D8262ae4C5C48052089b9046B".toLowerCase()
                ) {
                    currentPlayer.say(messages[currentCounter]);
                    chatMessagesStore.addPersonnalMessage(messages[currentCounter]);
                    chatMessageStore.set(messages[currentCounter]);
                    newMessageText = "";
                    if (currentCounter === 3) {
                        currentCounter = 0;
                    } else {
                        currentCounter++;
                    }
                } else if (
                    $signerAddress &&
                    $signerAddress.toLowerCase() === "0x9e352CD0bd893d1b0cB783b057fd68De27AD3c92".toLowerCase()
                ) {
                    currentPlayer.say(messages2[currentCounter]);
                    chatMessagesStore.addPersonnalMessage(messages2[currentCounter]);
                    chatMessageStore.set(messages2[currentCounter]);
                    newMessageText = "";
                    if (currentCounter === 3) {
                        currentCounter = 0;
                    } else {
                        currentCounter++;
                    }
                }
            }, 6000);
        }
    });

    onDestroy(() => {
        clearInterval(autoChat);
    });
</script>

<form on:submit|preventDefault={saveMessage}>
    <span class="prefix">{currentPlayer?.playerName || ""}:</span>
    <input
        type="text"
        bind:value={newMessageText}
        placeholder="*"
        bind:this={inputElement}
        on:focus={onFocus}
        on:blur={onBlur}
    />
</form>

<style lang="scss">
    form {
        display: flex;
        padding: 9px 10px;
        background-color: rgba(17, 15, 28, 1);
        align-items: center;
        font-family: MonteCarlo;
        font-size: 26px;
        line-height: 26px;

        input {
            flex: auto;
            background-color: rgba(17, 15, 28, 1);
            color: white;
            border-bottom-left-radius: 4px;
            border-top-left-radius: 4px;
            border: none;
            padding-left: 6px;
            min-width: 0; //Needed so that the input doesn't overflow the container in firefox
            outline: none;
        }
        input::placeholder {
            color: white;
        }
    }
</style>
