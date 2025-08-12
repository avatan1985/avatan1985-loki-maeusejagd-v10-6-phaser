class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
    this.cats = [];
  }

  preload() {
    const META = { w: 128, h: 130 };
    this.load.spritesheet('loki', 'loki_sheet.webp', { frameWidth: META.w, frameHeight: META.h });
    this.load.spritesheet('merlin', 'merlin_sheet.webp', { frameWidth: META.w, frameHeight: META.h });
    this.load.spritesheet('yumi', 'yumi_sheet.webp', { frameWidth: META.w, frameHeight: META.h });
  }

  create() {
    const META = { w: 128, h: 130, frames: { idle: 10, run: 10 } };
    const createRun = key => {
      this.anims.create({
        key: `${key}_run`,
        frames: this.anims.generateFrameNumbers(key, { start: META.frames.idle, end: META.frames.idle + META.frames.run - 1 }),
        frameRate: 14,
        repeat: -1
      });
    };
    createRun('loki');
    createRun('merlin');
    createRun('yumi');

    const w = this.scale.width;
    const h = this.scale.height;
    this.physics.world.setBounds(0, 0, w, h);

    const placements = [
      { key: 'loki', x: w * 0.25, y: h * 0.5 },
      { key: 'merlin', x: w * 0.5, y: h * 0.5 },
      { key: 'yumi', x: w * 0.75, y: h * 0.5 }
    ];

    this.cats = placements.map(info => {
      const cat = this.physics.add.sprite(info.x, info.y, info.key);
      cat.play(`${info.key}_run`);
      cat.setCollideWorldBounds(true);
      cat.setBounce(1, 1);
      cat.speed = 80;
      cat.nextChange = 0;
      cat.target = null;
      return cat;
    });
  }

  update(time) {
    for (const cat of this.cats) {
      if (time > cat.nextChange) {
        cat.nextChange = time + Phaser.Math.Between(1000, 3000);
        if (Phaser.Math.FloatBetween(0, 1) < 0.5) {
          const others = this.cats.filter(c => c !== cat);
          cat.target = Phaser.Utils.Array.GetRandom(others);
        } else {
          cat.target = null;
          cat.body.setVelocity(
            Phaser.Math.Between(-cat.speed, cat.speed),
            Phaser.Math.Between(-cat.speed, cat.speed)
          );
        }
      }
      if (cat.target) {
        const angle = Phaser.Math.Angle.Between(cat.x, cat.y, cat.target.x, cat.target.y);
        this.physics.velocityFromRotation(angle, cat.speed, cat.body.velocity);
      }
    }
  }
}

if (typeof module !== 'undefined') {
  module.exports = MenuScene;
}
