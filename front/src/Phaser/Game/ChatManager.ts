import type { GameScene } from "./GameScene";
import type { Subscription } from "rxjs";
import type { RoomConnection } from "../../Connexion/RoomConnection";
import { chatMessagesStore } from "../../Stores/ChatStore";

export class ChatManager {
    private subscription: Subscription;

    constructor(private scene: GameScene, private connection: RoomConnection) {
        this.subscription = connection.chatEventMessageStream.subscribe((event) => {
            const actor = this.scene.MapPlayersByKey.get(event.actorUserId);
            chatMessagesStore.addExternalMessage(event.actorUserId, event.text);
            if (actor) {
                actor.say(event.text);
            }
        });
    }

    destroy() {
        this.subscription.unsubscribe();
    }
}
