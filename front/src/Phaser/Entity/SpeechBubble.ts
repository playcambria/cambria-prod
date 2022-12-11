import Scene = Phaser.Scene;
import type { Character } from "./Character";

//todo: improve this WIP
export class SpeechBubble {
    private bubble: Phaser.GameObjects.Graphics;
    private content: Phaser.GameObjects.Text;

    constructor(scene: Scene, player: Character, text = "") {
        const bubbleHeight = 30;
        const bubblePadding = 1;
        const bubbleWidth = bubblePadding * 2 + text.length * 10;

        this.bubble = scene.add.graphics({ x: (0 - (bubbleWidth / 2)), y: -62 });
        player.add(this.bubble);

        this.content = scene.add.text(0, 0, text, {
            fontFamily: "MonteCarlo",
            fontSize: "15px",
            color: "#FFFF00",
            align: "center",
            stroke: '#000',
            strokeThickness: 2,
            baselineX: 1.35,
        }).setResolution(8);
        
        player.add(this.content);

        const bounds = this.content.getBounds();
        this.content.setPosition(
            this.bubble.x + bubbleWidth / 2 - bounds.width / 2,
            this.bubble.y + bubbleHeight / 2 - bounds.height / 2
        );
        player.emit("");
    }

    destroy(): void {
        this.bubble.setVisible(false); //todo find a better way
        this.bubble.destroy();
        this.content.destroy();
    }
}
