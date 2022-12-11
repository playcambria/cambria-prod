import { RightClickMenuAction, rightClickMenuStore } from "../../Stores/RightClickMenuStore";
import { Character } from "./Character";
import type { GameScene } from "../Game/GameScene";
import type { PointInterface } from "../../Connexion/ConnexionModels";
import type { PlayerAnimationDirections } from "../Player/Animation";
import type CancelablePromise from "cancelable-promise";
import { showBankScreen } from "../../Stores/BankStore";
import { itemType, ItemTypes } from "../../Stores/InventoryStore";
import { activeTradeStore } from "../../Stores/TradeStore";
import { get } from "svelte/store";

export enum RemotePlayerEvent {
    Clicked = "Clicked",
}

export enum NpcType {
    Bank = "Bank",
    Announcer = "Announcer",
}

const getRandomInt = (min: number, max: number) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Class representing the sprite of a remote player (a player that plays on another computer)
 */
export class NpcPlayer extends Character {
    public readonly type: NpcType;
    public readonly wander: boolean;
    public readonly name: string;

    private isMoving: boolean;
    private pathToFollow?: { x: number; y: number }[];
    private followingPathPromiseResolve?: (result: { x: number; y: number; cancelled: boolean }) => void;
    private pathWalkingSpeed?: number;

    private startX: number;
    private startY: number;

    constructor(
        Scene: GameScene,
        x: number,
        y: number,
        name: string,
        texturesPromise: CancelablePromise<string[]>,
        direction: PlayerAnimationDirections,
        moving: boolean,
        type: NpcType,
        wander: boolean
    ) {
        super(Scene, x, y, texturesPromise, name, direction, moving, 1);

        // Add collision to body 
        this.getBody().setImmovable(false);

        //set data
        this.type = type;
        this.wander = wander;
        this.name = name;
        this.isMoving = false;

        this.startX = x;
        this.startY = y;

        this.setClickable(this.getDefaultRightClickMenuActions().length > 0);
        this.bindEventHandlers();
    }

    private getMovementDirection(xDistance: number, yDistance: number, distance: number): [number, number] {
        return [xDistance / Math.sqrt(distance), yDistance / Math.sqrt(distance)];
    }

    private computeFollowPathMovement(): number[] {
        if (this.pathToFollow !== undefined && this.pathToFollow.length === 0) {
            this.pathToFollow = undefined;
            this.pathWalkingSpeed = undefined;
            this.followingPathPromiseResolve?.call(this, { x: this.x, y: this.y, cancelled: false });
        }
        if (!this.pathToFollow) {
            return [0, 0];
        }
        const nextStep = this.pathToFollow[0];

        // Compute movement direction
        const xDistance = nextStep.x - this.x;
        const yDistance = nextStep.y - this.y;
        const distance = Math.pow(xDistance, 2) + Math.pow(yDistance, 2);
        if (distance < 200) {
            this.pathToFollow.shift();
        }
        return this.getMovementDirection(xDistance, yDistance, distance);
    }

    private adjustPathToFollowToColliderBounds(path: { x: number; y: number }[]): { x: number; y: number }[] {
        return path.map((step) => {
            return { x: step.x, y: step.y - this.getBody().offset.y };
        });
    }

    public moveNpc(delta: number) {
        let x = 0;
        let y = 0;
        if (this.pathToFollow) {
            [x, y] = this.computeFollowPathMovement();
        }
        this.inputStep(x, y);
    }

    public inputStep(x: number, y: number) {

        const speed = 10;
        const moveAmount = speed * 20;
        x = x * moveAmount;
        y = y * moveAmount;

        const moving = x !== 0 || y !== 0;

        if (moving) {
            this.move(x, y);
        } else if (this.isMoving) {
            this.stop();
        }

        this.isMoving = moving;
    }

    public async setPathToFollow(
        path: { x: number; y: number }[],
        speed?: number
    ): Promise<{ x: number; y: number; cancelled: boolean }> {
        const isPreviousPathInProgress = this.pathToFollow !== undefined && this.pathToFollow.length > 0;
        // take collider offset into consideration
        this.pathToFollow = this.adjustPathToFollowToColliderBounds(path);
        this.pathWalkingSpeed = speed;
        return new Promise((resolve) => {
            this.followingPathPromiseResolve?.call(this, { x: this.x, y: this.y, cancelled: isPreviousPathInProgress });
            this.followingPathPromiseResolve = resolve;
        });
    }

    public processWander() {
        if (getRandomInt(0, 900) === 10) {
            try {
                // Get Tile at Coordinate
                const currentPosition = this.getPosition();
                const startTile = this.scene.gameMap.getTileIndexAt(currentPosition.x, currentPosition.y);
                const targetTile = this.scene.gameMap.getTileIndexAt(this.startX + getRandomInt(-30, 30), this.startY + getRandomInt(-30, 30));

                // Find path to target tile 
                this.scene.getPathfindingManager().findPath(startTile, targetTile, true, true)
                    .then((path) => {
                        // Start moving towards target tile 
                        this.setPathToFollow(path, 25);
                    });

            } catch (e) {
                console.error(e);
            }
        }
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
        const actions: RightClickMenuAction[] = [];

        if (this.type === NpcType.Bank) {
            // View Profile
            actions.push({
                actionName: `Bank`,
                actionContext: this.name,
                protected: true,
                priority: 5,
                callback: () => {
                    console.log("Opening bank");
                    this.moveToThisNpc();
                    rightClickMenuStore.clear();
                },
            });
            actions.push({
                actionName: `Collect`,
                actionContext: this.name,
                protected: true,
                disabled: true,
                priority: 4,
                callback: () => {
                    rightClickMenuStore.clear();
                },
            });
            actions.push({
                actionName: `Examine`,
                actionContext: this.name,
                protected: true,
                disabled: true,
                priority: 3,
                callback: () => {
                    rightClickMenuStore.clear();
                },
            });
        } else if (this.type === NpcType.Announcer) {
            actions.push({
                actionName: `Chat with`,
                actionContext: "Announcer",
                protected: true,
                disabled: true,
                priority: 5,
                callback: () => {
                    console.log("Nothing for now");
                    rightClickMenuStore.clear();
                },
            });
        }

        return actions;
    }

    // Walk up to another remote player
    public moveToThisNpc(): void {
        const targetPosition = this.getPosition();
        const startTile = this.scene.gameMap.getTileIndexAt(this.scene.CurrentPlayer.x, this.scene.CurrentPlayer.y);
        const targetTile = {
            x: (this.name === 'Arthur') ? 51 : 56,
            y: 43,
        };
        this.scene.getPathfindingManager()
            .findPath(startTile, targetTile, true, false)
            .then((path) => {
                console.log("START", startTile, targetTile, this.scene.CurrentPlayer, path);
                // Start pathing towards target
                this.scene.CurrentPlayer.setPathToFollow(path)
                    .then(() => {
                        // Open Bank
                        showBankScreen.set(true);
                        itemType.set(ItemTypes.Nfts); // auto select the "Nfts" tab
                    })
                    .catch((err) => {
                        console.error(err);
                    });
            })
            .catch((err) => {
                console.error(err);
            });
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
                    rightClickMenuStore.triggerDefault();
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
