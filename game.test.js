const fs = require('fs');
const vm = require('vm');

describe('saveSlot and loadSlot', () => {
  let context;

  beforeEach(() => {
    // clear storage
    localStorage.clear();
    // extract functions from game.js
    const code = fs.readFileSync(__dirname + '/game.js', 'utf8');
    const saveSlotCode = code.match(/function saveSlot\(\)\{[\s\S]*?\}/)[0];
    const loadSlotCode = code.match(/function loadSlot\(\)\{[\s\S]*?\}/)[0];

    context = {
      localStorage: global.localStorage,
      updHUD: () => {},
      resetWorld: () => {}
    };
    vm.createContext(context);
    vm.runInContext(`
      var lvl=1, goal=25, goalCaught=0;
      var countL=0, countM=0, countY=0;
      ${saveSlotCode}
      ${loadSlotCode}
    `, context);
  });

  test('restores game state after save/load', () => {
    Object.assign(context, { lvl: 3, goal: 100, goalCaught: 50, countL: 1, countM: 2, countY: 3 });
    context.saveSlot();

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
