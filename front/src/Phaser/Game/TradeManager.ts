import type { GameScene } from "./GameScene";
import type { Subscription } from "rxjs";
import type { RoomConnection } from "../../Connexion/RoomConnection";
import { chatMessagesStore } from "../../Stores/ChatStore";
import { activeTradeStore } from "../../Stores/TradeStore";
import { TradeMessage } from "../../Messages/ts-proto-generated/protos/messages";
import { lastInventoryUpdateMs, inventoryNFTIdsState } from "../../Stores/InventoryStore";
import { lastInventoryTokenUpdateMs } from "../../Stores/AlchemyStore";
import { achievementsStore } from "../../Stores/AchievementsStore";
import { get } from "svelte/store";
import { isNftType } from "../../Components/Trade/utils";

export class TradeManager {
    private subscription: Subscription;

    constructor(private scene: GameScene, private connection: RoomConnection) {
        this.subscription = connection.tradeMessageStream.subscribe((event) => {
            this.handleTradeMessage(event);
        });
    }

    handleTradeMessage(event: TradeMessage): void {
        switch (event.eventType) {
            case "request":
                // Incoming Trade Request from another player (event.initiator)

                if(event.eventPayloadJson === "whack")
                {
                    // whack
                    chatMessagesStore.addTradeDeclineMessage(
                        event.initiator,
                        `[Whack!] ${this.scene.MapPlayersByKey.get(event.initiator)?.playerName} smacked you silly!`
                    );
                    
                    // get the id of the person that slapped you and call "chickenSlap()"
                    // chickenSlap() is a method on the character base class.
                    const actor = this.scene.MapPlayersByKey.get(event.initiator);
                    actor?.chickenSlap();

                    this.scene.CurrentPlayer.stun(1000);
                    this.scene.playSound("whack");
                } else {
                    // Incoming Trade Request from another player (event.initiator)
                    chatMessagesStore.addTradeRequestMessage(
                        event.initiator,
                        `[Trade] ${this.scene.MapPlayersByKey.get(event.initiator)?.playerName} wishes to trade with you.`
                    );
                    activeTradeStore.handleTradeRequest(event.initiator);
                }
                
                break;
            case "requestAcceptance":
                // Incoming Trade Request acceptance from another player (event.initiator) to us (event.target)
                activeTradeStore.handleTradeRequestAcceptance(event.initiator);
                break;
            case "decline":
                // Incoming Trade Decline from the player that we are currently in trade
                // TODO: Should we check if this is really the player we are trading?
                console.log("INCOMING TRADE DECLINE", event);
                chatMessagesStore.addTradeDeclineMessage(
                    event.initiator,
                    `[Trade] ${this.scene.MapPlayersByKey.get(event.initiator)?.playerName} has declined the trade.`
                );
                activeTradeStore.handleDeclineActiveTrade();
                break;
            case "withdrawRequest":
                console.log("INCOMING WITHDRAW REQUEST", event);
                activeTradeStore.handleTradeRequestWithdraw(event.initiator);
                break;
            case "offerUpdate":
                console.log("INCOMING OFFER UPDATE", event);
                activeTradeStore.handleOfferUpdate(event.eventPayloadJson);
                break;
            case "offerConfirm":
                console.log("INCOMING OFFER CONFIRM", event);
                activeTradeStore.handleOfferConfirm();
                break;
            case "signedOrder":
                console.log("INCOMING SIGNED ORDER", event);
                activeTradeStore.handleSignedOrder(event.initiator, event.eventPayloadJson);
                break;
            case "fillOrder":
                console.log("INCOMING FILL ORDER", event);
                activeTradeStore.handleFillOrder();
                break;
            case "tradeComplete":
                console.log("INCOMING TRADE COMPLETE", event);
                chatMessagesStore.addTradeCompletedMessage(
                    event.initiator,
                    `[Trade] Trade with ${
                        this.scene.MapPlayersByKey.get(event.initiator)?.playerName
                    } completed successfully.`
                );
                
                // DEMOO - persist to localstorage
                window.localStorage.setItem("trade", "completed");
                this.scene.playSound('sparkle-confirm-long')
                achievementsStore.completeAchievement('my_first_trade');
                const tradeStore = get(activeTradeStore);
                if (tradeStore?.counterpartyOffer) {
                    const _nfts = tradeStore.counterpartyOffer.filter(isNftType).map(n => n.nft_id);
                    if (_nfts && _nfts.length > 0) {
                        inventoryNFTIdsState.update((inventoryNfts) => {
                            const merged = inventoryNfts.concat(_nfts);
                            return merged;
                        });
                    }
                }
                lastInventoryUpdateMs.set(Date.now());
                lastInventoryTokenUpdateMs.set(Date.now());
                activeTradeStore.handleClose();
                break;
            case "whackEvent":
                console.log("Success!");
                break;
            default:
                console.error("Invalid Trade Message Type", event);
        }
    }

    destroy() {
        this.subscription.unsubscribe();
    }
}
