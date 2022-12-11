import { PointInterface } from "./Websocket/PointInterface";
import { Group } from "./Group";
import { User, UserSocket } from "./User";
import { PositionInterface } from "../Model/PositionInterface";
import {
    EmoteCallback,
    ChatCallback,
    EntersCallback,
    LeavesCallback,
    LockGroupCallback,
    MovesCallback,
    PlayerDetailsUpdatedCallback,
} from "../Model/Zone";
import { PositionNotifier } from "./PositionNotifier";
import { Movable } from "../Model/Movable";
import {
    BatchToPusherRoomMessage,
    EmoteEventMessage,
    ChatEventMessage,
    JoinRoomMessage,
    SetPlayerDetailsMessage,
    SubToPusherRoomMessage,
    VariableWithTagMessage,
    ServerToClientMessage,
    PfpUpdateMessage,
} from "../Messages/generated/messages_pb";
import { ProtobufUtils } from "../Model/Websocket/ProtobufUtils";
import { RoomSocket, ZoneSocket } from "../RoomManager";
import { Admin } from "../Model/Admin";
import { adminApi } from "../Services/AdminApi";
import { isMapDetailsData, MapDetailsData, MapThirdPartyData } from "../Messages/JsonMessages/MapDetailsData";
import { ITiledMap } from "@workadventure/tiled-map-type-guard/dist";
import { mapFetcher } from "../Services/MapFetcher";
import { VariablesManager } from "../Services/VariablesManager";
import {
    ADMIN_API_URL,
    BBB_SECRET,
    BBB_URL,
    JITSI_ISS,
    JITSI_URL,
    SECRET_JITSI_KEY,
} from "../Enum/EnvironmentVariable";
import { LocalUrlError } from "../Services/LocalUrlError";
import { emitErrorOnRoomSocket } from "../Services/MessageHelpers";
import { VariableError } from "../Services/VariableError";
import { ModeratorTagFinder } from "../Services/ModeratorTagFinder";
import { MapBbbData, MapJitsiData } from "../Messages/JsonMessages/MapDetailsData";
import { MapLoadingError } from "../Services/MapLoadingError";
import { PfpUpdateCallback } from "./Zone";

export type ConnectCallback = (user: User, group: Group) => void;
export type DisconnectCallback = (user: User, group: Group) => void;

export class GameRoom {
    // Users, sorted by ID
    private readonly users = new Map<number, User>();
    private readonly usersByUuid = new Map<string, User>();
    private readonly groups: Map<number, Group> = new Map<number, Group>();
    private readonly admins = new Set<Admin>();

    private itemsState = new Map<number, unknown>();

    private readonly positionNotifier: PositionNotifier;
    private versionNumber = 1;
    private nextUserId = 1;

    private roomListeners: Set<RoomSocket> = new Set<RoomSocket>();

    private constructor(
        public readonly roomUrl: string,
        private mapUrl: string,
        private readonly connectCallback: ConnectCallback,
        private readonly disconnectCallback: DisconnectCallback,
        private readonly minDistance: number,
        private readonly groupRadius: number,
        onEnters: EntersCallback,
        onMoves: MovesCallback,
        onLeaves: LeavesCallback,
        onEmote: EmoteCallback,
        onChat: ChatCallback,
        onPfpUpdate: PfpUpdateCallback,
        onLockGroup: LockGroupCallback,
        onPlayerDetailsUpdated: PlayerDetailsUpdatedCallback,
        private thirdParty: MapThirdPartyData | undefined
    ) {
        // A zone is 10 sprites wide.
        this.positionNotifier = new PositionNotifier(
            320,
            320,
            onEnters,
            onMoves,
            onLeaves,
            onEmote,
            onChat,
            onPfpUpdate,
            onLockGroup,
            onPlayerDetailsUpdated
        );
    }

    public static async create(
        roomUrl: string,
        connectCallback: ConnectCallback,
        disconnectCallback: DisconnectCallback,
        minDistance: number,
        groupRadius: number,
        onEnters: EntersCallback,
        onMoves: MovesCallback,
        onLeaves: LeavesCallback,
        onEmote: EmoteCallback,
        onChat: ChatCallback,
        onPfpUpdate: PfpUpdateCallback,
        onLockGroup: LockGroupCallback,
        onPlayerDetailsUpdated: PlayerDetailsUpdatedCallback
    ): Promise<GameRoom> {
        const mapDetails = await GameRoom.getMapDetails(roomUrl);

        const gameRoom = new GameRoom(
            roomUrl,
            mapDetails.mapUrl,
            connectCallback,
            disconnectCallback,
            minDistance,
            groupRadius,
            onEnters,
            onMoves,
            onLeaves,
            onEmote,
            onChat,
            onPfpUpdate,
            onLockGroup,
            onPlayerDetailsUpdated,
            mapDetails.thirdParty ?? undefined
        );

        return gameRoom;
    }

    public getUsers(): Map<number, User> {
        return this.users;
    }

    public getUserByUuid(uuid: string): User | undefined {
        return this.usersByUuid.get(uuid);
    }
    public getUserById(id: number): User | undefined {
        return this.users.get(id);
    }
    public getUsersByUuid(uuid: string): User[] {
        const userList: User[] = [];
        for (const user of this.users.values()) {
            if (user.uuid === uuid) {
                userList.push(user);
            }
        }
        return userList;
    }

    public join(socket: UserSocket, joinRoomMessage: JoinRoomMessage): User {
        const positionMessage = joinRoomMessage.getPositionmessage();
        if (positionMessage === undefined) {
            throw new Error("Missing position message");
        }
        const position = ProtobufUtils.toPointInterface(positionMessage);

        const user = new User(
            this.nextUserId,
            joinRoomMessage.getUseruuid(),
            joinRoomMessage.getIpaddress(),
            position,
            this.positionNotifier,
            joinRoomMessage.getAvailabilitystatus(),
            socket,
            joinRoomMessage.getTagList(),
            joinRoomMessage.getVisitcardurl(),
            joinRoomMessage.getWalletaddress(),
            joinRoomMessage.getName(),
            ProtobufUtils.toCharacterLayerObjects(joinRoomMessage.getCharacterlayerList()),
            joinRoomMessage.getCompanion()
        );
        this.nextUserId++;
        this.users.set(user.id, user);
        this.usersByUuid.set(user.uuid, user);
        this.updateUserGroup(user);

        // Notify admins
        for (const admin of this.admins) {
            admin.sendUserJoin(user.uuid, user.name, user.IPAddress);
        }

        return user;
    }

    public leave(user: User) {
        const userObj = this.users.get(user.id);
        if (userObj === undefined) {
            console.warn("User ", user.id, "does not belong to this game room! It should!");
        }
        if (userObj !== undefined && typeof userObj.group !== "undefined") {
            this.leaveGroup(userObj);
        }

        this.users.delete(user.id);
        this.usersByUuid.delete(user.uuid);

        if (userObj !== undefined) {
            this.positionNotifier.leave(userObj);
        }

        // Notify admins
        for (const admin of this.admins) {
            admin.sendUserLeft(user.uuid /*, user.name, user.IPAddress*/);
        }
    }

    public isEmpty(): boolean {
        return this.users.size === 0 && this.admins.size === 0 && this.roomListeners.size === 0;
    }

    public updatePosition(user: User, userPosition: PointInterface): void {
        user.setPosition(userPosition);
        this.updateUserGroup(user);
    }

    updatePlayerDetails(user: User, playerDetailsMessage: SetPlayerDetailsMessage) {
        user.updateDetails(playerDetailsMessage);
        if (user.group !== undefined && user.silent) {
            this.leaveGroup(user);
        }
    }

    private updateUserGroup(user: User): void {
        if (user.silent) {
            return;
        }

        const enableGroups = false;
        if (!enableGroups) {
            return;
        }

        const group = user.group;
        const closestItem: User | Group | null = this.searchClosestAvailableUserOrGroup(user);

        if (group === undefined) {
            // If the user is not part of a group:
            //  should he join a group?

            // If the user is moving, don't try to join
            if (user.getPosition().moving) {
                return;
            }

            if (closestItem !== null) {
                if (closestItem instanceof Group) {
                    // Let's join the group!
                    closestItem.join(user);
                    closestItem.setOutOfBounds(false);
                } else {
                    const closestUser: User = closestItem;
                    const group: Group = new Group(
                        this.roomUrl,
                        [user, closestUser],
                        this.groupRadius,
                        this.connectCallback,
                        this.disconnectCallback,
                        this.positionNotifier
                    );
                    this.groups.set(group.getId(), group);
                }
            }
        } else {
            let hasKickOutSomeone = false;

            const previewNewGroupPosition = group.previewGroupPosition();

            if (!previewNewGroupPosition) {
                this.leaveGroup(user);
                return;
            }

            // Check if the moving user has kicked out another user
            for (const headMember of group.getGroupHeads()) {
                if (!headMember.group) {
                    this.leaveGroup(headMember);
                    continue;
                }

                const headPosition = headMember.getPosition();
                const distance = GameRoom.computeDistanceBetweenPositions(headPosition, previewNewGroupPosition);

                if (distance > this.groupRadius) {
                    hasKickOutSomeone = true;
                    break;
                }
            }
        }

        user.group?.updatePosition();
        user.group?.searchForNearbyUsers();
    }

    public sendToOthersInGroupIncludingUser(user: User, message: ServerToClientMessage): void {
        console.log({ userGroupUsers: user.group?.getUsers() });
        user.group?.getUsers().forEach((currentUser: User) => {
            console.log({ currentUser, user, message });
            if (currentUser.id !== user.id) {
                currentUser.socket.write(message);
            }
        });
    }

    /**
     * Makes a user leave a group and closes and destroy the group if the group contains only one remaining person.
     *
     * @param user
     */
    private leaveGroup(user: User): void {
        const group = user.group;
        if (group === undefined) {
            throw new Error("The user is part of no group");
        }
        group.leave(user);
        if (group.isEmpty()) {
            group.destroy();
            if (!this.groups.has(group.getId())) {
                throw new Error(`Could not find group ${group.getId()} referenced by user ${user.id} in World.`);
            }
            this.groups.delete(group.getId());
            //todo: is the group garbage collected?
        } else {
            group.updatePosition();
            //this.positionNotifier.updatePosition(group, group.getPosition(), oldPosition);
        }
    }

    /**
     * Looks for the closest user that is:
     * - close enough (distance <= minDistance)
     * - not in a group
     * - not silent
     * OR
     * - close enough to a group (distance <= groupRadius)
     */
    private searchClosestAvailableUserOrGroup(user: User): User | Group | null {
        let minimumDistanceFound: number = Math.max(this.minDistance, this.groupRadius);
        let matchingItem: User | Group | null = null;
        this.users.forEach((currentUser) => {
            // Let's only check users that are not part of a group
            if (typeof currentUser.group !== "undefined") {
                return;
            }
            if (currentUser === user) {
                return;
            }
            if (currentUser.silent) {
                return;
            }

            const distance = GameRoom.computeDistance(user, currentUser); // compute distance between peers.

            if (distance <= minimumDistanceFound && distance <= this.minDistance) {
                minimumDistanceFound = distance;
                matchingItem = currentUser;
            }
        });

        this.groups.forEach((group: Group) => {
            if (group.isFull() || group.isLocked()) {
                return;
            }
            const distance = GameRoom.computeDistanceBetweenPositions(user.getPosition(), group.getPosition());
            if (distance <= minimumDistanceFound && distance <= this.groupRadius) {
                minimumDistanceFound = distance;
                matchingItem = group;
            }
        });

        return matchingItem;
    }

    public static computeDistance(user1: User, user2: User): number {
        const user1Position = user1.getPosition();
        const user2Position = user2.getPosition();
        return Math.sqrt(
            Math.pow(user2Position.x - user1Position.x, 2) + Math.pow(user2Position.y - user1Position.y, 2)
        );
    }

    public static computeDistanceBetweenPositions(position1: PositionInterface, position2: PositionInterface): number {
        return Math.sqrt(Math.pow(position2.x - position1.x, 2) + Math.pow(position2.y - position1.y, 2));
    }

    public setItemState(itemId: number, state: unknown) {
        this.itemsState.set(itemId, state);
    }

    public getItemsState(): Map<number, unknown> {
        return this.itemsState;
    }

    public async setVariable(name: string, value: string, user: User): Promise<void> {
        // First, let's check if "user" is allowed to modify the variable.
        const variableManager = await this.getVariableManager();

        try {
            const readableBy = variableManager.setVariable(name, value, user);

            // If the variable was not changed, let's not dispatch anything.
            if (readableBy === false) {
                return;
            }

            // TODO: should we batch those every 100ms?
            const variableMessage = new VariableWithTagMessage();
            variableMessage.setName(name);
            variableMessage.setValue(value);
            if (readableBy) {
                variableMessage.setReadableby(readableBy);
            }

            const subMessage = new SubToPusherRoomMessage();
            subMessage.setVariablemessage(variableMessage);

            const batchMessage = new BatchToPusherRoomMessage();
            batchMessage.addPayload(subMessage);

            // Dispatch the message on the room listeners
            for (const socket of this.roomListeners) {
                socket.write(batchMessage);
            }
        } catch (e) {
            if (e instanceof VariableError) {
                // Ok, we have an error setting a variable. Either the user is trying to hack the map... or the map
                // is not up to date. So let's try to reload the map from scratch.
                if (this.variableManagerLastLoad === undefined) {
                    throw e;
                }
                const lastLoaded = new Date().getTime() - this.variableManagerLastLoad.getTime();
                if (lastLoaded < 10000) {
                    console.log(
                        'An error occurred while setting the "' +
                            name +
                            "\" variable. But we tried to reload the map less than 10 seconds ago, so let's fail."
                    );
                    // Do not try to reload if we tried to reload less than 10 seconds ago.
                    throw e;
                }

                // Reset the variable manager
                this.variableManagerPromise = undefined;
                this.mapPromise = undefined;

                console.log(
                    'An error occurred while setting the "' + name + "\" variable. Let's reload the map and try again"
                );
                // Try to set the variable again!
                await this.setVariable(name, value, user);
            } else {
                throw e;
            }
        }
    }

    public addZoneListener(call: ZoneSocket, x: number, y: number): Set<Movable> {
        return this.positionNotifier.addZoneListener(call, x, y);
    }

    public removeZoneListener(call: ZoneSocket, x: number, y: number): void {
        return this.positionNotifier.removeZoneListener(call, x, y);
    }

    public adminJoin(admin: Admin): void {
        this.admins.add(admin);

        // Let's send all connected users
        for (const user of this.users.values()) {
            admin.sendUserJoin(user.uuid, user.name, user.IPAddress);
        }
    }

    public adminLeave(admin: Admin): void {
        this.admins.delete(admin);
    }

    public async incrementVersion(): Promise<number> {
        // Let's check if the mapUrl has changed
        const mapDetails = await GameRoom.getMapDetails(this.roomUrl);
        if (this.mapUrl !== mapDetails.mapUrl) {
            this.mapUrl = mapDetails.mapUrl;
            this.mapPromise = undefined;
            // Reset the variable manager
            this.variableManagerPromise = undefined;
        }

        this.versionNumber++;
        return this.versionNumber;
    }

    public emitEmoteEvent(user: User, emoteEventMessage: EmoteEventMessage) {
        this.positionNotifier.emitEmoteEvent(user, emoteEventMessage);
    }

    public emitChatEvent(user: User, chatEventMessage: ChatEventMessage) {
        this.positionNotifier.emitChatEvent(user, chatEventMessage);
    }

    public emitPfpUpdateEvent(user: User, pfpUpdateMessage: PfpUpdateMessage) {
        console.log("Game RoomPfp Update Notify");
        this.positionNotifier.emitPfpUpdateEvent(user, pfpUpdateMessage);
    }

    public emitLockGroupEvent(user: User, groupId: number) {
        this.positionNotifier.emitLockGroupEvent(user, groupId);
    }

    public addRoomListener(socket: RoomSocket) {
        this.roomListeners.add(socket);
    }

    public removeRoomListener(socket: RoomSocket) {
        this.roomListeners.delete(socket);
    }

    /**
     * Connects to the admin server to fetch map details.
     * If there is no admin server, the map details are generated by analysing the map URL (that must be in the form: /_/instance/map_url)
     */
    private static async getMapDetails(roomUrl: string): Promise<MapDetailsData> {
        if (!ADMIN_API_URL) {
            const roomUrlObj = new URL(roomUrl);

            const match = /\/_\/[^/]+\/(.+)/.exec(roomUrlObj.pathname);
            if (!match) {
                console.error("Unexpected room URL", roomUrl);
                throw new Error('Unexpected room URL "' + roomUrl + '"');
            }

            const mapUrl = roomUrlObj.protocol + "//" + match[1];

            return {
                mapUrl,
                authenticationMandatory: null,
                group: null,
                showPoweredBy: true,
            };
        }

        const result = isMapDetailsData.safeParse(await adminApi.fetchMapDetails(roomUrl));

        if (result.success) {
            return result.data;
        }

        console.error(result.error.issues);
        console.error("Unexpected room redirect received while querying map details", result);
        throw new Error("Unexpected room redirect received while querying map details");
    }

    private mapPromise: Promise<ITiledMap> | undefined;

    /**
     * Returns a promise to the map file.
     * @throws LocalUrlError if the map we are trying to load is hosted on a local network
     * @throws Error
     */
    private getMap(): Promise<ITiledMap> {
        if (!this.mapPromise) {
            this.mapPromise = mapFetcher.fetchMap(this.mapUrl);
        }

        return this.mapPromise;
    }

    private variableManagerPromise: Promise<VariablesManager> | undefined;
    private variableManagerLastLoad: Date | undefined;

    private getVariableManager(): Promise<VariablesManager> {
        if (!this.variableManagerPromise) {
            this.variableManagerLastLoad = new Date();
            this.variableManagerPromise = this.getMap()
                .then((map) => {
                    const variablesManager = new VariablesManager(this.roomUrl, map);
                    return variablesManager.init();
                })
                .catch((e) => {
                    if (e instanceof LocalUrlError) {
                        // If we are trying to load a local URL, we are probably in test mode.
                        // In this case, let's bypass the server-side checks completely.

                        // Note: we run this message inside a setTimeout so that the room listeners can have time to connect.
                        setTimeout(() => {
                            for (const roomListener of this.roomListeners) {
                                emitErrorOnRoomSocket(
                                    roomListener,
                                    "You are loading a local map. If you use the scripting API in this map, please be aware that server-side checks and variable persistence is disabled."
                                );
                            }
                        }, 1000);

                        const variablesManager = new VariablesManager(this.roomUrl, null);
                        return variablesManager.init();
                    } else {
                        // An error occurred while loading the map
                        // Right now, let's bypass the error. In the future, we should make sure the user is aware of that
                        // and that he/she will act on it to fix the problem.

                        // Note: we run this message inside a setTimeout so that the room listeners can have time to connect.
                        setTimeout(() => {
                            for (const roomListener of this.roomListeners) {
                                emitErrorOnRoomSocket(
                                    roomListener,
                                    "Your map does not seem accessible from the Cambria servers. Is it behind a firewall or a proxy? Your map should be accessible from the Cambria servers. If you use the scripting API in this map, please be aware that server-side checks and variable persistence is disabled."
                                );
                            }
                        }, 1000);

                        const variablesManager = new VariablesManager(this.roomUrl, null);
                        return variablesManager.init();
                    }
                });
        }
        return this.variableManagerPromise;
    }

    public async getVariablesForTags(tags: string[]): Promise<Map<string, string>> {
        const variablesManager = await this.getVariableManager();
        return variablesManager.getVariablesForTags(tags);
    }

    public getGroupById(id: number): Group | undefined {
        return this.groups.get(id);
    }

    private jitsiModeratorTagFinderPromise: Promise<ModeratorTagFinder> | undefined;

    /**
     * Returns the moderator tag associated with jitsiRoom
     */
    public async getModeratorTagForJitsiRoom(jitsiRoom: string): Promise<string | undefined> {
        if (this.jitsiModeratorTagFinderPromise === undefined) {
            this.jitsiModeratorTagFinderPromise = this.getMap()
                .then((map) => {
                    return new ModeratorTagFinder(map, "jitsiRoom", "jitsiRoomAdminTag");
                })
                .catch((e) => {
                    if (e instanceof LocalUrlError) {
                        // If we are trying to load a local URL, we are probably in test mode.
                        // In this case, let's bypass the server-side checks completely.

                        for (const roomListener of this.roomListeners) {
                            emitErrorOnRoomSocket(
                                roomListener,
                                "You are loading a local map. The 'jitsiRoomAdminTag' property cannot be read from local maps."
                            );
                        }
                    } else {
                        // An error occurred while loading the map
                        // Right now, let's bypass the error. In the future, we should make sure the user is aware of that
                        // and that he/she will act on it to fix the problem.

                        for (const roomListener of this.roomListeners) {
                            emitErrorOnRoomSocket(
                                roomListener,
                                "Your map does not seem accessible from the Cambria servers. Is it behind a firewall or a proxy? Your map should be accessible from the Cambria servers. The 'jitsiRoomAdminTag' property cannot be read from local maps."
                            );
                        }
                    }
                    throw new MapLoadingError(
                        e instanceof Error ? e.message : typeof e === "string" ? e : "unknown_error"
                    );
                });
        }

        try {
            const jitsiModeratorTagFinder = await this.jitsiModeratorTagFinderPromise;
            return jitsiModeratorTagFinder.getModeratorTag(jitsiRoom);
        } catch (e) {
            console.warn("Could not access map file.", e);
            if (e instanceof MapLoadingError) {
                return undefined;
            }
            throw e;
        }
    }

    private bbbModeratorTagFinderPromise: Promise<ModeratorTagFinder> | undefined;

    /**
     * Returns the moderator tag associated with bbbMeeting
     */
    public async getModeratorTagForBbbMeeting(bbbRoom: string): Promise<string | undefined> {
        if (this.bbbModeratorTagFinderPromise === undefined) {
            this.bbbModeratorTagFinderPromise = this.getMap()
                .then((map) => {
                    return new ModeratorTagFinder(map, "bbbMeeting", "bbbMeetingAdminTag");
                })
                .catch((e) => {
                    if (e instanceof LocalUrlError) {
                        // If we are trying to load a local URL, we are probably in test mode.
                        // In this case, let's bypass the server-side checks completely.

                        for (const roomListener of this.roomListeners) {
                            emitErrorOnRoomSocket(
                                roomListener,
                                "You are loading a local map. The 'bbbMeetingAdminTag' property cannot be read from local maps."
                            );
                        }
                    } else {
                        // An error occurred while loading the map
                        // Right now, let's bypass the error. In the future, we should make sure the user is aware of that
                        // and that he/she will act on it to fix the problem.

                        for (const roomListener of this.roomListeners) {
                            emitErrorOnRoomSocket(
                                roomListener,
                                "Your map does not seem accessible from the Cambria servers. Is it behind a firewall or a proxy? Your map should be accessible from the Cambria servers. The 'bbbMeetingAdminTag' property cannot be read from local maps."
                            );
                        }
                    }
                    throw new MapLoadingError(
                        e instanceof Error ? e.message : typeof e === "string" ? e : "unknown_error"
                    );
                });
        }

        try {
            const bbbModeratorTagFinder = await this.bbbModeratorTagFinderPromise;
            return bbbModeratorTagFinder.getModeratorTag(bbbRoom);
        } catch (e) {
            console.warn("Could not access map file.", e);
            if (e instanceof MapLoadingError) {
                return undefined;
            }
            throw e;
        }
    }

    public getJitsiSettings(): MapJitsiData | undefined {
        const jitsi = this.thirdParty?.jitsi;
        if (jitsi) {
            return jitsi;
        }
        if (JITSI_URL) {
            return {
                url: JITSI_URL,
                iss: JITSI_ISS,
                secret: SECRET_JITSI_KEY,
            };
        }
        return undefined;
    }

    public getBbbSettings(): MapBbbData | undefined {
        const bbb = this.thirdParty?.bbb;
        if (bbb) {
            return bbb;
        }
        if (BBB_URL && BBB_SECRET) {
            return {
                url: BBB_URL,
                secret: BBB_SECRET,
            };
        }
        return undefined;
    }
}
