import type { SignalData } from "simple-peer";
import type { RoomConnection } from "./RoomConnection";
import type { BodyResourceDescriptionInterface } from "../Phaser/Entity/PlayerTextures";
import { AvailabilityStatus } from "../Messages/ts-proto-generated/protos/messages";

export interface PointInterface {
    x: number;
    y: number;
    direction: "up" | "down" | "left" | "right"; // TODO: modify this to the enum from ts-proto
    moving: boolean;
}

export interface ActionInterface {
    action: string;
    effect: string;
    duration: number;
    targetId: number;
}

export interface MessageUserPositionInterface {
    userId: number;
    name: string;
    characterLayers: BodyResourceDescriptionInterface[];
    position: PointInterface;
    availabilityStatus: AvailabilityStatus;
    visitCardUrl: string | null;
    walletAddress: string | null;
    companion?: string;
    userUuid: string;
}

export interface MessageUserMovedInterface {
    userId: number;
    position: PointInterface;
}

export interface MessageUserActionInterface {
    userId: number;
    action: ActionInterface;
}

export interface MessageUserJoined {
    userId: number;
    name: string;
    characterLayers: BodyResourceDescriptionInterface[];
    position: PointInterface;
    availabilityStatus: AvailabilityStatus;
    visitCardUrl: string | null;
    walletAddress: string | null;
    companion?: string;
    userUuid: string;
    outlineColor: number | undefined;
}

export interface PositionInterface {
    x: number;
    y: number;
}

export interface GroupCreatedUpdatedMessageInterface {
    position: PositionInterface;
    groupId: number;
    groupSize?: number;
    locked?: boolean;
}

export interface GroupUsersUpdateMessageInterface {
    groupId: number;
    userIds: number[];
}

export interface WebRtcDisconnectMessageInterface {
    userId: number;
}

export interface WebRtcSignalReceivedMessageInterface {
    userId: number;
    signal: SignalData;
    webRtcUser: string | undefined;
    webRtcPassword: string | undefined;
}

export interface ViewportInterface {
    left: number;
    top: number;
    right: number;
    bottom: number;
}

export interface ItemEventMessageInterface {
    itemId: number;
    event: string;
    state: unknown;
    parameters: unknown;
}

export interface RoomJoinedMessageInterface {
    //users: MessageUserPositionInterface[],
    //groups: GroupCreatedUpdatedMessageInterface[],
    items: { [itemId: number]: unknown };
    variables: Map<string, unknown>;
    characterLayers: BodyResourceDescriptionInterface[];
}

export interface PlayGlobalMessageInterface {
    type: string;
    content: string;
    broadcastToWorld: boolean;
}

export interface OnConnectInterface {
    connection: RoomConnection;
    room: RoomJoinedMessageInterface;
}