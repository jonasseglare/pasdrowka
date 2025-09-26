function charRange(charPair) {
  var dst = [];
  for (var i = charPair.charCodeAt(0); i <= charPair.charCodeAt(1);
       i++) {
    dst.push(String.fromCharCode(i));
  }
  return dst;
}

let specialSymbols = ".,-";
let digits = charRange("09");
let uppercaseLetters = charRange("AZ");
let lowercaseLetters = charRange("az");
let baseInputSymbols = digits.concat(uppercaseLetters);
let allLetters = lowercaseLetters.concat(uppercaseLetters);
let allLettersAndDigits = allLetters.concat(digits);

function removeSymbols(dst, symbolsToRemove) {
  let s = new Set(symbolsToRemove);
  return dst.filter(function(x) {
    return !s.has(x);
  });
}

//console.log(removeSymbols(digits, charRange("04")));

function generateInputSymbols(n) {
  var replacements = [["S", "Z", "SZ"],
                      ["Q", "K", "QK"],
                      ["B", "P", "BP"]];
  var setsToTry = [baseInputSymbols, uppercaseLetters, digits];
  for (var i in setsToTry) {
    var coll = setsToTry[i].slice();
    if (coll.length <= n) {
      return coll;
    }
    for (var j in replacements) {
      var rep = replacements[j];
      coll = removeSymbols(coll, rep.slice(0, 2));
      coll.push(rep[2]);
      if (coll.length <= n) {
        return coll;
      }
    }
  }
  return null;
} 

function assoc(src, k, v) {
  if (!src) {
    return {k: v};
  }
  var dst = {};
  for (var k0 in src) {
    dst[k0] = src[k0];
  }
  dst[k] = v;
  return dst;
}

function get(src, k, v0) {
  return k in src? src[k] : v0;
}

function update(dst, k, f) {
  return assoc(dst, k, f(get(dst, k)));
}

function updateIn(dst, path, f) {
  if (path.length == 0) {
    return f(dst);
  } else {
    let k = path[0];
    let y = assoc(
      dst, k,
      updateIn(get(dst, k, {}),
             path.slice(1),
             f));
    return y;
  }
}

function assocIn(dst, path, x) {
  return updateIn(dst, path, function(_) {return x;});
}



let initGlobalState = {
  "view": "generate",
  "config": {
    "inputSize": [6, 6],
    "outputSize": [11, 7],
    "inputSymbols": generateInputSymbols(35),
    "outputSymbols": allLettersAndDigits
  },
  "data": {
    "inputMatrix": null,
    "outputMatrix": null
  },
};

function Atom(state) {
  this.state = state
  this.listeners = {};
}

Atom.prototype.swap = function(f) {
  let oldState = this.state;
  this.state = f(oldState);
  for (var k in this.listeners) {
    let f = this.listeners[k];
    f(k, oldState, this.state);
  }
}

Atom.prototype.addListener = function(k, f) {
  this.listeners[k] = f;
}

var globalState = new Atom(initGlobalState);

function populateMatrix(size, symbols) {
  check(size[0]*size[1] === symbols.length);
  dst = new Array(size[0]);
  for (var i = 0; i < size[0]; i++) {
    dst[i] = new Array(size[1]);
  }
  for (var i = 0; i < symbols.length; i++) {
    let row = Math.floor(i/size[1]);
    let col = i - row*size[1];
    dst[row][col] = symbols[i];
  }
  return dst;
}

function generateInputMatrix(config) {
  let inputSymbols0 = config["inputSymbols"];
  let symbols = shuffle(inputSymbols0);
  let size = config["inputSize"];
  return populateMatrix(size, [null].concat(symbols));
}

function sampleN(n, symbols) {
  let len = symbols.length;
  let m = Math.floor((n-1)/len) + 1;
  let k = m-1;
  var dst = shuffle(symbols).slice(0, n - k*len);
  for (var i = 0; i < m-1; i++) {
    dst = dst.concat(symbols);
  }
  return shuffle(dst);
}


function generateOutputMatrix(config) {
  let size = config["outputSize"];
  let outputSymbols = sampleN(
    size[0]*size[1],
    config["outputSymbols"]);
  return populateMatrix(size, outputSymbols);
}

function generateNew(state) {
  let config = state["config"];
  return assocIn(assocIn(
    state, ["data", "inputMatrix"],
    generateInputMatrix(config)),
                 ["data", "outputMatrix"],
                 generateOutputMatrix(config));
}

function shuffle(src) {
  let n = src.length;
  let dst = new Array(n);
  for (var i = 0; i < n; i++) {
    dst[i] = src[i];
  }
  for (var i = n-1; i >= 1; i--) {
    let j = Math.floor(Math.random()*i);
    let tmp = dst[i];
    dst[i] = dst[j];
    dst[j] = tmp;
  }
  return dst;
}

function dispatchEvent(event) {
  globalState.swap(function(state) {
    let eventType = event["type"];
    if (eventType === "generate") {
      return generateNew(state);
    }
  });
}

function removeAllChildren(root) {
  while (root.firstChild) {
    root.removeChild(root.lastChild);
  }
}

function check(condition, message) {
  if (!condition) {
    throw message || "Check failed";
  }
}

function miniHiccup(input) {
  if (input && input.constructor === Array) {
    let n = input.length;
    let first = input[0];
    check(typeof first === 'string');
    let dst = document.createElement(first);
    let offset = 1;
    if (input[1] && input[1].constructor == Object) {
      let attrs = input[1];
      for (var k in attrs) {
        dst.setAttribute(k, attrs[k]);
      }
      offset += 1;
    }
    for (var i = offset; i < n; i++) {
      dst.appendChild(miniHiccup(input[i]));
    }
    return dst;
  } else if (typeof input === 'string') {
    return document.createTextNode(input);
  } else {
    return miniHiccup('' + input);
  }
}

function matrixHiccup(matrix) {
  return ["table", {"class": "grid"}].concat(
    matrix.map(function(row) {
      return ["tr"].concat(
        row.map(function(cell) {
          if (!cell) {
            return ["td"];
          } else {
            return ["td", cell];
          }
        }));
    }));
}

function renderViewGenerate(root, state) {
  removeAllChildren(root);
  let header = document.createElement("h2");
  header.appendChild(document.createTextNode("Generate Password"));
  let button = miniHiccup(["button", "Generate"]);
  button.onclick = function() {
    dispatchEvent({"type": "generate"});
  };
  root.appendChild(header);
  root.appendChild(button);
  root.appendChild(miniHiccup(["h3", {"style": "color: red"},
                               "Input Matrix"]));
  let inputMatrix = state["data"]["inputMatrix"];
  if (inputMatrix !== null) {
    root.appendChild(
      miniHiccup(
        matrixHiccup(inputMatrix)));
  }
  let outputMatrix = state["data"]["outputMatrix"];
  root.appendChild(miniHiccup(["h3", "Output Matrix"]));
  if (outputMatrix !== null) {
    root.appendChild(miniHiccup(matrixHiccup(outputMatrix)));
  }
}

function renderState(state) {
  let root = document.getElementById("root");
  if (root === null) {
    console.error("No root found");
  }
  if (state["view"] === "generate") {
    renderViewGenerate(root, state);
  } else {
    throw new Error("Invalid state");
  }
}

renderState(globalState.state);
globalState.addListener(
  "render", function(k0, oldState, newState) {
    renderState(newState);
  });



function tests() {
  let x = {};
  check(119 == assoc(x, "a", 119)["a"]);
  check(0 == Object.keys(x).length, "Wrong length");
  check(119, get({"a": 119}, "a", 234));
  check(234, get({"a": 119}, "b", 234));
  let y = updateIn({}, ["a"], function(x) {
    return assoc(x, "b", 119); //{"b": 119};
  });
  check(119 == y["a"]["b"]);
  let z = update({"a": 3}, "a", function(x) {
    return x + 1;
  });
  check(4 == z["a"]);
  let cfg = initGlobalState["config"];
  let inputSize = cfg["inputSize"];
  check(inputSize[0]*inputSize[1]-1 ===
        cfg["inputSymbols"].length);
  check(25 == generateInputSymbols(25).length);
  check(24 == generateInputSymbols(24).length);
  check(23 == generateInputSymbols(23).length);
  check(10 == generateInputSymbols(11).length);
  check(36 == generateInputSymbols(37).length);
  check(35 == generateInputSymbols(35).length);

  for (var j = 0; j < 2; j++) {
    var n = 6 + j;
    var symbols = sampleN(n, [0, 1, 2]);
    var freqs = [0, 0, 0];
    for (var i in symbols) {
      freqs[symbols[i]] += 1;
    }
    var freqSum = 0;
    for (var i in freqs) {
      check(2 <= freqs[i]);
      freqSum += freqs[i];
    }
    check(freqSum == n);
  }
  
  console.log("All tests pass");
}

tests();
