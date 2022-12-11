<script lang="ts">
    import { ChatMessageTypes } from "../../Stores/ChatStore";
    import type { ChatMessage } from "../../Stores/ChatStore";
    import { HtmlUtils } from "../../WebRtc/HtmlUtils";
    import ChatPlayerName from "./ChatPlayerName.svelte";
    import type { PlayerInterface } from "../../Phaser/Game/PlayerInterface";
    import { gameManager } from "../../Phaser/Game/GameManager";
    import { activeTradeStore } from "../../Stores/TradeStore";

    const currentPlayer = gameManager.getCurrentGameScene().CurrentPlayer;

    export let message: ChatMessage;

    export let line: number;
    const chatStyleLink = "color: white; text-decoration: underline;";

    $: author = message.author as PlayerInterface;
    $: targets = message.targets || [];
    $: texts = message.text || [];

    function urlifyText(text: string): string {
        return HtmlUtils.urlify(text, chatStyleLink);
    }
    // function renderDate(date: Date) {
    //     return date.toLocaleTimeString(navigator.language, {
    //         hour: "2-digit",
    //         minute: "2-digit",
    //     });
    // }
    function isLastIteration(index: number) {
        return targets.length - 1 === index;
    }

    let counterpartyAddress = "";

    $: if ($activeTradeStore && $activeTradeStore.counterparty) {
        counterpartyAddress = $activeTradeStore.counterparty.walletAddress?.toLowerCase() || "";
    } else {
        counterpartyAddress = "";
    }
</script>

<div class="chatElement">
    <div class="messagePart">
        {#if message.type === ChatMessageTypes.userIncoming}
            <span style="color: #90ee90">
                {#each targets as target, index}<ChatPlayerName player={target} {line} />{#if !isLastIteration(index)},
                    {/if}{/each} has joined.
            </span>
        {:else if message.type === ChatMessageTypes.userOutcoming}
            <span style="color: #ee9090">
                {#each targets as target, index}<ChatPlayerName player={target} {line} />{#if !isLastIteration(index)},
                    {/if}{/each} has left.
            </span>
        {:else if message.type === ChatMessageTypes.tradeRequest}
            <span style="color: #FFB5F3">
                {#each texts as text}
                    <div>
                        <p
                            class="trade-request"
                            on:click={() => activeTradeStore.sendTradeRequestAcceptance(author.userId)}
                        >
                            {@html urlifyText(text)}
                        </p>
                    </div>
                {/each}
            </span>
        {:else if message.type === ChatMessageTypes.completeTrade}
            <span style="color: #FFF">
                {#each texts as text}
                    <div>
                        <p class="trade-complete">
                            {@html urlifyText(text)}
                        </p>
                    </div>
                {/each}
            </span>
        {:else if message.type === ChatMessageTypes.declineTrade}
            <span style="color: #FFF">
                {#each texts as text}
                    <div>
                        <p class="trade-decline">
                            {@html urlifyText(text)}
                        </p>
                    </div>
                {/each}
            </span>
        {:else if message.type === ChatMessageTypes.tradeExpired}
            <span style="color: #FFF">
                {#each texts as text}
                    <div>
                        <p class="trade-expired">
                            {@html urlifyText(text)}
                        </p>
                    </div>
                {/each}
            </span>
        {:else if message.type === ChatMessageTypes.me}
            <!-- <h4>Me: <span class="date">({renderDate(message.date)})</span></h4> -->
            {#each texts as text}
                <div>
                    <p class="my-text">
                        {currentPlayer.playerName}: <span class="my-text-body">{@html urlifyText(text)}</span>
                    </p>
                </div>
            {/each}
        {:else}
            <!-- <h4><ChatPlayerName player={author} {line} />: <span class="date">({renderDate(message.date)})</span></h4> -->
            {#each texts as text}
                <div>
                    <p
                        class="other-text"
                        style={`color:${
                            author?.walletAddress?.toLowerCase() === counterpartyAddress ? "#e59400" : "white"
                        }; font-weight: ${
                            author?.walletAddress?.toLowerCase() === counterpartyAddress ? "bold" : "normal"
                        };`}
                    >
                        {`[Trade] ${author.name}`}
                        {": "}
                        <span
                            style={`color:${
                                author?.walletAddress?.toLowerCase() === counterpartyAddress ? "#e59400" : "#87aaee;"
                            }; font-weight: ${
                                author?.walletAddress?.toLowerCase() === counterpartyAddress ? "bold" : "normal"
                            };`}
                        >
                            {@html urlifyText(text)}
                        </span>
                    </p>
                </div>
            {/each}
        {/if}
    </div>
</div>

<style lang="scss">
    // h4,
    div.chatElement {
        display: flex;
        font-family: MonteCarlo;
        font-size: 26px;
        line-height: 26px;
        letter-spacing: 0em;
        text-shadow: 0 0 1px black, 0 0 1px black, 0 0 2px black, 0 0 2px black, 0 3px 3px black;

        .messagePart {
            flex-grow: 1;
            max-width: 100%;
            user-select: text;

            // span.date {
            //     font-size: 80%;
            //     color: gray;
            // }

            div > p {
                border-radius: 8px;
                padding: 0px;
                overflow-wrap: break-word;
                max-width: 100%;
                display: inline-block;
                margin: 0;
                // &.other-text {
                //     //background: gray;
                // }

                // &.my-text {
                //     //background: #6489ff;
                // }
            }
        }
    }
</style>
