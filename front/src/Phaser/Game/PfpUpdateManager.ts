import type { GameScene } from "./GameScene";
import type { Subscription } from "rxjs";
import type { RoomConnection } from "../../Connexion/RoomConnection";
import { getPfpUrl } from "../../Supabase/user";

export class PfpUpdateManager {
    private subscription: Subscription;

    constructor(private scene: GameScene, private connection: RoomConnection) {
        this.subscription = connection.pfpUpdateMessageStream.subscribe((event) => {
            console.log("PFP Update received", { event });
            const actor = this.scene.MapPlayersByKey.get(event.userId);
            if (actor) {
                getPfpUrl(actor.walletAddress || "").then(({ data }) => {
                    if (data && data.pfp_url) {
                        let pfp_url = JSON.parse(data.pfp_url)?.iconUrl;
                        actor.setPfp(pfp_url);
                    }
                });
            }
        });
    }

    destroy() {
        this.subscription.unsubscribe();
    }
}
