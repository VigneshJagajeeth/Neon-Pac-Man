class SoundManager {
  private sounds: Record<string, HTMLAudioElement> = {};

  constructor() {
    if (typeof window !== 'undefined') {
      this.sounds = {
        eat: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-arcade-retro-changing-tab-206.mp3'),
        powerUp: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-arcade-magic-notification-2342.mp3'),
        death: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-retro-arcade-game-over-470.mp3'),
        ghostEat: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-electronic-retro-block-hit-2185.mp3'),
        win: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-winning-chimes-2015.mp3'),
      };
      
      // Preload and set volumes
      Object.values(this.sounds).forEach(s => {
        s.volume = 0.2;
        s.load();
      });
    }
  }

  private play(name: string) {
    const sound = this.sounds[name];
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(() => {}); // Ignore autoplay blocks
    }
  }

  playEat() { this.play('eat'); }
  playPowerUp() { this.play('powerUp'); }
  playDeath() { this.play('death'); }
  playGhostEat() { this.play('ghostEat'); }
  playWin() { this.play('win'); }
}

export const soundManager = new SoundManager();
