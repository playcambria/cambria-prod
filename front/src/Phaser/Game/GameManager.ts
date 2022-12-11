import { get } from "svelte/store";
import { connectionManager } from "../../Connexion/ConnectionManager";
import { localUserStore } from "../../Connexion/LocalUserStore";
import type { Room } from "../../Connexion/Room";
import { helpCameraSettingsVisibleStore } from "../../Stores/HelpCameraSettingsStore";
import { requestedCameraState, requestedMicrophoneState } from "../../Stores/MediaStore";
import { menuIconVisiblilityStore } from "../../Stores/MenuStore";
import { LoginSceneName } from "../Login/LoginScene";
import { SelectCharacterSceneName } from "../Login/SelectCharacterScene";
import { GameScene } from "./GameScene";
import { EmptySceneName } from "../Login/EmptyScene";
import { getCompanionPet } from "../../Supabase/user";

/**
 * This class should be responsible for any scene starting/stopping
 */
export class GameManager {
    private playerName: string | null;
    private characterLayers: string[] | null;
    private companion?: string;
    private startRoom!: Room;
    private currentGameSceneName: string | null = null;
    // Note: this scenePlugin is the scenePlugin of the EntryScene. We should always provide a key in methods called on this scenePlugin.
    private scenePlugin!: Phaser.Scenes.ScenePlugin;
    private walletAddress: string;

    constructor() {
        this.playerName = localUserStore.getName();
        this.walletAddress = localUserStore.getWalletAddress();
        this.characterLayers = localUserStore.getCharacterLayers();
        getCompanionPet(this.walletAddress).then((companion) => (this.companion = companion.data?.companion_pet));
    }

    public async init(scenePlugin: Phaser.Scenes.ScenePlugin): Promise<string> {
        this.scenePlugin = scenePlugin;
        const result = await connectionManager.initGameConnexion();
        if (result instanceof URL) {
            window.location.assign(result.toString());
            // window.location.assign is not immediate and Javascript keeps running after.
            // so we need to redirect to an empty Phaser scene, waiting for the redirection to take place
            return EmptySceneName;
        }
        this.startRoom = result;
        this.loadMap(this.startRoom);

        console.log("INIT??");

        //If player name was not set show login scene with player name
        //If Room si not public and Auth was not set, show login scene to authenticate user (OpenID - SSO - Anonymous)
        if (!this.playerName || (this.startRoom.authenticationMandatory && !localUserStore.getAuthToken())) {
            return LoginSceneName;
        } else if (!this.characterLayers || !this.characterLayers.length) {
            return SelectCharacterSceneName;
        } else {
            return this.startRoom.key;
        }
    }

    public setPlayerName(name: string): void {
        this.playerName = name;
        localUserStore.setName(name);
    }

    public setWalletAddress(address: string): void {
        this.walletAddress = address;
        localUserStore.setWalletAddress(address);
    }

    public setCharacterLayers(layers: string[]): void {
        this.characterLayers = layers;
        localUserStore.setCharacterLayers(layers);
    }

    getPlayerName(): string | null {
        return this.playerName;
    }

    getWalletAddress(): string {
        return this.walletAddress;
    }

    getCharacterLayers(): string[] {
        if (!this.characterLayers) {
            throw new Error("characterLayers are not set");
        }
        return this.characterLayers;
    }

    setCompanion(companion: string): void {
        this.companion = companion;
    }

    getCompanion() {
        return this.companion;
    }

    public loadMap(room: Room) {
        const roomID = room.key;

        const gameIndex = this.scenePlugin.getIndex(roomID);
        if (gameIndex === -1) {
            const game: Phaser.Scene = new GameScene(room, room.mapUrl);
            this.scenePlugin.add(roomID, game, false);
        }
    }

    public goToStartingMap(): void {
        console.log("starting " + (this.currentGameSceneName || this.startRoom.key));
        this.scenePlugin.start(this.currentGameSceneName || this.startRoom.key);
        this.activeMenuSceneAndHelpCameraSettings();
    }

    /**
     * @private
     * @return void
     */
    private activeMenuSceneAndHelpCameraSettings(): void {
        if (
            !localUserStore.getHelpCameraSettingsShown() &&
            (!get(requestedMicrophoneState) || !get(requestedCameraState))
        ) {
            helpCameraSettingsVisibleStore.set(true);
            localUserStore.setHelpCameraSettingsShown();
        }
    }

    public gameSceneIsCreated(scene: GameScene) {
        console.log({ scene });
        this.currentGameSceneName = scene.scene.key;
        menuIconVisiblilityStore.set(true);
    }

    /**
     * Temporary leave a gameScene to go back to the loginScene for example.
     * This will close the socket connections and stop the gameScene, but won't remove it.
     */
    leaveGame(targetSceneName: string, sceneClass: Phaser.Scene): void {
        if (this.currentGameSceneName === null) throw new Error("No current scene id set!");
        const gameScene: GameScene = this.scenePlugin.get(this.currentGameSceneName) as GameScene;
        gameScene.cleanupClosingScene();
        gameScene.createSuccessorGameScene(false, false);
        menuIconVisiblilityStore.set(false);
        if (!this.scenePlugin.get(targetSceneName)) {
            this.scenePlugin.add(targetSceneName, sceneClass, false);
        }
        console.log("TARGET SCENE", targetSceneName);
        console.log("GAME SCENE", gameScene);
        this.scenePlugin.run(targetSceneName);
    }

    /**
     * follow up to leaveGame()
     */
    tryResumingGame(fallbackSceneName: string) {
        if (this.currentGameSceneName) {
            this.scenePlugin.start(this.currentGameSceneName);
            menuIconVisiblilityStore.set(true);
        } else {
            this.scenePlugin.run(fallbackSceneName);
        }
    }

    public hasCurrentScene(): boolean {
        return !!this.currentGameSceneName;
    }

    public getCurrentGameScene(): GameScene {
        if (this.currentGameSceneName === null) throw new Error("No current scene id set!");
        return this.scenePlugin.get(this.currentGameSceneName) as GameScene;
    }

    public get currentStartedRoom() {
        return this.startRoom;
    }
}

export const gameManager = new GameManager();
