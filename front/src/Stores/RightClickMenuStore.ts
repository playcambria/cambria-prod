import { writable, derived, get } from "svelte/store";
import { waScaleManager } from "../Phaser/Services/WaScaleManager";
import { coWebsiteManager } from "../WebRtc/CoWebsiteManager";

// Action Type
export type RightClickMenuAction = {
    actionName: string;
    actionContext: string;
    callback: () => void;
    protected?: boolean;
    priority?: number;
    disabled?: boolean;
};

// Action Data
export interface RightClickMenuData {
    actions: Map<string, RightClickMenuAction>;
    x: number;
    y: number;
    numExpectedActions: number;
    visible: boolean;
}

type MenuCoordinates = {
    x: number;
    y: number;
};

function applyZoomAndBoundsOffset(
    x: number,
    y: number,
    numExpectedActions: number,
    ignoreZoom?: boolean
): MenuCoordinates {
    // Apply two transformations to the x, y coordinates of the mouse pointer event from Phaser
    // #1 - Adjust for current in-game zoom (scale).
    // We need to do this b/c the menu is rendered by svelte on top of the game, vs in-game.
    // #2 - Adjust for height of the menu, to ensure that the context menu does not get rendered outside of the browser window

    const actualZoom = ignoreZoom ? 1 : waScaleManager.getActualZoom();
    const padding = 15; // giving the x,y a bit of padding (towards the top-left in relation to the cursor pos)
    const actionHeight = 30 + 10; // height of each action button
    const menuHeight = actionHeight * numExpectedActions; // TODO: get this dynamically with offsetHeight
    const menuWidth = 270; // TODO: get this dynamically with offsetWidth

    const actualX = x * actualZoom;
    const actualY = y * actualZoom;

    const { width, height } = coWebsiteManager.getGameSize();
    const offsetLeft = width - actualX < menuWidth ? width - menuWidth - padding : actualX - padding;
    const offsetTop = height - actualY < menuHeight ? height - menuHeight - padding : actualY - padding;

    return {
        x: offsetLeft,
        y: offsetTop,
    };
}

function createRightClickMenuStore() {
    const { subscribe, update, set } = writable<RightClickMenuData | undefined>(undefined);

    return {
        subscribe,
        initialize: (x: number, y: number, numExpectedActions: number, ignoreZoom?: boolean) => {
            const offsetCoordinates = applyZoomAndBoundsOffset(x, y, numExpectedActions, ignoreZoom);
            set({
                actions: new Map<string, RightClickMenuAction>(),
                x: offsetCoordinates.x,
                y: offsetCoordinates.y,
                numExpectedActions,
                visible: false,
            });
        },
        showMenu: (x: number, y: number, numExpectedActions: number, ignoreZoom?: boolean) => {
            const offsetCoordinates = applyZoomAndBoundsOffset(x, y, numExpectedActions, ignoreZoom);
            update((prev: any) => {
                if (prev) {
                    return {
                        ...prev,
                        x: offsetCoordinates.x,
                        y: offsetCoordinates.y,
                        visible: true,
                    }
                } else {
                    return undefined;
                }
            });
        },
        triggerDefault: () => {
            const current = get(rightClickMenuStore);
            if (current && current.actions) {
                const values = [...current.actions.values()];
                const sortedActions = values.sort((a, b) => {
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
                if (sortedActions && sortedActions.length > 0) {
                    sortedActions[0].callback();
                }
            }
        },
        addAction: (action: RightClickMenuAction) => {
            update((data) => {
                data?.actions.set(action.actionName, action);
                return data;
            });
        },
        removeAction: (actionName: string) => {
            update((data) => {
                data?.actions.delete(actionName);
                return data;
            });
        },
        /**
         * Hides / resets store 
         */
        clear: () => {
            set(undefined);
        },
        /**
         * Hides default initialized hover text if we mouse away (and right-click menu is not visible) 
         */
        clearIfNotVisible: () => {
            const current = get(rightClickMenuStore);
            if (current && current.visible === false) {
                set(undefined);
            }
        }
    };
}

export const rightClickMenuStore = createRightClickMenuStore();

export const mouseContextStore = derived(
    rightClickMenuStore,
    $rightClickMenuStore => {
        if ($rightClickMenuStore && $rightClickMenuStore.actions) {
            if ($rightClickMenuStore.visible === true) {
                return {
                    action: "",
                    context: "",
                };
            } else {
                const values = [...$rightClickMenuStore.actions.values()];
                if (values && values.length > 0) {
                    const sortedActions = values.sort((a, b) => {
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
                    return {
                        action: sortedActions[0].actionName,
                        context: sortedActions[0].actionContext,
                    };
                } else {
                    return {
                        action: "",
                        context: "",
                    };
                }
            }
        } else {
            return {
                action: "",
                context: "",
            };
        }
    }
);