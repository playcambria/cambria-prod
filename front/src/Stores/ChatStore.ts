import { writable } from "svelte/store";
import { playersStore } from "./PlayersStore";
import type { PlayerInterface } from "../Phaser/Game/PlayerInterface";
import { iframeListener } from "../Api/IframeListener";
import { Subject } from "rxjs";

export const chatVisibilityStore = writable(false);
export const chatInputFocusStore = writable(false);

const _newChatMessageSubject = new Subject<string>();
export const newChatMessageSubject = _newChatMessageSubject.asObservable();

export enum ChatMessageTypes {
    text = 1,
    me,
    userIncoming,
    userOutcoming,
    tradeRequest,
    completeTrade,
    declineTrade,
    tradeExpired,
}

export interface ChatMessage {
    type: ChatMessageTypes;
    date: Date;
    author?: PlayerInterface;
    targets?: PlayerInterface[];
    text?: string[];
}

function getAuthor(authorId: number): PlayerInterface {
    const author = playersStore.getPlayerById(authorId);
    if (!author) {
        throw new Error("Could not find data for author " + authorId);
    }
    return author;
}

function createChatMessagesStore() {
    const { subscribe, update } = writable<ChatMessage[]>([]);

    return {
        subscribe,
        addIncomingUser(authorId: number) {
            update((list) => {
                const lastMessage = list[list.length - 1];
                if (lastMessage && lastMessage.type === ChatMessageTypes.userIncoming && lastMessage.targets) {
                    lastMessage.targets.push(getAuthor(authorId));
                } else {
                    list.push({
                        type: ChatMessageTypes.userIncoming,
                        targets: [getAuthor(authorId)],
                        date: new Date(),
                    });
                }
                return list;
            });
        },
        addOutcomingUser(authorId: number) {
            update((list) => {
                const lastMessage = list[list.length - 1];
                if (lastMessage && lastMessage.type === ChatMessageTypes.userOutcoming && lastMessage.targets) {
                    lastMessage.targets.push(getAuthor(authorId));
                } else {
                    list.push({
                        type: ChatMessageTypes.userOutcoming,
                        targets: [getAuthor(authorId)],
                        date: new Date(),
                    });
                }
                return list;
            });
        },
        addPersonnalMessage(text: string) {
            iframeListener.sendUserInputChat(text);

            _newChatMessageSubject.next(text);
            update((list) => {
                const lastMessage = list[list.length - 1];
                if (lastMessage && lastMessage.type === ChatMessageTypes.me && lastMessage.text) {
                    lastMessage.text.push(text);
                } else {
                    list.push({
                        type: ChatMessageTypes.me,
                        text: [text],
                        date: new Date(),
                    });
                }

                return list;
            });
        },
        /**
         * @param origin The iframe that originated this message (if triggered from the Scripting API), or undefined otherwise.
         */
        addExternalMessage(authorId: number, text: string, origin?: Window) {
            update((list) => {
                const lastMessage = list[list.length - 1];
                if (
                    lastMessage &&
                    lastMessage.type === ChatMessageTypes.text &&
                    lastMessage.text &&
                    lastMessage?.author?.userId === authorId
                ) {
                    lastMessage.text.push(text);
                } else {
                    list.push({
                        type: ChatMessageTypes.text,
                        text: [text],
                        author: getAuthor(authorId),
                        date: new Date(),
                    });
                }

                iframeListener.sendUserInputChat(text, origin);
                return list;
            });
            // chatVisibilityStore.set(true);
        },
        addTradeRequestMessage(initiator: number, text: string) {
            update((list) => {
                list.push({
                    type: ChatMessageTypes.tradeRequest,
                    text: [text],
                    date: new Date(),
                    author: getAuthor(initiator),
                });
                return list;
            });
        },
        addTradeCompletedMessage(initiator: number, text: string) {
            update((list) => {
                list.push({
                    type: ChatMessageTypes.completeTrade,
                    text: [text],
                    date: new Date(),
                    author: getAuthor(initiator),
                });
                return list;
            });
        },
        addTradeDeclineMessage(initiator: number, text: string) {
            update((list) => {
                list.push({
                    type: ChatMessageTypes.declineTrade,
                    text: [text],
                    date: new Date(),
                    author: getAuthor(initiator),
                });
                return list;
            });
        },
        addTradeExpiredMessage(text: string) {
            update((list) => {
                list.push({
                    type: ChatMessageTypes.tradeExpired,
                    text: [text],
                    date: new Date(),
                });
                return list;
            });
        },
    };
}
export const chatMessagesStore = createChatMessagesStore();
export const chatMessageStore = writable<string>("");

function createChatSubMenuVisibilityStore() {
    const { subscribe, update } = writable<string>("");

    return {
        subscribe,
        openSubMenu(playerName: string, index: number) {
            const id = playerName + index;
            update((oldValue) => {
                return oldValue === id ? "" : id;
            });
        },
    };
}

export const chatSubMenuVisibilityStore = createChatSubMenuVisibilityStore();
