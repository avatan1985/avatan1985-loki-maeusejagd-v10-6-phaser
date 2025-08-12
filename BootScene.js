class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    this.load.on('progress', v => {
      loadMsg.textContent = `Loading ${Math.round(v * 100)}%`;
    });
    this.load.on('loaderror', file => {
      console.error('Failed to load', file.key);
      loadMsg.style.color = 'var(--bad)';
      loadMsg.textContent = `Error loading asset: ${file.key}`;
      loadFailed = true;
    });
    this.load.on('complete', () => {
      if (!loadFailed) {
        gameReady = true;
        btnNew.disabled = btnContinue.disabled = false;
        loadMsg.textContent = '';
      }
      this.scene.start('MenuScene');
    });

    const ext = 'webp';
    for (const b of biomes) {
      this.load.image(b, `${b}.${ext}`);
    }
    this.load.image('menu_bg', `street.${ext}`);
    this.load.spritesheet('loki', `loki_sheet.${ext}`, { frameWidth: META.w, frameHeight: META.h });
    this.load.spritesheet('merlin', `merlin_sheet.${ext}`, { frameWidth: META.w, frameHeight: META.h });
    this.load.spritesheet('yumi', `yumi_sheet.${ext}`, { frameWidth: META.w, frameHeight: META.h });
    this.load.spritesheet('mouse', `mouse_sheet.${ext}`, { frameWidth: 56, frameHeight: 36 });
  }
}

if (typeof module !== 'undefined') {
  module.exports = BootScene;
}
