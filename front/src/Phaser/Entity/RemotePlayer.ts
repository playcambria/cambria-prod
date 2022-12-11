import { RightClickMenuAction, rightClickMenuStore } from "../../Stores/RightClickMenuStore";
import { Character } from "../Entity/Character";
import type { GameScene } from "../Game/GameScene";
import type { PointInterface } from "../../Connexion/ConnexionModels";
import type { PlayerAnimationDirections } from "../Player/Animation";
import type CancelablePromise from "cancelable-promise";
import { blackListManager } from "../../WebRtc/BlackListManager";
import { showReportScreenStore } from "../../Stores/ShowReportScreenStore";
import { followUserStore } from "../../Stores/FollowStore";
import { activeTradeStore } from "../../Stores/TradeStore";
import { shownProfileStore } from "../../Stores/ProfileStore";
import { addFriend } from "../../Supabase/friends";
import { getPfpUrl } from "../../Supabase/user";
import type { WalletProfile } from "../../Stores/ProfileStore";
import { gameManager } from "../Game/GameManager";
import { achievementsStore } from "../../Stores/AchievementsStore";
import { get } from "svelte/store";

export enum RemotePlayerEvent {
    Clicked = "Clicked",
}

/**
 * Class representing the sprite of a remote player (a player that plays on another computer)
 */
export class RemotePlayer extends Character {
    public readonly userId: number;
    public readonly userUuid: string;
    public readonly walletAddress: string | null;

    constructor(
        userId: number,
        userUuid: string,
        Scene: GameScene,
        x: number,
        y: number,
        name: string,
        texturesPromise: CancelablePromise<string[]>,
        direction: PlayerAnimationDirections,
        moving: boolean,
        walletAddress: string | null,
        companion?: string,
        companionTexturePromise?: CancelablePromise<string>
    ) {
        super(Scene, x, y, texturesPromise, name, direction, moving, 1, companion, companionTexturePromise);

        //set data
        this.userId = userId;
        this.userUuid = userUuid;
        this.walletAddress = walletAddress;
        this.setClickable(this.getDefaultRightClickMenuActions().length > 0);
        this.bindEventHandlers();
        this.setInteractive({
            useHandCursor: true,
        });
        getPfpUrl(this.walletAddress || "").then(({ data }) => {
            console.log({ data });
            if (data && data.pfp_url) {
                let pfp_url = JSON.parse(data.pfp_url)?.iconUrl;
                this.setPfp(pfp_url);
            }
        });
    }

    public updatePosition(position: PointInterface): void {
        this.playAnimation(position.direction as PlayerAnimationDirections, position.moving);
        this.setX(position.x);
        this.setY(position.y);

        this.setDepth(position.y); //this is to make sure the perspective (player models closer the bottom of the screen will appear in front of models nearer the top of the screen).

        if (this.companion) {
            this.companion.setTarget(position.x, position.y, position.direction as PlayerAnimationDirections);
        }
    }

    public destroy(): void {
        rightClickMenuStore.clear();
        super.destroy();
    }

    private toggleRightClickMenu(x: number, y: number): void {
        rightClickMenuStore.showMenu(x, y, this.getDefaultRightClickMenuActions().length);
    }

    private hoverRightClickMenu(x: number, y: number): void {
        const _activeTradeStore = get(activeTradeStore);
        if (_activeTradeStore) {
            return;
        }
        rightClickMenuStore.clear();
        rightClickMenuStore.initialize(x, y, this.getDefaultRightClickMenuActions().length);
        for (const action of this.getDefaultRightClickMenuActions()) {
            rightClickMenuStore.addAction(action);
        }
    }

    private getDefaultRightClickMenuActions(): RightClickMenuAction[] {

        const gameScene = gameManager.getCurrentGameScene();

        const actions: RightClickMenuAction[] = [];

        const walletProfile: WalletProfile = {
            walletAddress: this.walletAddress || "",
            playerName: this.playerName,
        };

        // View Profile
        actions.push({
            actionName: `View Profile`,
            actionContext: this.playerName,
            protected: true,
            priority: 6,
            callback: () => {
                shownProfileStore.set(walletProfile);
                rightClickMenuStore.clear();
            },
        });

        // View Inventory
        actions.push({
            actionName: `View Inventory`,
            protected: true,
            actionContext: "",
            disabled: true,
            priority: 5,
            callback: () => {
                console.log("View Inventory");
                rightClickMenuStore.clear();
            },
        });

        // Trade With
        actions.push({
            actionName: `Send Trade Request`,
            protected: true,
            actionContext: "",
            priority: 4,
            callback: () => {
                // showTradeScreenStore.set({ userId: this.userId, userName: this.name });
                activeTradeStore.sendTradeRequest(this.userId);
                gameScene.playSound("button-feedback");
                rightClickMenuStore.clear();
            },
        });

        // Follow Player
        actions.push({
            actionName: `Follow`,
            actionContext: "",
            protected: true,
            priority: 3,
            callback: () => {
                followUserStore.set(this.userId);
                gameScene.playSound("button-feedback");
                rightClickMenuStore.clear();
            },
        });

        // Add as Friend
        actions.push({
            actionName: `Add as Friend`,
            actionContext: "",
            protected: true,
            priority: 2,
            callback: () => {
                console.log("ADD AS FRIEND");
                gameScene.playSound("confirm-button-short");
                addFriend(this.walletAddress || "");
                achievementsStore.completeAchievement('friendship_bracelet');
                rightClickMenuStore.clear();
            },
        });

        // Whack player
        actions.push({
            actionName: 'Whack',
            actionContext: "",
            protected: true,
            priority: 1,
            callback: () => {
                let duration = 1000;
                console.log("Whacking player");
                gameScene.moveToRemotePlayer(this.userId, true); // walk up to the player
                //gameScene.requestWhack(this.userId);
                // gameScene.playSound("whack");
                // this.stun(duration); // so the initiator sees it
                /*
                // 
                //  gameScene.playSound("whack");
                const camera = gameScene.cameras.main;
                let viewport = {
                    left: camera.scrollX,
                    top: camera.scrollY,
                    right: camera.scrollX + camera.width,
                    bottom: camera.scrollY + camera.height,
            
                };
                gameScene.connection.quickAndDirtySend("whack", "stun", duration, this.userId, viewport);
                */
                rightClickMenuStore.clear();
            },
        })

        // Block Player
        actions.push({
            actionName: blackListManager.isBlackListed(this.userUuid) ? `Unblock` : `Block`,
            actionContext: "",
            protected: true,
            disabled: true,
            priority: 1,
            callback: () => {
                showReportScreenStore.set({ userId: this.userId, userName: this.name });
                rightClickMenuStore.clear();
            },
        });

        return actions;
    }

    private bindEventHandlers(): void {
        // Handle Pointer (left click, right click, tap) events on other player
        this.on(Phaser.Input.Events.POINTER_DOWN, (event: Phaser.Input.Pointer) => {
            // Check if the element triggering this pointer event is a Phaser element (vs UI)
            if (event.downElement.nodeName === "CANVAS") {
                if (event.leftButtonDown()) {
                    console.log("LEFT CLICK PLAYER");
                    // Handle Left Click on Player
                    this.emit(RemotePlayerEvent.Clicked); // used for the API
                    //rightClickMenuStore.triggerDefault();
                    // if (rightClickMenuStore !== undefined) {
                    //     rightClickMenuStore.clear(); // Left click on player should close out of right-click menu
                    // }
                } else if (event.rightButtonDown()) {
                    // Handle Right Click on Player
                    this.toggleRightClickMenu(event.x, event.y);
                }
            }
        });

        // Handle Hover Message 
        this.on(Phaser.Input.Events.POINTER_OVER, (event: Phaser.Input.Pointer) => {
            this.hoverRightClickMenu(event.x, event.y);
        });

        // Handle Hover Leave
        this.on(Phaser.Input.Events.POINTER_OUT, (event: Phaser.Input.Pointer) => {
            rightClickMenuStore.clearIfNotVisible();
        });
    }
}
