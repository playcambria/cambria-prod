import Scene = Phaser.Scene;
import type { Character } from "./Character";

//todo: improve this WIP
export class Effect {
    private effect: Phaser.Sprite;
    private content: Phaser.GameObjects.Text;
    private effectKey: string;

    constructor(scene: Scene, player: Character, text = "", effectKey) {
        const effectHeight = 30;
        const effectPadding = 1;
        const effectWidth = effectPadding * 2 + text.length * 10;
        
        this.effectKey = effectKey;

        // this.effect = scene.add.graphics({ x: (0 - (effectWidth / 2)), y: -62 });
        let x = 0 + (effectWidth / 2);
        let y = 62;
        this.effect = scene.add.sprite(0, 0, effectKey).play(effectKey);
        player.add(this.effect);

        this.content = scene.add.text(0, 0, text, {
            fontFamily: "MonteCarlo",
            fontSize: "15px",
            color: "#FF0000",
            align: "center",
            stroke: '#000',
            strokeThickness: 2,
            baselineX: 1.35,
        }).setResolution(8);
        
        player.add(this.content);

        const bounds = this.content.getBounds();
        this.content.setPosition(
            this.effect.x + effectWidth / 2 - bounds.width / 2,
            this.effect.y + effectHeight / 2 - bounds.height / 2
        );
        player.emit("");
    }

    destroy(): void {
        this.effect.setVisible(false); //todo find a better way
        this.effect.destroy();
        this.content.destroy();
    }
}
