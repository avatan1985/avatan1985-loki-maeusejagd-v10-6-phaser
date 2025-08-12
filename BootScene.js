class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    const { loadMsg, btnNew, btnContinue } = window;
    this.load.on('progress', v => {
      if (loadMsg) loadMsg.textContent = `Loading ${Math.round(v * 100)}%`;
    });
    this.load.on('loaderror', file => {
      console.error('Failed to load', file.key);
      if (loadMsg) {
        loadMsg.style.color = 'var(--bad)';
        loadMsg.textContent = `Error loading asset: ${file.key}`;
      }
      loadFailed = true;
    });
    this.load.on('complete', () => {
      if (!loadFailed) {
        gameReady = true;
        if (btnNew) btnNew.disabled = false;
        if (btnContinue) btnContinue.disabled = false;
        if (loadMsg) loadMsg.textContent = '';
        this.scene.start('MenuScene');
      } else {
        console.error('Asset loading failed. MenuScene not started.');
        if (loadMsg) {
          loadMsg.style.color = 'var(--bad)';
          loadMsg.textContent = 'Error loading assets. Please retry.';
        }
        const overlay = document.createElement('div');
        overlay.className = 'overlay';
        overlay.style.display = 'flex';
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = '<h2>Loading Error</h2><p>Assets could not be loaded.</p>';
        const btn = document.createElement('button');
        btn.textContent = 'Retry';
        btn.onclick = () => window.location.reload();
        card.appendChild(btn);
        overlay.appendChild(card);
        document.body.appendChild(overlay);
      }
    });

    const ext = 'webp';
    for (const b of biomes) {
      if (!this.textures.exists(b)) {
        this.load.image(b, `${b}.${ext}`);
      }
    }
    this.load.spritesheet('loki', `loki_sheet.${ext}`, { frameWidth: META.w, frameHeight: META.h });
    this.load.spritesheet('merlin', `merlin_sheet.${ext}`, { frameWidth: META.w, frameHeight: META.h });
    this.load.spritesheet('yumi', `yumi_sheet.${ext}`, { frameWidth: META.w, frameHeight: META.h });
    this.load.spritesheet('mouse', `mouse_sheet.${ext}`, { frameWidth: 56, frameHeight: 36 });
  }
}

if (typeof module !== 'undefined') {
  module.exports = BootScene;
}
