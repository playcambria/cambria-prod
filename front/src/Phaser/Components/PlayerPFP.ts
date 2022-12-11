import { AvailabilityStatus } from "../../Messages/ts-proto-generated/protos/messages";
import { Easing } from "../../types";

export class PlayerPFP extends Phaser.GameObjects.Container {

    private pfpImage: Phaser.GameObjects.Image;

    private pfpUrl?: string;

    private animationTween?: Phaser.Tweens.Tween;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y);

        // TODO: load this from pfpUrl 
        this.pfpImage = this.scene.add.image(0, 0, "pfpPlaceholder");

        this.add([this.pfpImage]);

        this.redraw();

        this.scene.add.existing(this);
    }

    public setPFP(pfpUrl: string, instant = false): void {
        this.pfpUrl = pfpUrl;
        // if (instant) {
        //     this.redraw();
        // } else {
        //     this.playStatusChangeAnimation();
        // }
    }

    private playStatusChangeAnimation(): void {
        this.scale = 1;
        this.animationTween?.stop();
        this.animationTween = this.scene.tweens.add({
            targets: [this],
            duration: 200,
            yoyo: true,
            ease: Easing.BackEaseIn,
            scale: 0,
            onYoyo: () => {
                this.redraw();
            },
            onComplete: () => {
                this.scale = 1;
            },
        });
    }

    private redraw(): void {
        // ...
    }
}
