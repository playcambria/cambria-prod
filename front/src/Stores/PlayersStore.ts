import { get, writable } from "svelte/store";
import type { PlayerInterface } from "../Phaser/Game/PlayerInterface";
import type { RoomConnection } from "../Connexion/RoomConnection";
import { getRandomColor } from "../WebRtc/ColorGenerator";
import { AvailabilityStatus } from "../Messages/ts-proto-generated/protos/messages";
import { friendsListStore } from "./FriendsStore";
import { activeTradeStore } from "./TradeStore";

let idCount = 0;

const players = new Map<number, PlayerInterface>();
export const playerList = writable<Map<number, PlayerInterface>>(players);
/**
 * A store that contains the list of players currently known.
 */
function createPlayersStore() {
    let players = new Map<number, PlayerInterface>();

    const { subscribe, set, update } = writable<Map<number, PlayerInterface>>(players);
    return {
        subscribe,
        connectToRoomConnection: (roomConnection: RoomConnection) => {
            players = new Map<number, PlayerInterface>();
            set(players);
            // TODO: it would be cool to unsubscribe properly here
            roomConnection.userJoinedMessageStream.subscribe((message) => {
                update((users) => {
                    console.log("NEW USER", message);
                    users.set(message.userId, {
                        userId: message.userId,
                        name: message.name,
                        characterLayers: message.characterLayers,
                        visitCardUrl: message.visitCardUrl,
                        walletAddress: message.walletAddress,
                        companion: message.companion,
                        userUuid: message.userUuid,
                        availabilityStatus: message.availabilityStatus,
                        color: getRandomColor(),
                    });
                    return users;
                });
                const walletAddress = message.walletAddress || "";
                console.log({ friends: get(friendsListStore) });
                if (walletAddress && walletAddress in get(friendsListStore)) {
                    friendsListStore.update((friends) => {
                        friends[walletAddress] = true;
                        return friends;
                    });
                }
            });
            roomConnection.userLeftMessageStream.subscribe((message) => {
                update((users) => {
                    const user = users.get(message.userId);
                    const walletAddress = user?.walletAddress || "";
                    console.log(`User with walletAddress ${walletAddress} has left`);
                    const currentTrade = get(activeTradeStore);
                    if (currentTrade?.counterparty?.walletAddress === walletAddress) {
                        activeTradeStore.handleDeclineActiveTrade();
                    }
                    if (walletAddress && walletAddress in get(friendsListStore)) {
                        friendsListStore.update((friends) => {
                            friends[walletAddress] = false;
                            return friends;
                        });
                    }
                    users.delete(message.userId);
                    return users;
                });
            });
        },
        getPlayerById(userId: number): PlayerInterface | undefined {
            return players.get(userId);
        },
        addFacticePlayer(name: string): number {
            let userId: number | null = null;
            players.forEach((p) => {
                if (p.name === name) userId = p.userId;
            });
            if (userId) return userId;
            const newUserId = idCount--;
            update((users) => {
                users.set(newUserId, {
                    userId: newUserId,
                    name,
                    characterLayers: [],
                    visitCardUrl: null,
                    walletAddress: null,
                    companion: null,
                    availabilityStatus: AvailabilityStatus.ONLINE,
                    userUuid: "dummy",
                    color: getRandomColor(),
                });
                return users;
            });
            return newUserId;
        },
    };
}

export const playersStore = createPlayersStore();
