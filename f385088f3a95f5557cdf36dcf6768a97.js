// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles

// eslint-disable-next-line no-global-assign
require = (function (modules, cache, entry) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof require === "function" && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof require === "function" && require;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;

  for (var i = 0; i < entry.length; i++) {
    newRequire(entry[i]);
  }

  // Override the current require with this new one
  return newRequire;
})({4:[function(require,module,exports) {
"use strict";

var __assign = this && this.__assign || Object.assign || function (t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) {
            if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
    }
    return t;
};
exports.__esModule = true;
var valid = '><+-[].,';
var tokenize = function tokenize(src) {
    var chars = src.split('');
    var line = 0;
    var column = 0;
    var tokens = chars.map(function (char, i) {
        var t = {
            char: char,
            line: line,
            column: column
        };
        if (char === '\n') {
            column = 0;
            line++;
        } else {
            column++;
        }
        return t;
    });
    return tokens.filter(function (t) {
        return valid.indexOf(t.char) !== -1;
    });
};
var Program = /** @class */function () {
    function Program(src) {
        this.src = src;
        this.tokens = tokenize(src);
        this.state = {
            index: 0,
            pointer: 0,
            tape: [0],
            output: []
        };
        this.history = [];
    }
    Program.prototype.run = function (input, debug) {
        var _this = this;
        if (debug === void 0) {
            debug = false;
        }
        var inputChars = input.split('');
        while (!this.hasFinished()) {
            var before = this.state;
            var token = this.tokens[this.state.index];
            this.state = advance(consume(this.src, this.state, inputChars));
            this.history.push({
                before: before,
                token: token,
                after: this.state
            });
            debug && console.log(this.src[this.state.index - 1], '\n', this.state.tape.map(function (c, i) {
                return i === _this.state.pointer ? "(" + c + ")" : c.toString();
            }).join(' '));
        }
        return this;
    };
    Program.prototype.print = function () {
        return this.state.output.map(function (char) {
            return String.fromCharCode(char);
        }).join('');
    };
    Program.prototype.hasFinished = function () {
        return this.state.index >= this.src.length;
    };
    return Program;
}();
{
    var cat = ',[.,]';
    // [ 72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33, 10 ]
    var helloWorld = '++++++++[>++++[>++>+++>+++>+<<<<-]>+>+>->>+[<]<-]>>.>---.+++++++..+++.>>.<-.<.+++.------.--------.>>+.>++.';
    // const p = new Program(cat)
    // console.log(JSON.stringify(p.run('abc', true).history, null, 2))
    var p = new Program(helloWorld);
    console.log(p.run('').print());
}
function advance(s) {
    return __assign({}, s, { index: s.index + 1 });
}
function consume(src, state, input) {
    var char = src[state.index];
    var tape = state.tape,
        pointer = state.pointer,
        output = state.output;
    switch (char) {
        case '>':
            {
                var newTape = tape.slice(0);
                var newPointer = pointer + 1;
                newTape[newPointer] = newTape[newPointer] || 0;
                return __assign({}, state, { tape: newTape, pointer: pointer + 1 });
            }
        case '<':
            return __assign({}, state, { pointer: pointer - 1 });
        case '+':
            {
                var newTape = tape.slice(0);
                newTape[pointer] = (newTape[pointer] || 0) + 1;
                return __assign({}, state, { tape: newTape });
            }
        case '-':
            {
                var newTape = tape.slice(0);
                newTape[pointer] = (newTape[pointer] || 0) - 1;
                return __assign({}, state, { tape: newTape });
            }
        case '[':
            {
                if (!tape[pointer]) {
                    var depth = 1;
                    var index = state.index;
                    while (depth > 0) {
                        index += 1;
                        if (src[index] === '[') {
                            depth += 1;
                        } else if (src[index] === ']') {
                            depth -= 1;
                        }
                    }
                    return __assign({}, state, { index: index });
                } else {
                    return state;
                }
            }
        case ']':
            {
                var depth = 1;
                var index = state.index;
                while (depth > 0) {
                    index -= 1;
                    if (src[index] === '[') {
                        depth -= 1;
                    } else if (src[index] === ']') {
                        depth += 1;
                    }
                }
                index -= 1;
                return __assign({}, state, { index: index });
            }
        case '.':
            {
                return __assign({}, state, { output: output.concat(tape[state.pointer] || 0) });
            }
        case ',':
            {
                var val = (input.shift() || '\0').charCodeAt(0);
                var newTape = tape.slice(0);
                newTape[pointer] = val;
                return __assign({}, state, { tape: newTape });
            }
        default:
            return state;
    }
}
},{}],8:[function(require,module,exports) {

var global = (1, eval)('this');
var OldModule = module.bundle.Module;
function Module(moduleName) {
  OldModule.call(this, moduleName);
  this.hot = {
    accept: function (fn) {
      this._acceptCallback = fn || function () {};
    },
    dispose: function (fn) {
      this._disposeCallback = fn;
    }
  };
}

module.bundle.Module = Module;

var parent = module.bundle.parent;
if ((!parent || !parent.isParcelRequire) && typeof WebSocket !== 'undefined') {
  var hostname = '' || location.hostname;
  var protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  var ws = new WebSocket(protocol + '://' + hostname + ':' + '54027' + '/');
  ws.onmessage = function (event) {
    var data = JSON.parse(event.data);

    if (data.type === 'update') {
      data.assets.forEach(function (asset) {
        hmrApply(global.require, asset);
      });

      data.assets.forEach(function (asset) {
        if (!asset.isNew) {
          hmrAccept(global.require, asset.id);
        }
      });
    }

    if (data.type === 'reload') {
      ws.close();
      ws.onclose = function () {
        location.reload();
      };
    }

    if (data.type === 'error-resolved') {
      console.log('[parcel] ✨ Error resolved');
    }

    if (data.type === 'error') {
      console.error('[parcel] 🚨  ' + data.error.message + '\n' + 'data.error.stack');
    }
  };
}

function getParents(bundle, id) {
  var modules = bundle.modules;
  if (!modules) {
    return [];
  }

  var parents = [];
  var k, d, dep;

  for (k in modules) {
    for (d in modules[k][1]) {
      dep = modules[k][1][d];
      if (dep === id || Array.isArray(dep) && dep[dep.length - 1] === id) {
        parents.push(+k);
      }
    }
  }

  if (bundle.parent) {
    parents = parents.concat(getParents(bundle.parent, id));
  }

  return parents;
}

function hmrApply(bundle, asset) {
  var modules = bundle.modules;
  if (!modules) {
    return;
  }

  if (modules[asset.id] || !bundle.parent) {
    var fn = new Function('require', 'module', 'exports', asset.generated.js);
    asset.isNew = !modules[asset.id];
    modules[asset.id] = [fn, asset.deps];
  } else if (bundle.parent) {
    hmrApply(bundle.parent, asset);
  }
}

function hmrAccept(bundle, id) {
  var modules = bundle.modules;
  if (!modules) {
    return;
  }

  if (!modules[id] && bundle.parent) {
    return hmrAccept(bundle.parent, id);
  }

  var cached = bundle.cache[id];
  if (cached && cached.hot._disposeCallback) {
    cached.hot._disposeCallback();
  }

  delete bundle.cache[id];
  bundle(id);

  cached = bundle.cache[id];
  if (cached && cached.hot && cached.hot._acceptCallback) {
    cached.hot._acceptCallback();
    return true;
  }

  return getParents(global.require, id).some(function (id) {
    return hmrAccept(global.require, id);
  });
}
},{}]},{},[8,4])
//# sourceMappingURL=/dist/f385088f3a95f5557cdf36dcf6768a97.map