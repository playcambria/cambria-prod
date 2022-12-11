import { writable, get } from "svelte/store";

// Type of Input Prompt (Context) 
export enum TextInputType {
    TRADE_AMOUNT_INPUT = "trade_amount_input",
}

export type TextInputPrompt = {
    promptText: string;
    callback: (userInput: string) => void;
}

function createTextInputPromptStore() {
    const { subscribe, set } = writable<TextInputPrompt | undefined>(undefined);

    return {
        subscribe,
        initialize: (promptText: string, callback: (userInput: string) => void) => {
            const inputPrompt: TextInputPrompt = {
                promptText,
                callback,
            };
            set(inputPrompt);
        },
        onSubmit: (input: string) => {
            const store = get(textInputPromptStore);
            if (store) {
                store.callback(input);
                set(undefined);
            } else {
                console.error("Store no longer exists");
            }
        },
        clear: () => {
            set(undefined);
        }
    };
}

export const textInputPromptStore = createTextInputPromptStore();
