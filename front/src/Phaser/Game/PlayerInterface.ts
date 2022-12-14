import { AvailabilityStatus } from "../../Messages/ts-proto-generated/protos/messages";
import type { BodyResourceDescriptionInterface } from "../Entity/PlayerTextures";

export interface PlayerInterface {
    userId: number;
    name: string;
    characterLayers: BodyResourceDescriptionInterface[];
    visitCardUrl: string | null;
    walletAddress: string | null;
    companion?: string;
    userUuid: string;
    availabilityStatus: AvailabilityStatus;
    color?: string;
    outlineColor?: number;
}
