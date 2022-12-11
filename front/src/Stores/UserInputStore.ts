import { derived } from "svelte/store";
import { menuInputFocusStore } from "./MenuStore";
import { showReportScreenStore, userReportEmpty } from "./ShowReportScreenStore";

//derived from the focus on Menu, ConsoleGlobal, Chat and ...
export const enableUserInputsStore = derived(
    [menuInputFocusStore, showReportScreenStore],
    ([$menuInputFocusStore, $showReportScreenStore]) => {
        return !$menuInputFocusStore && !($showReportScreenStore !== userReportEmpty);
    }
);
