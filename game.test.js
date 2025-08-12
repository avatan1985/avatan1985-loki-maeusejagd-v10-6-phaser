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
      var countL=0, countM=0, countY=0;
      ${saveSlotCode}
      ${loadSlotCode}
    `, context);
  });

  test('restores game state after save/load', () => {
    Object.assign(context, { lvl: 3, goal: 100, goalCaught: 50, countL: 1, countM: 2, countY: 3 });
    context.saveSlot();

    expect(localStorage.getItem('slot0')).not.toBeNull();
    expect(localStorage.getItem('slot')).toBeNull();

    Object.assign(context, { lvl: 0, goal: 0, goalCaught: 0, countL: 0, countM: 0, countY: 0 });
    const result = context.loadSlot();

    expect(result).toBe(true);
    const { lvl, goal, goalCaught, countL, countM, countY } = context;
    expect({ lvl, goal, goalCaught, countL, countM, countY }).toEqual({
      lvl: 3,
      goal: 100,
      goalCaught: 50,
      countL: 1,
      countM: 2,
      countY: 3
    });
  });
});
