// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
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

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
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
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  var error;
  for (var i = 0; i < entry.length; i++) {
    try {
      newRequire(entry[i]);
    } catch (e) {
      // Save first error but execute all entries
      if (!error) {
        error = e;
      }
    }
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  parcelRequire = newRequire;

  if (error) {
    // throw error from earlier, _after updating parcelRequire_
    throw error;
  }

  return newRequire;
})({"program.ts":[function(require,module,exports) {
"use strict";

var __assign = this && this.__assign || function () {
  __assign = Object.assign || function (t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
      s = arguments[i];

      for (var p in s) {
        if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
      }
    }

    return t;
  };

  return __assign.apply(this, arguments);
};

Object.defineProperty(exports, "__esModule", {
  value: true
});
var maxCellVal = 256;
var valid = new Set('><+-[].,'.split(''));

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
    return valid.has(t.char);
  });
};

var Program =
/** @class */
function () {
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

    if (input === void 0) {
      input = '';
    }

    if (debug === void 0) {
      debug = false;
    }

    var inputChars = input.split('');

    while (!this.hasFinished()) {
      var before = this.state;
      var token = this.tokens[this.state.index];
      this.state = advance(consume(this.tokens, this.state, inputChars));
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
    return this.state.index >= this.tokens.length;
  };

  return Program;
}();

exports.Program = Program;

function advance(s) {
  return __assign(__assign({}, s), {
    index: s.index + 1
  });
}

function consume(tokens, state, input) {
  var char = tokens[state.index].char;
  var tape = state.tape,
      pointer = state.pointer,
      output = state.output;

  switch (char) {
    case '>':
      {
        var newTape = tape.slice(0);
        var newPointer = pointer + 1;
        newTape[newPointer] = newTape[newPointer] || 0;
        return __assign(__assign({}, state), {
          tape: newTape,
          pointer: newPointer
        });
      }

    case '<':
      {
        var updated = pointer - 1;

        if (updated < 0) {
          // TODO: improve this error, provide inline feedback
          throw new Error('Invalid tape pointer');
        }

        return __assign(__assign({}, state), {
          pointer: updated
        });
      }

    case '+':
      {
        var newTape = tape.slice(0);
        newTape[pointer] = ((newTape[pointer] || 0) + 1) % maxCellVal;
        return __assign(__assign({}, state), {
          tape: newTape
        });
      }

    case '-':
      {
        var newTape = tape.slice(0);
        newTape[pointer] = (newTape[pointer] || 0) - 1;

        if (newTape[pointer] < 0) {
          newTape[pointer] = newTape[pointer] + maxCellVal;
        }

        return __assign(__assign({}, state), {
          tape: newTape
        });
      }

    case '[':
      {
        if (!tape[pointer]) {
          var depth = 1;
          var index = state.index;

          while (depth > 0) {
            index += 1;

            if (tokens[index].char === '[') {
              depth += 1;
            } else if (tokens[index].char === ']') {
              depth -= 1;
            }
          }

          return __assign(__assign({}, state), {
            index: index
          });
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

          if (tokens[index].char === '[') {
            depth -= 1;
          } else if (tokens[index].char === ']') {
            depth += 1;
          }
        }

        index -= 1;
        return __assign(__assign({}, state), {
          index: index
        });
      }

    case '.':
      {
        return __assign(__assign({}, state), {
          output: output.concat(tape[pointer] || 0)
        });
      }

    case ',':
      {
        var val = (input.shift() || '\0').charCodeAt(0);
        var newTape = tape.slice(0);
        newTape[pointer] = val;
        return __assign(__assign({}, state), {
          tape: newTape
        });
      }

    default:
      return state;
  }
}
},{}],"worker.tsx":[function(require,module,exports) {
"use strict";

var __importStar = this && this.__importStar || function (mod) {
  if (mod && mod.__esModule) return mod;
  var result = {};
  if (mod != null) for (var k in mod) {
    if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
  }
  result["default"] = mod;
  return result;
};

Object.defineProperty(exports, "__esModule", {
  value: true
});

var Program = __importStar(require("./program"));

self.onmessage = function (e) {
  var _a = e.data,
      src = _a.src,
      input = _a.input;
  var program = new Program.Program(src);
  program.run(input);
  self.postMessage({
    output: program.print(),
    summaries: summariesPerLine(program.history),
    state: program.state
  }, []);
};

function summarize(history) {
  var before = history[0].before;
  var after = history[history.length - 1].after;
  var cellChanges = [];

  for (var i = 0; i < Math.max(before.tape.length, after.tape.length); i++) {
    var diff = after.tape[i] - (before.tape[i] || 0);
    var verb = diff > 0 ? 'Add' : 'Subtract';
    var preposition = diff > 0 ? 'to' : 'from';
    cellChanges.push(diff === 0 ? '' : verb + " " + Math.abs(diff) + " " + preposition + " c" + i);
  }

  var prints = after.output.slice(before.output.length).map(function (char) {
    return String.fromCharCode(char);
  }).join('');
  var printed = prints.length ? "Print " + JSON.stringify(prints) : '';
  return cellChanges.concat(printed).filter(Boolean).join('. ');
}

function changeSequencesPerLine(history) {
  return history.reduce(function (result, log, index) {
    if (index === 0 || log.token.line !== history[index - 1].token.line) {
      if (!result[log.token.line]) {
        result[log.token.line] = [];
      }

      result[log.token.line].push([]);
    }

    var forLine = result[log.token.line];
    forLine[forLine.length - 1].push(log);
    return result;
  }, []);
}

var nbsp = "\xA0";

function summariesPerLine(history) {
  return changeSequencesPerLine(history).map(function (line) {
    var summaries = line.map(function (seq) {
      return summarize(seq);
    });
    var summaryToCount = summaries.reduce(function (map, summary) {
      if (!summary) return map;
      if (!map[summary]) map[summary] = 0;
      map[summary] += 1;
      return map;
    }, {});
    return Object.keys(summaryToCount).map(function (summary) {
      return "" + summary + (summaryToCount[summary] > 1 ? " x" + summaryToCount[summary] : '');
    }).join(' ~~ ') || nbsp;
  });
}
},{"./program":"program.ts"}],"../node_modules/parcel-bundler/src/builtins/hmr-runtime.js":[function(require,module,exports) {
var global = arguments[3];
var OVERLAY_ID = '__parcel__error__overlay__';
var OldModule = module.bundle.Module;

function Module(moduleName) {
  OldModule.call(this, moduleName);
  this.hot = {
    data: module.bundle.hotData,
    _acceptCallbacks: [],
    _disposeCallbacks: [],
    accept: function (fn) {
      this._acceptCallbacks.push(fn || function () {});
    },
    dispose: function (fn) {
      this._disposeCallbacks.push(fn);
    }
  };
  module.bundle.hotData = null;
}

module.bundle.Module = Module;
var checkedAssets, assetsToAccept;
var parent = module.bundle.parent;

if ((!parent || !parent.isParcelRequire) && typeof WebSocket !== 'undefined') {
  var hostname = "" || location.hostname;
  var protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  var ws = new WebSocket(protocol + '://' + hostname + ':' + "60974" + '/');

  ws.onmessage = function (event) {
    checkedAssets = {};
    assetsToAccept = [];
    var data = JSON.parse(event.data);

    if (data.type === 'update') {
      var handled = false;
      data.assets.forEach(function (asset) {
        if (!asset.isNew) {
          var didAccept = hmrAcceptCheck(global.parcelRequire, asset.id);

          if (didAccept) {
            handled = true;
          }
        }
      }); // Enable HMR for CSS by default.

      handled = handled || data.assets.every(function (asset) {
        return asset.type === 'css' && asset.generated.js;
      });

      if (handled) {
        console.clear();
        data.assets.forEach(function (asset) {
          hmrApply(global.parcelRequire, asset);
        });
        assetsToAccept.forEach(function (v) {
          hmrAcceptRun(v[0], v[1]);
        });
      } else if (location.reload) {
        // `location` global exists in a web worker context but lacks `.reload()` function.
        location.reload();
      }
    }

    if (data.type === 'reload') {
      ws.close();

      ws.onclose = function () {
        location.reload();
      };
    }

    if (data.type === 'error-resolved') {
      console.log('[parcel] ✨ Error resolved');
      removeErrorOverlay();
    }

    if (data.type === 'error') {
      console.error('[parcel] 🚨  ' + data.error.message + '\n' + data.error.stack);
      removeErrorOverlay();
      var overlay = createErrorOverlay(data);
      document.body.appendChild(overlay);
    }
  };
}

function removeErrorOverlay() {
  var overlay = document.getElementById(OVERLAY_ID);

  if (overlay) {
    overlay.remove();
  }
}

function createErrorOverlay(data) {
  var overlay = document.createElement('div');
  overlay.id = OVERLAY_ID; // html encode message and stack trace

  var message = document.createElement('div');
  var stackTrace = document.createElement('pre');
  message.innerText = data.error.message;
  stackTrace.innerText = data.error.stack;
  overlay.innerHTML = '<div style="background: black; font-size: 16px; color: white; position: fixed; height: 100%; width: 100%; top: 0px; left: 0px; padding: 30px; opacity: 0.85; font-family: Menlo, Consolas, monospace; z-index: 9999;">' + '<span style="background: red; padding: 2px 4px; border-radius: 2px;">ERROR</span>' + '<span style="top: 2px; margin-left: 5px; position: relative;">🚨</span>' + '<div style="font-size: 18px; font-weight: bold; margin-top: 20px;">' + message.innerHTML + '</div>' + '<pre>' + stackTrace.innerHTML + '</pre>' + '</div>';
  return overlay;
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
        parents.push(k);
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

function hmrAcceptCheck(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (!modules[id] && bundle.parent) {
    return hmrAcceptCheck(bundle.parent, id);
  }

  if (checkedAssets[id]) {
    return;
  }

  checkedAssets[id] = true;
  var cached = bundle.cache[id];
  assetsToAccept.push([bundle, id]);

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    return true;
  }

  return getParents(global.parcelRequire, id).some(function (id) {
    return hmrAcceptCheck(global.parcelRequire, id);
  });
}

function hmrAcceptRun(bundle, id) {
  var cached = bundle.cache[id];
  bundle.hotData = {};

  if (cached) {
    cached.hot.data = bundle.hotData;
  }

  if (cached && cached.hot && cached.hot._disposeCallbacks.length) {
    cached.hot._disposeCallbacks.forEach(function (cb) {
      cb(bundle.hotData);
    });
  }

  delete bundle.cache[id];
  bundle(id);
  cached = bundle.cache[id];

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    cached.hot._acceptCallbacks.forEach(function (cb) {
      cb();
    });

    return true;
  }
}
},{}]},{},["../node_modules/parcel-bundler/src/builtins/hmr-runtime.js","worker.tsx"], null)
//# sourceMappingURL=/worker.5da34cf7.js.map