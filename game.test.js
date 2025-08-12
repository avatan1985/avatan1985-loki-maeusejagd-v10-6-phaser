const fs = require('fs');
const vm = require('vm');

describe('saveSlot and loadSlot', () => {
  let context;

  beforeEach(() => {
    // mock storage
    let store = {};
    global.localStorage = {
      getItem: key => (key in store ? store[key] : null),
      setItem: (key, value) => { store[key] = String(value); },
      removeItem: key => { delete store[key]; },
      clear: () => { store = {}; }
    };

    // extract functions from game.js
    const code = fs.readFileSync(__dirname + '/game.js', 'utf8');
    const saveSlotCode = code.match(/function saveSlot\(\)\{[^]*?safeStorageSet[^]*?\}\s*/)[0];
    const loadSlotCode = code.match(/function loadSlot\(\)\{[^]*?return true;\s*\}/)[0];
    const safeGetCode = code.match(/function safeStorageGet[^]*?\}\n/)[0];
    const safeSetCode = code.match(/function safeStorageSet[^]*?\}\n/)[0];

    context = {
      localStorage: global.localStorage,
      updHUD: () => {},
      resetWorld: () => {}
    };
    vm.createContext(context);
    vm.runInContext(`
        var lvl=1, goal=15, goalCaught=0;
        var countL=0, countM=0, countY=0, xp=0;
      ${safeGetCode}
      ${safeSetCode}
      ${saveSlotCode}
      ${loadSlotCode}
    `, context);
  });

  test('restores game state after save/load', () => {
      Object.assign(context, { lvl: 3, goal: 100, goalCaught: 50, countL: 1, countM: 2, countY: 3, xp: 7 });
    context.saveSlot();

    expect(localStorage.getItem('slot0')).not.toBeNull();
    expect(localStorage.getItem('slot')).toBeNull();

      Object.assign(context, { lvl: 0, goal: 0, goalCaught: 0, countL: 0, countM: 0, countY: 0, xp: 0 });
    const result = context.loadSlot();

    expect(result).toBe(true);
      const { lvl, goal, goalCaught, countL, countM, countY, xp } = context;
      expect({ lvl, goal, goalCaught, countL, countM, countY, xp }).toEqual({
        lvl: 3,
        goal: 100,
        goalCaught: 50,
        countL: 1,
        countM: 2,
        countY: 3,
        xp: 7
      });
  });
});

describe('catchMouse', () => {
  const code = fs.readFileSync(__dirname + '/game.js', 'utf8');

  test('overlap destroys mouse and increments counters', () => {
    const overlap = code.match(/scene\.physics\.add\.overlap\(loki,\s*miceGroup,\s*\(cat,\s*m\)=>\{[^]*?\}\);/);
    expect(overlap).not.toBeNull();
    const body = overlap[0];
    expect(body).toMatch(/m\.destroy\(\)/);
    expect(body).toMatch(/countL\+\+/);
    expect(body).toMatch(/goalCaught\+\+/);
    expect(body).toMatch(/xp\+\+/);
  });
});

describe('Loki world bounds', () => {
  const code = fs.readFileSync(__dirname + '/game.js', 'utf8');

  test('create includes world bounds collision', () => {
    const createSection = code.match(/function create\(\)[^]*?scene\.cameras\.main\.startFollow/)[0];
    const spriteIdx = createSection.indexOf("loki = scene.physics.add.sprite");
    expect(spriteIdx).toBeGreaterThan(-1);
    const collideIdx = createSection.indexOf("loki.setCollideWorldBounds(true)", spriteIdx);
    expect(collideIdx).toBeGreaterThan(spriteIdx);
  });

  test('resetWorld includes world bounds collision', () => {
    const resetSection = code.match(/function resetWorld\(\)[^]*?scene\.cameras\.main\.startFollow/)[0];
    const spriteIdx = resetSection.indexOf("loki = scene.physics.add.sprite");
    expect(spriteIdx).toBeGreaterThan(-1);
    const collideIdx = resetSection.indexOf("loki.setCollideWorldBounds(true)", spriteIdx);
    expect(collideIdx).toBeGreaterThan(spriteIdx);
  });
});

describe('speed configuration', () => {
  const code = fs.readFileSync(__dirname + '/game.js', 'utf8');

  test('uses updated Loki speed value', () => {
    const matches = code.match(/loki.speed=1000/g) || [];
    expect(matches.length).toBe(2);
  });
});

describe('nextLevel', () => {
  const code = fs.readFileSync(__dirname + '/game.js', 'utf8');

  test('increments level and resets counters', () => {
    const nextLevelCode = code.match(/function nextLevel\(\)\{[^]*?\}\n/)[0];
    const context = {
      updHUD: () => {},
      resetWorld: () => {},
      resetCooldowns: () => {}
    };
    vm.createContext(context);
    vm.runInContext(`
      var lvl=1, goal=15, goalCaught=5, countL=1, countM=2, countY=3;
      ${nextLevelCode}
    `, context);

    context.nextLevel();
    const { lvl, goalCaught, countL, countM, countY } = context;
    expect(lvl).toBe(2);
    expect(goalCaught).toBe(0);
    expect(countL).toBe(0);
    expect(countM).toBe(0);
    expect(countY).toBe(0);
  });
});

describe('minimap toggle', () => {
  const code = fs.readFileSync(__dirname + '/game.js', 'utf8');
  const applyCfgCode = code.match(/function applyCfg\(\)\{[^]*?\}\n/)[0];
  const btnMapCode = code.match(/btnMap\.onclick\s*=\s*\(\)\s*=>\s*\{[^]*?applyCfg\(\);[^]*?\};/)[0];

  test('hidden when mapToggle unchecked', () => {
    const context = {
      mapToggle: { checked: true },
      mm: { style: { display: 'block' } },
      joy: { style: {}, classList: { add: () => {}, remove: () => {} } },
      joySize: { value: 160 },
      ctrl: { value: 'joystick', classList: { add: () => {}, remove: () => {} } },
      sfxToggle: { checked: true },
      safeStorageSet: () => {},
      btnMap: {}
    };
    vm.createContext(context);
    vm.runInContext(`
      ${applyCfgCode}
      ${btnMapCode}
    `, context);

    context.btnMap.onclick();
    expect(context.mapToggle.checked).toBe(false);
    expect(context.mm.style.display).toBe('none');
  });
});
