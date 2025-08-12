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
    const saveSlotCode = code.match(/function saveSlot\(\)\{[^]*?localStorage\.setItem[^]*?\}\s*/)[0];
    const loadSlotCode = code.match(/function loadSlot\(\)\{[^]*?return true;\s*\}/)[0];

    context = {
      localStorage: global.localStorage,
      updHUD: () => {},
      resetWorld: () => {}
    };
    vm.createContext(context);
    vm.runInContext(`
        var lvl=1, goal=35, goalCaught=0;
        var countL=0, countM=0, countY=0, xp=0;
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
  let context;

  beforeEach(() => {
    const code = fs.readFileSync(__dirname + '/game.js', 'utf8');
    const catchMouseCode = code.match(/function catchMouse\(cat, m\)\{[\s\S]*?\n\s*\}\n\n/)[0];
    context = {
      countL: 0,
      goalCaught: 0,
      xp: 0,
      sfxToggle: { checked: false },
      sCatch: { currentTime: 0, play: jest.fn() },
      updHUD: jest.fn(),
      checkEnd: jest.fn()
    };
    vm.createContext(context);
    vm.runInContext(catchMouseCode, context);
  });

  test('destroys mouse and updates counters', () => {
    const mouse = { destroy: jest.fn() };
    context.catchMouse({}, mouse);
    expect(mouse.destroy).toHaveBeenCalled();
    expect(context.countL).toBe(1);
    expect(context.goalCaught).toBe(1);
    expect(context.xp).toBe(1);
  });
});
