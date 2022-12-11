import { DirtyScene } from "../Game/DirtyScene";
import { gameManager } from "../Game/GameManager";
import { SuperLoaderPlugin } from "../Services/SuperLoaderPlugin";
import CancelablePromise from "cancelable-promise";
import Texture = Phaser.Textures.Texture;

const TextName = "Loading...";

const loadingBarHeight = 16;
const padding = 5;

export class Loader {
    private progressContainer!: Phaser.GameObjects.Graphics;
    private progress!: Phaser.GameObjects.Graphics;
    private progressAmount = 0;
    private loadingText: Phaser.GameObjects.Text | null = null;
    private logoNameIndex!: string;
    private superLoad: SuperLoaderPlugin;

    public constructor(private scene: Phaser.Scene) {
        this.superLoad = new SuperLoaderPlugin(scene);
    }

    public addLoader(): void {
        // If there is nothing to load, do not display the loader.
        if (this.scene.load.list.entries.length === 0) {
            return;
        }

        //add loading if logo image until logo image is ready
        this.loadingText = this.scene.add.text(
            this.scene.game.renderer.width / 2,
            this.scene.game.renderer.height / 2 - 25,
            TextName,
            {
                fontFamily: '"Monte Carlo"',
            }
        );

        this.progressContainer = this.scene.add.graphics();
        this.progressContainer.fillStyle(0x444444, 0.8);
        this.progress = this.scene.add.graphics();

        this.resize();

        this.scene.load.on("progress", (value: number) => {
            this.progressAmount = value;
            this.drawProgress();
        });

        const resizeFunction = this.resize.bind(this);
        this.scene.scale.on(Phaser.Scale.Events.RESIZE, resizeFunction);

        this.scene.load.on("complete", () => {
            this.progress.destroy();
            this.progressContainer.destroy();
            if (this.scene instanceof DirtyScene) {
                this.scene.markDirty();
            }
            this.scene.scale.off(Phaser.Scale.Events.RESIZE, resizeFunction);
        });
    }

    public removeLoader(): void {
        console.log("Loader is being removed");
        this.loadingText?.destroy();
        this.loadingText = null;
    }

    public resize(): void {
        const loadingBarWidth: number = Math.floor(this.scene.game.renderer.width / 3);

        this.progressContainer.clear();
        this.progressContainer.fillStyle(0x444444, 0.8);
        this.progressContainer.fillRect(
            (this.scene.game.renderer.width - loadingBarWidth) / 2 - padding,
            this.scene.game.renderer.height / 2 + 25 - padding,
            loadingBarWidth + padding * 2,
            loadingBarHeight + padding * 2
        );

        this.drawProgress();

        if (this.loadingText) {
            this.loadingText.x = this.scene.game.renderer.width / 2 - 15;
            this.loadingText.y = this.scene.game.renderer.height / 2 - 25;
        }
    }

    private drawProgress() {
        const loadingBarWidth: number = Math.floor(this.scene.game.renderer.width / 3);

        this.progress.clear();
        this.progress.fillStyle(0xbbbbbb, 1);
        this.progress.fillRect(
            (this.scene.game.renderer.width - loadingBarWidth) / 2,
            this.scene.game.renderer.height / 2 + 25,
            loadingBarWidth * this.progressAmount,
            loadingBarHeight
        );
    }
}
