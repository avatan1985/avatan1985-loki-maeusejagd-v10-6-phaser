const fs = require('fs');
const vm = require('vm');

global.localStorage = {
  _s: {},
  clear() { this._s = {}; },
  getItem(k) { return Object.prototype.hasOwnProperty.call(this._s, k) ? this._s[k] : null; },
  setItem(k, v) { this._s[k] = String(v); },
  removeItem(k) { delete this._s[k]; }
};

describe('saveSlot and loadSlot', () => {
  let context;

  beforeEach(() => {
    // clear storage
    localStorage.clear();
    // extract functions from game.js
    const code = fs.readFileSync(__dirname + '/game.js', 'utf8');
    const startSave = code.indexOf('function saveSlot()');
    const startLoad = code.indexOf('function loadSlot()');
    const startUpdate = code.indexOf('function update', startLoad);
    const saveSlotCode = code.slice(startSave, startLoad).trim();
    const loadSlotCode = code.slice(startLoad, startUpdate).trim();

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

describe('loki boost mechanics', () => {
  test('boost toggles speed and animation', () => {
    const code = fs.readFileSync(__dirname + '/game.js', 'utf8');
    const movementCode = code.match(/const left = keys.A.isDown[\s\S]*?loki.play\([^\n]*\);/)[0];

    const loki = {
      speed: 480,
      boost: 0,
      body: {
        velocity: { x: 0, y: 0 },
        setVelocity(x, y) { this.velocity = { x, y }; }
      },
      play: jest.fn()
    };
    const ctx = {
      keys: {
        A: { isDown: false },
        D: { isDown: true },
        W: { isDown: false },
        S: { isDown: false },
        LEFT: { isDown: false },
        RIGHT: { isDown: false },
        UP: { isDown: false },
        DOWN: { isDown: false }
      },
      jdx: 0,
      jdy: 0,
      loki
    };

    vm.runInNewContext(`(function(){${movementCode}})()`, ctx);
    expect(loki.body.velocity.x).toBeCloseTo(480);
    expect(loki.play).toHaveBeenLastCalledWith('loki_run', true);

    loki.boost = 1;
    vm.runInNewContext(`(function(){${movementCode}})()`, ctx);
    expect(loki.body.velocity.x).toBeCloseTo(640);
    expect(loki.play).toHaveBeenLastCalledWith('loki_sprint', true);
  });
});
