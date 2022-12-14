import { PUSHER_URL, UPLOADER_URL } from "../Enum/EnvironmentVariable";
import Axios from "axios";

import type { UserSimplePeerInterface } from "../WebRtc/SimplePeer";
import { ProtobufClientUtils } from "../Network/ProtobufClientUtils";
import type {
    GroupCreatedUpdatedMessageInterface,
    GroupUsersUpdateMessageInterface,
    MessageUserJoined,
    PlayGlobalMessageInterface,
    PositionInterface,
    RoomJoinedMessageInterface,
    ViewportInterface,
    WebRtcSignalReceivedMessageInterface,
} from "./ConnexionModels";
import type { BodyResourceDescriptionInterface } from "../Phaser/Entity/PlayerTextures";
import { adminMessagesService } from "./AdminMessagesService";
import { connectionManager } from "./ConnectionManager";
import { menuIconVisiblilityStore, menuVisiblilityStore, warningContainerStore } from "../Stores/MenuStore";

import {
    ServerToClientMessage as ServerToClientMessageTsProto,
    TokenExpiredMessage,
    WorldConnexionMessage,
    ErrorMessage as ErrorMessageTsProto,
    ErrorScreenMessage as ErrorScreenMessageTsProto,
    UserMovedMessage as UserMovedMessageTsProto,
    UserActionMessage as UserActionMessageTsProto,
    GroupUpdateMessage as GroupUpdateMessageTsProto,
    GroupDeleteMessage as GroupDeleteMessageTsProto,
    UserJoinedMessage as UserJoinedMessageTsProto,
    UserLeftMessage as UserLeftMessageTsProto,
    EmoteEventMessage as EmoteEventMessageTsProto,
    ChatEventMessage as ChatEventMessageTsProto,
    PfpUpdateMessage as PfpUpdateMessageTsProto,
    PlayerDetailsUpdatedMessage as PlayerDetailsUpdatedMessageTsProto,
    WebRtcDisconnectMessage as WebRtcDisconnectMessageTsProto,
    ClientToServerMessage as ClientToServerMessageTsProto,
    ActionMessage as ActionMessageTsProto,
    PositionMessage as PositionMessageTsProto,
    ViewportMessage as ViewportMessageTsProto,
    PositionMessage_Direction,
    SetPlayerDetailsMessage as SetPlayerDetailsMessageTsProto,
    CharacterLayerMessage,
    AvailabilityStatus,
    QueryMessage,
    AnswerMessage,
    JoinBBBMeetingAnswer,
    TradeMessage,
} from "../Messages/ts-proto-generated/protos/messages";
import { Subject } from "rxjs";
import { selectCharacterSceneVisibleStore } from "../Stores/SelectCharacterStore";
import { gameManager } from "../Phaser/Game/GameManager";
import { SelectCharacterScene, SelectCharacterSceneName } from "../Phaser/Login/SelectCharacterScene";
import { errorScreenStore } from "../Stores/ErrorScreenStore";
import { apiVersionHash } from "../Messages/JsonMessages/ApiVersion";
import { Nft } from "../Components/Inventory/types";
import { Token } from "../Stores/InventoryTokens/Token";
import { SignedOrder } from "@traderxyz/nft-swap-sdk";

// Number of milliseconds after which we consider the server has timed out (if we did not receive a ping)
const pingTimeout = 20000;

export class RoomConnection implements RoomConnection {
    private readonly socket: WebSocket;
    private userId: number | null = null;
    private static websocketFactory: null | ((url: string) => any) = null; // eslint-disable-line @typescript-eslint/no-explicit-any
    private closed = false;
    private tags: string[] = [];
    private _userRoomToken: string | undefined;

    private readonly _errorMessageStream = new Subject<ErrorMessageTsProto>();
    public readonly errorMessageStream = this._errorMessageStream.asObservable();

    private readonly _errorScreenMessageStream = new Subject<ErrorScreenMessageTsProto>();
    public readonly errorScreenMessageStream = this._errorScreenMessageStream.asObservable();

    private readonly _roomJoinedMessageStream = new Subject<{
        connection: RoomConnection;
        room: RoomJoinedMessageInterface;
    }>();
    public readonly roomJoinedMessageStream = this._roomJoinedMessageStream.asObservable();

    private readonly _webRtcStartMessageStream = new Subject<UserSimplePeerInterface>();
    public readonly webRtcStartMessageStream = this._webRtcStartMessageStream.asObservable();

    private readonly _webRtcSignalToClientMessageStream = new Subject<WebRtcSignalReceivedMessageInterface>();
    public readonly webRtcSignalToClientMessageStream = this._webRtcSignalToClientMessageStream.asObservable();

    private readonly _webRtcScreenSharingSignalToClientMessageStream =
        new Subject<WebRtcSignalReceivedMessageInterface>();
    public readonly webRtcScreenSharingSignalToClientMessageStream =
        this._webRtcScreenSharingSignalToClientMessageStream.asObservable();

    private readonly _webRtcDisconnectMessageStream = new Subject<WebRtcDisconnectMessageTsProto>();
    public readonly webRtcDisconnectMessageStream = this._webRtcDisconnectMessageStream.asObservable();

    private readonly _teleportMessageMessageStream = new Subject<string>();
    public readonly teleportMessageMessageStream = this._teleportMessageMessageStream.asObservable();

    private readonly _worldFullMessageStream = new Subject<string | null>();
    public readonly worldFullMessageStream = this._worldFullMessageStream.asObservable();

    private readonly _worldConnexionMessageStream = new Subject<WorldConnexionMessage>();
    public readonly worldConnexionMessageStream = this._worldConnexionMessageStream.asObservable();

    private readonly _tokenExpiredMessageStream = new Subject<TokenExpiredMessage>();
    public readonly tokenExpiredMessageStream = this._tokenExpiredMessageStream.asObservable();

    private readonly _userMovedMessageStream = new Subject<UserMovedMessageTsProto>();
    public readonly userMovedMessageStream = this._userMovedMessageStream.asObservable();

    private readonly _userActionMessageStream = new Subject<UserActionMessageTsProto>();
    public readonly userActionMessageStream = this._userActionMessageStream.asObservable();

    private readonly _groupUpdateMessageStream = new Subject<GroupCreatedUpdatedMessageInterface>();
    public readonly groupUpdateMessageStream = this._groupUpdateMessageStream.asObservable();

    private readonly _groupUsersUpdateMessageStream = new Subject<GroupUsersUpdateMessageInterface>();
    public readonly groupUsersUpdateMessageStream = this._groupUsersUpdateMessageStream.asObservable();

    private readonly _groupDeleteMessageStream = new Subject<GroupDeleteMessageTsProto>();
    public readonly groupDeleteMessageStream = this._groupDeleteMessageStream.asObservable();

    private readonly _userJoinedMessageStream = new Subject<MessageUserJoined>();
    public readonly userJoinedMessageStream = this._userJoinedMessageStream.asObservable();

    private readonly _userLeftMessageStream = new Subject<UserLeftMessageTsProto>();
    public readonly userLeftMessageStream = this._userLeftMessageStream.asObservable();

    private readonly _itemEventMessageStream = new Subject<{
        itemId: number;
        event: string;
        parameters: unknown;
        state: unknown;
    }>();
    public readonly itemEventMessageStream = this._itemEventMessageStream.asObservable();

    private readonly _emoteEventMessageStream = new Subject<EmoteEventMessageTsProto>();
    public readonly emoteEventMessageStream = this._emoteEventMessageStream.asObservable();

    private readonly _chatEventMessageStream = new Subject<ChatEventMessageTsProto>();
    public readonly chatEventMessageStream = this._chatEventMessageStream.asObservable();

    private readonly _pfpUpdateMessageStream = new Subject<PfpUpdateMessageTsProto>();
    public readonly pfpUpdateMessageStream = this._pfpUpdateMessageStream.asObservable();

    private readonly _variableMessageStream = new Subject<{ name: string; value: unknown }>();
    public readonly variableMessageStream = this._variableMessageStream.asObservable();

    private readonly _playerDetailsUpdatedMessageStream = new Subject<PlayerDetailsUpdatedMessageTsProto>();
    public readonly playerDetailsUpdatedMessageStream = this._playerDetailsUpdatedMessageStream.asObservable();

    private readonly _connectionErrorStream = new Subject<CloseEvent>();
    public readonly connectionErrorStream = this._connectionErrorStream.asObservable();

    private readonly _tradeMessageStream = new Subject<TradeMessage>();
    public readonly tradeMessageStream = this._tradeMessageStream.asObservable();

    // If this timeout triggers, we consider the connection is lost (no ping received)
    private timeout: ReturnType<typeof setInterval> | undefined = undefined;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public static setWebsocketFactory(websocketFactory: (url: string) => any): void {
        RoomConnection.websocketFactory = websocketFactory;
    }

    /**
     *
     * @param token A JWT token containing the email of the user
     * @param roomUrl The URL of the room in the form "https://example.com/_/[instance]/[map_url]" or "https://example.com/@/[org]/[event]/[map]"
     * @param name
     * @param characterLayers
     * @param position
     * @param viewport
     * @param companion
     * @param availabilityStatus
     */
    public constructor(
        token: string | null,
        roomUrl: string,
        name: string,
        characterLayers: string[],
        position: PositionInterface,
        viewport: ViewportInterface,
        availabilityStatus: AvailabilityStatus,
        walletAddress: string,
        companion?: string
    ) {
        let url = new URL(PUSHER_URL, window.location.toString()).toString();
        url = url.replace("http://", "ws://").replace("https://", "wss://");
        if (!url.endsWith("/")) {
            url += "/";
        }
        url += "room";
        url += "?roomId=" + encodeURIComponent(roomUrl);
        url += "&token=" + (token ? encodeURIComponent(token) : "");
        url += "&name=" + encodeURIComponent(name);
        for (const layer of characterLayers) {
            url += "&characterLayers=" + encodeURIComponent(layer);
        }
        url += "&x=" + Math.floor(position.x);
        url += "&y=" + Math.floor(position.y);
        url += "&top=" + Math.floor(viewport.top);
        url += "&bottom=" + Math.floor(viewport.bottom);
        url += "&left=" + Math.floor(viewport.left);
        url += "&right=" + Math.floor(viewport.right);
        if (typeof companion === "string") {
            url += "&companion=" + encodeURIComponent(companion);
        }
        if (typeof availabilityStatus === "number") {
            url += "&availabilityStatus=" + availabilityStatus;
        }
        url += "&walletAddress=" + encodeURIComponent(walletAddress);
        url += "&version=" + apiVersionHash;

        if (RoomConnection.websocketFactory) {
            this.socket = RoomConnection.websocketFactory(url);
        } else {
            this.socket = new WebSocket(url);
        }

        this.socket.binaryType = "arraybuffer";

        this.socket.onopen = () => {
            this.resetPingTimeout();
        };

        this.socket.addEventListener("close", (event) => {
            if (this.timeout) {
                clearTimeout(this.timeout);
            }

            // If we are not connected yet (if a JoinRoomMessage was not sent), we need to retry.
            if (this.userId === null && !this.closed) {
                this._connectionErrorStream.next(event);
            }
        });

        this.socket.onmessage = (messageEvent) => {

            const arrayBuffer: ArrayBuffer = messageEvent.data;
            const initCharacterLayers = characterLayers;

            const serverToClientMessage = ServerToClientMessageTsProto.decode(new Uint8Array(arrayBuffer));
            //const message = ServerToClientMessage.deserializeBinary(new Uint8Array(arrayBuffer));

            const message = serverToClientMessage.message;
            if (message === undefined) {
                return;
            }

            
            switch (message.$case) {
                case "batchMessage": {
                    for (const subMessageWrapper of message.batchMessage.payload) {
                        const subMessage = subMessageWrapper.message;
                        if (subMessage === undefined) {
                            return;
                        }

                        switch (subMessage.$case) {
                            case "actionMessage":
                                console.log("It's actually a sub message");
                                break;
                            case "errorMessage": {
                                this._errorMessageStream.next(subMessage.errorMessage);
                                console.error("An error occurred server side: " + subMessage.errorMessage.message);
                                break;
                            }
                            case "userJoinedMessage": {
                                this._userJoinedMessageStream.next(
                                    this.toMessageUserJoined(subMessage.userJoinedMessage)
                                );
                                break;
                            }
                            case "userLeftMessage": {
                                this._userLeftMessageStream.next(subMessage.userLeftMessage);
                                break;
                            }
                            case "userMovedMessage": {
                                this._userMovedMessageStream.next(subMessage.userMovedMessage);
                                break;
                            }
                            case "userActionMessage": {
                                this._userActionMessageStream.next(subMessage.userActionMessage);
                            }
                            case "groupUpdateMessage": {
                                this._groupUpdateMessageStream.next(
                                    this.toGroupCreatedUpdatedMessage(subMessage.groupUpdateMessage)
                                );
                                break;
                            }
                            case "groupDeleteMessage": {
                                this._groupDeleteMessageStream.next(subMessage.groupDeleteMessage);
                                break;
                            }
                            case "itemEventMessage": {
                                this._itemEventMessageStream.next({
                                    itemId: subMessage.itemEventMessage.itemId,
                                    event: subMessage.itemEventMessage.event,
                                    parameters: JSON.parse(subMessage.itemEventMessage.parametersJson),
                                    state: JSON.parse(subMessage.itemEventMessage.stateJson),
                                });
                                break;
                            }
                            case "emoteEventMessage": {
                                this._emoteEventMessageStream.next(subMessage.emoteEventMessage);
                                break;
                            }
                            case "chatEventMessage": {
                                this._chatEventMessageStream.next(subMessage.chatEventMessage);
                                break;
                            }
                            case "pfpUpdateMessage": {
                                this._pfpUpdateMessageStream.next(subMessage.pfpUpdateMessage);
                                break;
                            }
                            case "tradeMessage": {
                                this._tradeMessageStream.next(subMessage.tradeMessage);
                                break;
                            }
                            case "playerDetailsUpdatedMessage": {
                                this._playerDetailsUpdatedMessageStream.next(subMessage.playerDetailsUpdatedMessage);
                                break;
                            }
                            case "variableMessage": {
                                const name = subMessage.variableMessage.name;
                                const serializedValue = subMessage.variableMessage.value;
                                let value: unknown = undefined;
                                if (serializedValue) {
                                    try {
                                        value = JSON.parse(serializedValue);
                                    } catch (e) {
                                        console.error(
                                            'Unable to unserialize value received from server for variable "' +
                                                name +
                                                '". Value received: "' +
                                                serializedValue +
                                                '". Error: ',
                                            e
                                        );
                                    }
                                }

                                this._variableMessageStream.next({ name, value });
                                break;
                            }
                            case "pingMessage": {
                                this.resetPingTimeout();
                                this.sendPong();
                                break;
                            }
                            default: {
                                // Security check: if we forget a "case", the line below will catch the error at compile-time.
                                const _exhaustiveCheck: never = subMessage;
                            }
                        }
                    }
                    break;
                }
                case "roomJoinedMessage": {
                    const roomJoinedMessage = message.roomJoinedMessage;

                    const items: { [itemId: number]: unknown } = {};
                    for (const item of roomJoinedMessage.item) {
                        items[item.itemId] = JSON.parse(item.stateJson);
                    }

                    const variables = new Map<string, unknown>();
                    for (const variable of roomJoinedMessage.variable) {
                        try {
                            variables.set(variable.name, JSON.parse(variable.value));
                        } catch (e) {
                            console.error(
                                'Unable to unserialize value received from server for variable "' +
                                    variable.name +
                                    '". Value received: "' +
                                    variable.value +
                                    '". Error: ',
                                e
                            );
                        }
                    }

                    this.userId = roomJoinedMessage.currentUserId;
                    this.tags = roomJoinedMessage.tag;
                    this._userRoomToken = roomJoinedMessage.userRoomToken;

                    // If one of the URLs sent to us does not exist, let's go to the Woka selection screen.
                    if (
                        roomJoinedMessage.characterLayer.length !== initCharacterLayers.length ||
                        roomJoinedMessage.characterLayer.find((layer) => !layer.url)
                    ) {
                        this.goToSelectYourWokaScene();
                        this.closed = true;
                    }

                    if (this.closed) {
                        this.closeConnection();
                        break;
                    }

                    const characterLayers = roomJoinedMessage.characterLayer.map(
                        this.mapCharacterLayerToBodyResourceDescription.bind(this)
                    );

                    this._roomJoinedMessageStream.next({
                        connection: this,
                        room: {
                            items,
                            variables,
                            characterLayers,
                        } as RoomJoinedMessageInterface,
                    });
                    break;
                }
                case "worldFullMessage": {
                    this._worldFullMessageStream.next(null);
                    this.closed = true;
                    break;
                }
                case "invalidTextureMessage": {
                    this.goToSelectYourWokaScene();

                    this.closed = true;
                    break;
                }
                case "tokenExpiredMessage": {
                    connectionManager.logout().catch((e) => console.error(e));
                    this.closed = true; //technically, this isn't needed since loadOpenIDScreen() will do window.location.assign() but I prefer to leave it for consistency
                    break;
                }
                case "worldConnexionMessage": {
                    this._worldFullMessageStream.next(message.worldConnexionMessage.message);
                    this.closed = true;
                    break;
                }
                case "webRtcSignalToClientMessage": {
                    this._webRtcSignalToClientMessageStream.next({
                        userId: message.webRtcSignalToClientMessage.userId,
                        signal: JSON.parse(message.webRtcSignalToClientMessage.signal),
                        webRtcUser: message.webRtcSignalToClientMessage.webrtcUserName
                            ? message.webRtcSignalToClientMessage.webrtcUserName
                            : undefined,
                        webRtcPassword: message.webRtcSignalToClientMessage.webrtcPassword
                            ? message.webRtcSignalToClientMessage.webrtcPassword
                            : undefined,
                    });
                    break;
                }
                case "webRtcScreenSharingSignalToClientMessage": {
                    this._webRtcScreenSharingSignalToClientMessageStream.next({
                        userId: message.webRtcScreenSharingSignalToClientMessage.userId,
                        signal: JSON.parse(message.webRtcScreenSharingSignalToClientMessage.signal),
                        webRtcUser: message.webRtcScreenSharingSignalToClientMessage.webrtcUserName
                            ? message.webRtcScreenSharingSignalToClientMessage.webrtcUserName
                            : undefined,
                        webRtcPassword: message.webRtcScreenSharingSignalToClientMessage.webrtcPassword
                            ? message.webRtcScreenSharingSignalToClientMessage.webrtcPassword
                            : undefined,
                    });
                    break;
                }
                case "webRtcStartMessage": {
                    this._webRtcStartMessageStream.next({
                        userId: message.webRtcStartMessage.userId,
                        initiator: message.webRtcStartMessage.initiator,
                        webRtcUser: message.webRtcStartMessage.webrtcUserName
                            ? message.webRtcStartMessage.webrtcUserName
                            : undefined,
                        webRtcPassword: message.webRtcStartMessage.webrtcPassword
                            ? message.webRtcStartMessage.webrtcPassword
                            : undefined,
                    });
                    break;
                }
                case "webRtcDisconnectMessage": {
                    this._webRtcDisconnectMessageStream.next(message.webRtcDisconnectMessage);
                    break;
                }
                case "teleportMessageMessage": {
                    // FIXME: WHY IS THIS UNUSED? CAN WE REMOVE THIS???
                    this._teleportMessageMessageStream.next(message.teleportMessageMessage.map);
                    break;
                }
                case "groupUsersUpdateMessage": {
                    this._groupUsersUpdateMessageStream.next(message.groupUsersUpdateMessage);
                    break;
                }
                case "sendUserMessage": {
                    adminMessagesService.onSendusermessage(message.sendUserMessage);
                    break;
                }
                case "banUserMessage": {
                    adminMessagesService.onSendusermessage(message.banUserMessage);
                    break;
                }
                case "worldFullWarningMessage": {
                    warningContainerStore.activateWarningContainer();
                    break;
                }
                case "refreshRoomMessage": {
                    //todo: implement a way to notify the user the room was refreshed.
                    break;
                }
                case "errorMessage": {
                    this._errorMessageStream.next(message.errorMessage);
                    console.error("An error occurred server side: " + message.errorMessage.message);
                    break;
                }
                case "errorScreenMessage": {
                    this._errorScreenMessageStream.next(message.errorScreenMessage);
                    console.error("An error occurred server side: " + JSON.stringify(message.errorScreenMessage));
                    if (message.errorScreenMessage.code !== "retry") {
                        this.closed = true;
                    }
                    if (message.errorScreenMessage.type === "redirect" && message.errorScreenMessage.urlToRedirect) {
                        window.location.assign(message.errorScreenMessage.urlToRedirect);
                    } else {
                        errorScreenStore.setError(message.errorScreenMessage);
                    }
                    break;
                }
                case "chatEventMessage": {
                    console.log("Unhandled Chat Event Message Received. Check front/src/Connexion/RoomConnection.ts");
                    break;
                }
                case "tradeMessage": {
                    this._tradeMessageStream.next(message.tradeMessage);
                    break;
                }
                case "answerMessage": {
                    const queryId = message.answerMessage.id;
                    const query = this.queries.get(queryId);
                    if (query === undefined) {
                        throw new Error("Got an answer to a query we have no track of: " + queryId.toString());
                    }
                    if (message.answerMessage.answer === undefined) {
                        throw new Error("Invalid message received. Answer missing.");
                    }
                    if (message.answerMessage.answer.$case === "error") {
                        query.reject(new Error(message.answerMessage.answer.error.message));
                    } else {
                        query.resolve(message.answerMessage.answer);
                    }
                    this.queries.delete(queryId);
                    break;
                }
                default: {
                    // Security check: if we forget a "case", the line below will catch the error at compile-time.
                    const _exhaustiveCheck: never = message;
                }
            }
        };
    }

    private resetPingTimeout(): void {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = undefined;
        }
        this.timeout = setTimeout(() => {
            console.warn("Timeout detected server-side. Is your connexion down? Closing connexion.");
            this.socket.close();
        }, pingTimeout);
    }

    private sendPong(): void {
        this.send({
            message: {
                $case: "pingMessage",
                pingMessage: {},
            },
        });
    }

    /*public emitPlayerDetailsMessage(userName: string, characterLayersSelected: BodyResourceDescriptionInterface[]) {
        const message = new SetPlayerDetailsMessage();
        message.setName(userName);
        message.setCharacterlayersList(characterLayersSelected.map((characterLayer) => characterLayer.name));

        const clientToServerMessage = new ClientToServerMessage();
        clientToServerMessage.setSetplayerdetailsmessage(message);

        this.socket.send(clientToServerMessage.serializeBinary().buffer);
    }*/

    public emitPlayerShowVoiceIndicator(show: boolean): void {
        const message = SetPlayerDetailsMessageTsProto.fromPartial({
            showVoiceIndicator: show,
        });
        this.send({
            message: {
                $case: "setPlayerDetailsMessage",
                setPlayerDetailsMessage: message,
            },
        });
    }

    public emitPlayerStatusChange(availabilityStatus: AvailabilityStatus): void {
        const message = SetPlayerDetailsMessageTsProto.fromPartial({
            availabilityStatus,
        });
        this.send({
            message: {
                $case: "setPlayerDetailsMessage",
                setPlayerDetailsMessage: message,
            },
        });
    }

    public emitPlayerOutlineColor(color: number | null) {
        let message: SetPlayerDetailsMessageTsProto;
        if (color === null) {
            message = SetPlayerDetailsMessageTsProto.fromPartial({
                removeOutlineColor: true,
            });
        } else {
            message = SetPlayerDetailsMessageTsProto.fromPartial({
                outlineColor: color,
            });
        }
        this.send({
            message: {
                $case: "setPlayerDetailsMessage",
                setPlayerDetailsMessage: message,
            },
        });
    }

    public closeConnection(): void {
        this.socket?.close();
        this.closed = true;
    }

    private toActionMessage(action: string, effect: string, duration: number, targetId: number): ActionMessageTsProto {
        return {
            action: action, 
            effect: effect, 
            duration: duration, 
            targetId: targetId
        };
    }

    private toPositionMessage(x: number, y: number, direction: string, moving: boolean): PositionMessageTsProto {
        return {
            x: Math.floor(x),
            y: Math.floor(y),
            moving,
            direction: (() => {
                switch (direction) {
                    case "up":
                        return PositionMessage_Direction.UP;
                    case "down":
                        return PositionMessage_Direction.DOWN;
                    case "left":
                        return PositionMessage_Direction.LEFT;
                    case "right":
                        return PositionMessage_Direction.RIGHT;
                    default:
                        throw new Error("Unexpected direction");
                }
            })(),
        };
    }

    private toViewportMessage(viewport: ViewportInterface): ViewportMessageTsProto {
        return {
            left: Math.floor(viewport.left),
            right: Math.floor(viewport.right),
            top: Math.floor(viewport.top),
            bottom: Math.floor(viewport.bottom),
        };
    }

    public shareAction(action: string, effect: string, duration: number, targetId: number, viewport: ViewportInterface): void {
        if(!this.socket) return;

        const actionMessage = this.toActionMessage(action, effect, duration, targetId);
        const viewportMessage = this.toViewportMessage(viewport);

        this.send({
            message: {
                $case: "userActionMessage",
                userActionMessage: {
                    action: actionMessage,
                    viewport: viewportMessage,
                },
            },
        });
    }

    public sharePosition(x: number, y: number, direction: string, moving: boolean, viewport: ViewportInterface): void {
        if (!this.socket) {
            return;
        }

        const positionMessage = this.toPositionMessage(x, y, direction, moving);

        const viewportMessage = this.toViewportMessage(viewport);

        this.send({
            message: {
                $case: "userMovesMessage",
                userMovesMessage: {
                    position: positionMessage,
                    viewport: viewportMessage,
                },
            },
        });
    }

    public setViewport(viewport: ViewportInterface): void {
        this.send({
            message: {
                $case: "viewportMessage",
                viewportMessage: this.toViewportMessage(viewport),
            },
        });
    }

    private mapCharacterLayerToBodyResourceDescription(
        characterLayer: CharacterLayerMessage
    ): BodyResourceDescriptionInterface {
        return {
            id: characterLayer.name,
            img: characterLayer.url,
        };
    }

    // TODO: move this to protobuf utils
    private toMessageUserJoined(message: UserJoinedMessageTsProto): MessageUserJoined {
        const position = message.position;
        if (position === undefined) {
            throw new Error("Invalid JOIN_ROOM message");
        }

        const characterLayers = message.characterLayers.map(this.mapCharacterLayerToBodyResourceDescription.bind(this));

        const companion = message.companion;

        return {
            userId: message.userId,
            name: message.name,
            characterLayers,
            visitCardUrl: message.visitCardUrl,
            walletAddress: message.walletAddress,
            position: ProtobufClientUtils.toPointInterface(position),
            availabilityStatus: message.availabilityStatus,
            companion: companion ? companion.name : null,
            userUuid: message.userUuid,
            outlineColor: message.hasOutline ? message.outlineColor : undefined,
        };
    }

    private toGroupCreatedUpdatedMessage(message: GroupUpdateMessageTsProto): GroupCreatedUpdatedMessageInterface {
        const position = message.position;
        if (position === undefined) {
            throw new Error("Missing position in GROUP_CREATE_UPDATE");
        }

        return {
            groupId: message.groupId,
            position: position,
            groupSize: message.groupSize,
            locked: message.locked,
        };
    }

    public onConnectError(callback: (error: Event) => void): void {
        this.socket.addEventListener("error", callback);
    }

    public sendWebrtcSignal(signal: unknown, receiverId: number) {
        this.send({
            message: {
                $case: "webRtcSignalToServerMessage",
                webRtcSignalToServerMessage: {
                    receiverId,
                    signal: JSON.stringify(signal),
                },
            },
        });
    }

    public sendWebrtcScreenSharingSignal(signal: unknown, receiverId: number) {
        this.send({
            message: {
                $case: "webRtcScreenSharingSignalToServerMessage",
                webRtcScreenSharingSignalToServerMessage: {
                    receiverId,
                    signal: JSON.stringify(signal),
                },
            },
        });
    }

    public onServerDisconnected(callback: () => void): void {
        this.socket.addEventListener("close", (event) => {
            // Cleanup queries:
            const error = new Error("Socket closed with code " + event.code + ". Reason: " + event.reason);
            for (const query of this.queries.values()) {
                query.reject(error);
            }

            if (this.closed === true || connectionManager.unloading) {
                return;
            }
            console.log("Socket closed with code " + event.code + ". Reason: " + event.reason);
            if (event.code === 1000) {
                // Normal closure case
                return;
            }
            callback();
        });
    }

    public getUserId(): number {
        if (this.userId === null) throw new Error("UserId cannot be null!");
        return this.userId;
    }

    emitActionableEvent(itemId: number, event: string, state: unknown, parameters: unknown): void {
        this.send({
            message: {
                $case: "itemEventMessage",
                itemEventMessage: {
                    itemId,
                    event,
                    stateJson: JSON.stringify(state),
                    parametersJson: JSON.stringify(parameters),
                },
            },
        });
    }

    emitSetVariableEvent(name: string, value: unknown): void {
        this.send({
            message: {
                $case: "variableMessage",
                variableMessage: {
                    name,
                    value: JSON.stringify(value),
                },
            },
        });
    }

    public uploadAudio(file: FormData) {
        return Axios.post<unknown>(`${UPLOADER_URL}/upload-audio-message`, file)
            .then((res: { data: unknown }) => {
                return res.data;
            })
            .catch((err) => {
                console.error(err);
                throw err;
            });
    }

    public emitGlobalMessage(message: PlayGlobalMessageInterface): void {
        this.send({
            message: {
                $case: "playGlobalMessage",
                playGlobalMessage: {
                    type: message.type,
                    content: message.content,
                    broadcastToWorld: message.broadcastToWorld,
                },
            },
        });
    }

    public emitReportPlayerMessage(reportedUserUuid: string, reportComment: string): void {
        this.send({
            message: {
                $case: "reportPlayerMessage",
                reportPlayerMessage: {
                    reportedUserUuid,
                    reportComment,
                },
            },
        });
    }

    public hasTag(tag: string): boolean {
        return this.tags.includes(tag);
    }

    public isAdmin(): boolean {
        return this.hasTag("admin");
    }

    public emitEmoteEvent(emoteName: string): void {
        this.send({
            message: {
                $case: "emotePromptMessage",
                emotePromptMessage: {
                    emote: emoteName,
                },
            },
        });
    }

    public emitChatEvent(chatText: string): void {
        this.send({
            message: {
                $case: "chatPromptMessage",
                chatPromptMessage: {
                    text: chatText,
                },
            },
        });
    }

    public emitPfpUpdateEvent(): void {
        console.log("TRACE9");
        this.send({
            message: {
                $case: "pfpUpdateMessage",
                pfpUpdateMessage: {
                    userId: this.userId || 0,
                },
            },
        });
    }

    public emitTradeRequestEvent(target: number): void {
        if (this.userId) {
            console.log("Trade Request", { userId: this.userId, target });
            this.send({
                message: {
                    $case: "tradeMessage",
                    tradeMessage: {
                        target,
                        initiator: this.userId,
                        eventType: "request",
                        eventPayloadJson: "",
                    },
                },
            });
        }
    }

    public emitWhackRequestEvent(target: number): void {
        if (this.userId) {
            console.log("Whack Request", { userId: this.userId, target });
            this.send({
                message: {
                    $case: "tradeMessage",
                    tradeMessage: {
                        target,
                        initiator: this.userId,
                        eventType: "request",
                        eventPayloadJson: "whack",
                    },
                },
            });
        }
    }

    public emitTradeRequestAcceptanceEvent(target: number): void {
        console.log("Trade Request Accept", { userId: this.userId, target });
        if (this.userId) {
            this.send({
                message: {
                    $case: "tradeMessage",
                    tradeMessage: {
                        target,
                        initiator: this.userId,
                        eventType: "requestAcceptance",
                        eventPayloadJson: "",
                    },
                },
            });
        }
    }

    public emitOutgoingRequestWithdrawEvent(recipients: number[]): void {
        if (this.userId && recipients && recipients[0]) {
            console.log("[EMIT] Outgoing Request Withdraw:", recipients);
            this.send({
                message: {
                    $case: "tradeMessage",
                    tradeMessage: {
                        target: recipients[0],
                        initiator: this.userId,
                        eventType: "withdrawRequest",
                        eventPayloadJson: JSON.stringify({ recipients: recipients }),
                    },
                },
            });
        }
    }

    public emitTradeDeclineEvent(target: number): void {
        if (this.userId) {
            console.log("Trade Decline", { userId: this.userId, target });
            this.send({
                message: {
                    $case: "tradeMessage",
                    tradeMessage: {
                        target,
                        initiator: this.userId,
                        eventType: "decline",
                        eventPayloadJson: "",
                    },
                },
            });
        }
    }

    public emitSignedOrderEvent(target: number, signedOrder: SignedOrder): void {
        if (this.userId) {
            console.log("Signed Order Message", { userId: this.userId, target, signedOrder });
            this.send({
                message: {
                    $case: "tradeMessage",
                    tradeMessage: {
                        target,
                        initiator: this.userId,
                        eventType: "signedOrder",
                        eventPayloadJson: JSON.stringify({ signedOrder }),
                    },
                },
            });
        }
    }

    public emitFillOrderEvent(target: number): void {
        if (this.userId) {
            console.log("Fill Order Message", { userId: this.userId, target });
            this.send({
                message: {
                    $case: "tradeMessage",
                    tradeMessage: {
                        target,
                        initiator: this.userId,
                        eventType: "fillOrder",
                        eventPayloadJson: "",
                    },
                },
            });
        }
    }

    public emitTradeCompleteEvent(target: number): void {
        if (this.userId) {
            console.log("Trade Complete Message", { userId: this.userId, target });
            this.send({
                message: {
                    $case: "tradeMessage",
                    tradeMessage: {
                        target,
                        initiator: this.userId,
                        eventType: "tradeComplete",
                        eventPayloadJson: "",
                    },
                },
            });
        }
    }

    public emitOfferUpdateEvent(target: number, myOffer: Array<Token | Nft>): void {
        if (!this.userId) {
            return;
        }
        console.log("Emit Offer Update", target, myOffer);
        this.send({
            message: {
                $case: "tradeMessage",
                tradeMessage: {
                    target,
                    initiator: this.userId,
                    eventType: "offerUpdate",
                    eventPayloadJson: JSON.stringify({ offer: myOffer }),
                },
            },
        });
    }

    public emitOfferConfirmEvent(target: number): void {
        if (!this.userId) {
            return;
        }
        console.log("Emit Offer Confirm", target);
        this.send({
            message: {
                $case: "tradeMessage",
                tradeMessage: {
                    target,
                    initiator: this.userId,
                    eventType: "offerConfirm",
                    eventPayloadJson: "",
                },
            },
        });
    }

    public emitLockGroup(lock = true): void {
        this.send({
            message: {
                $case: "lockGroupPromptMessage",
                lockGroupPromptMessage: {
                    lock,
                },
            },
        });
    }

    public getAllTags(): string[] {
        return this.tags;
    }

    public get userRoomToken(): string | undefined {
        return this._userRoomToken;
    }

    private goToSelectYourWokaScene(): void {
        menuVisiblilityStore.set(false);
        menuIconVisiblilityStore.set(false);
        selectCharacterSceneVisibleStore.set(true);
        gameManager.leaveGame(SelectCharacterSceneName, new SelectCharacterScene());
    }

    public quickAndDirtySend(action: string, effect: string, duration: number, targetId: number, viewport: Viewport)
    {
        if (this.socket.readyState === WebSocket.CLOSING || this.socket.readyState === WebSocket.CLOSED) {
            console.warn("Trying to send a message to the server, but the connection is closed. Message: ", message);
            return;
        }

        this.send({
            message: {
                $case: "actionMessage",
                actionMessage: {
                    bypass: true,
                    action: action,
                    effect: effect,
                    duration: duration,
                    targetId: targetId,
                    viewport: viewport
                },
            },
        });
        /*
        this.socket.send({
            bypass: true,
            action: action,
            effect: effect,
            duration: duration,
            targetId: targetId,
            viewport: viewport
        });
        */
    }

    private send(message: ClientToServerMessageTsProto): void {
        const bytes = ClientToServerMessageTsProto.encode(message).finish();

        if (this.socket.readyState === WebSocket.CLOSING || this.socket.readyState === WebSocket.CLOSED) {
            console.warn("Trying to send a message to the server, but the connection is closed. Message: ", message);
            return;
        }
        this.socket.send(bytes);
    }

    private queries = new Map<
        number,
        {
            answerType: string;
            resolve: (message: Required<AnswerMessage>["answer"]) => void;
            reject: (e: unknown) => void;
        }
    >();
    private lastQueryId = 0;

    private query<T extends Required<QueryMessage>["query"]>(message: T): Promise<Required<AnswerMessage>["answer"]> {
        return new Promise<Required<AnswerMessage>["answer"]>((resolve, reject) => {
            if (!message.$case.endsWith("Query")) {
                throw new Error("Query types are supposed to be suffixed with Query");
            }
            const answerType = message.$case.substring(0, message.$case.length - 5) + "Answer";

            this.queries.set(this.lastQueryId, {
                answerType,
                resolve,
                reject,
            });

            this.send({
                message: {
                    $case: "queryMessage",
                    queryMessage: {
                        id: this.lastQueryId,
                        query: message,
                    },
                },
            });

            this.lastQueryId++;
        });
    }

    public async queryJitsiJwtToken(jitsiRoom: string): Promise<string> {
        const answer = await this.query({
            $case: "jitsiJwtQuery",
            jitsiJwtQuery: {
                jitsiRoom,
            },
        });
        if (answer.$case !== "jitsiJwtAnswer") {
            throw new Error("Unexpected answer");
        }
        return answer.jitsiJwtAnswer.jwt;
    }

    public async queryBBBMeetingUrl(
        meetingId: string,
        props: Map<string, string | number | boolean>
    ): Promise<JoinBBBMeetingAnswer> {
        const meetingName = props.get("meetingName") as string;

        const answer = await this.query({
            $case: "joinBBBMeetingQuery",
            joinBBBMeetingQuery: {
                meetingId,
                meetingName,
            },
        });
        if (answer.$case !== "joinBBBMeetingAnswer") {
            throw new Error("Unexpected answer");
        }
        return answer.joinBBBMeetingAnswer;
    }
}
