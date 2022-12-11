<script lang="ts">
    import { rightClickMenuStore } from "../../Stores/RightClickMenuStore";
    import { onDestroy } from "svelte";

    import type { RightClickMenuAction } from "../../Stores/RightClickMenuStore";
    import type { Unsubscriber } from "svelte/store";
    import type { RightClickMenuData } from "../../Stores/RightClickMenuStore";

    let rightClickMenuData: RightClickMenuData | undefined;
    let sortedActions: RightClickMenuAction[] | undefined;

    let rightClickMenuStoreUnsubscriber: Unsubscriber | null;

    rightClickMenuStoreUnsubscriber = rightClickMenuStore.subscribe((value) => {
        rightClickMenuData = value;
        if (rightClickMenuData) {
            sortedActions = [...rightClickMenuData.actions.values()].sort((a, b) => {
                const ap = a.priority ?? 0;
                const bp = b.priority ?? 0;
                if (ap > bp) {
                    return -1;
                }
                if (ap < bp) {
                    return 1;
                } else {
                    return 0;
                }
            });
        }
    });

    function onMouseOut() {
        if (rightClickMenuData) {
            // On moving mouse away, close context menu
            rightClickMenuStore.clear();
        }
    }

    onDestroy(() => {
        if (rightClickMenuStoreUnsubscriber) {
            rightClickMenuStoreUnsubscriber();
        }
    });
</script>

{#if rightClickMenuData && rightClickMenuData.visible}
    <div
        class="rightClick-menu"
        style="top:{`${rightClickMenuData.y}px`}; left:{`${rightClickMenuData.x}px`};"
        on:mouseleave={onMouseOut}
    >
        <div class="rightClick-menu-header">Choose Option</div>
        <div class="rightClick">
            {#each sortedActions ?? [] as action}
                <button
                    type="button"
                    class:disabled={action.disabled}
                    class="menu-option"
                    disabled={action.disabled}
                    on:click|preventDefault={() => {
                        action.callback();
                    }}
                >
                    {action.actionName}
                    {" "}
                    <span style="color:#FF9040!important"
                        >{action.actionName !== "View Profile" && action.actionContext && action.actionContext.length > 0 ? action.actionContext.slice(0, 15) : ""}</span
                    >
                </button>
            {/each}
        </div>
    </div>
{/if}

<style lang="scss">
    .rightClick-menu {
        position: absolute;
        // left: 50%;
        // transform: translate(-50%, 0);
        width: 220px !important;
        height: max-content !important;
        max-height: 40vh;
        // margin-top: 200px;
        font-family: "RSChat";
        z-index: 99999999;

        border: 2px solid black;

        pointer-events: auto;
        background-color: #5d5447;
        color: #fff;

        .rightClick-menu-header {
            background-color: black;
            color: rgba(255, 255, 255, 0.87);
            padding: 1px 22px 1px 14px;
            font-size: x-large;
        }

        .rightClick {
            max-height: 30vh;
            width: 100%;
            display: block;
            overflow-x: hidden;
            overflow-y: auto;

            button {
                width: calc(100%);
                text-align: left;
            }
        }

        .menu-option {
            padding: 1px 25px 1px 15px;
            cursor: default;
            font-size: x-large;
            background-color: #5d5447;
            border: none;
            color: #fff;

            &:hover {
                color: #ffff00;
            }

            &.disabled {
                color: #999;
                &:hover {
                    color: #999;
                }
            }
        }

        .rightClick::-webkit-scrollbar {
            display: none;
        }
    }
</style>
