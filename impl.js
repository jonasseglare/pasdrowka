const defaultOutputSymbols = 'abcdefghijklmnpqrstuvwxyz123456789,.-/!';

let generateButton = document.getElementById('genbutton');
let renderButton = document.getElementById('renderState');
let inputSpecEl = document.getElementById('inputspec');
let outputSpecEl = document.getElementById('outputspec');
let inputEl = document.getElementById('inputsymbols');
let outputEl = document.getElementById('outputsymbols');
let specErrorEl = document.getElementById('specError');

function shuffleArray(array) {
  // Make a shallow copy to avoid mutating the original array
  const shuffled = array.slice();

  for (let i = shuffled.length - 1; i > 0; i--) {
    // Generate a random index from 0 to i
    const j = Math.floor(Math.random() * (i + 1));
    // Swap elements
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

function characterCategory(c) {
  if (/[A-Z]/.test(c)) {
    return 0;
  } else if (/[a-z]/.test(c)) {
    return 1;
  } else if (/[0-9]/.test(c)) {
    return 2;
  } else {
    return 3;
  }
}

function* sampledSeq(s) {
  let n = s.length;
  if (n == 0) {
    return;
  }
  while (true) {
    let r = shuffleArray(s);
    for (var i = 0; i < n; i++) {
      yield r[i];
    }
  }
}

function outputCategories(outputSymbols) {
  dst = {};
  for (var i = 0; i < outputSymbols.length; i++) {
    let c = outputSymbols[i];
    let j = characterCategory(c);
    if (j in dst) {
      dst[j].push(c);
    } else {
      dst[j] = [c];
    }
  }
  let dstArray = [];
  for (var k in dst) {
    dstArray.push(dst[k]);
  }
  return dstArray;
}

function allSubsets(n) {
  let result = [];
  let stack = [{ list: [], m: 0 }];

  while (stack.length > 0) {
    let { list, m } = stack.pop();
    if (m < n) {
      stack.push({ list: [...list, m], m: m + 1 });
      stack.push({ list: [...list], m: m + 1 });
    } else {
      result.push(list);
    }
  }
  return result;
}

function sampleSubsets(sampleSize, subsetSize0, fullSetSize) {
  let subsetSize = Math.min(subsetSize0, fullSetSize);
  let subsets = allSubsets(fullSetSize).filter(function (subset) {
    return subsetSize == subset.length;
  });
  let dst = new Array(sampleSize);
  let ss = sampledSeq(subsets);
  let hist = new Array(fullSetSize);
  for (var i = 0; i < fullSetSize; i++) {
    hist[i] = 0;
  }

  function evaluateSubset(subset) {
    var cost = 0;
    subset.forEach(function (element) {
      cost += hist[element];
    });
    return cost;
  }

  function pickSubset() {
    var cands = [subsets[0]];
    subsets.forEach(function (subset) {
      let cost = evaluateSubset(subset);
      let bestCost = evaluateSubset(cands[0]);
      if (cost < bestCost) {
        cands = [subset];
      } else if (cost == bestCost) {
        cands.push(subset);
      }
    });
    return randNth(cands);
  }

  for (var i = 0; i < sampleSize; i++) {
    let subset = Array.from(pickSubset());
    subset.forEach(function (i) {
      hist[i] += 1;
    });

    for (var j = subsetSize; j < subsetSize0; j++) {
      subset.push(randInt(fullSetSize));
    }

    dst[i] = shuffleArray(subset);
  }
  return shuffleArray(dst);
}

function randomBalancedSample(stateCount, strlen, outputSymbols) {
  let cats = outputCategories(outputSymbols);
  let subsets = sampleSubsets(stateCount, strlen, cats.length);
  let dst = new Array(stateCount);
  for (var i = 0; i < stateCount; i++) {
    let y = '';
    subsets[i].forEach(function (j) {
      y += randNth(cats[j]);
    });
    dst[i] = y;
  }
  return dst;
}

function test() {
  {
    let result = sampleSubsets(30, 4, 2);
    console.assert(result.length == 30);
    result.forEach(function (inds) {
      console.assert(inds.length == 4);
      inds.forEach(function (i) {
        console.assert(i == 0 || i == 1);
      });
    });
  }
}

test();

console.log(
  randomBalancedSample(30, 2, 'abcdefghijklmnopqrstuvwxyzACDEFG01234.,')
);

function randInt(n) {
  return Math.floor(Math.random() * n);
}

function randNth(arr) {
  return arr[randInt(arr.length)];
}

function threadFirst() {
  let result = arguments[0];
  for (let i = 1; i < arguments.length; i++) {
    let expr = arguments[i];
    let f = expr[0];
    let args1 = expr.slice(1);
    let args = [result].concat(args1);
    result = f.apply(null, args);
  }
  return result;
}

function withEventListener(dst, key, listener) {
  dst.addEventListener(key, listener);
  return dst;
}

function withText(dst, text) {
  dst.appendChild(document.createTextNode(text));
  return dst;
}

function withAttribute(dst, k, v) {
  dst.setAttribute(k, v);
  return dst;
}

const inputErrorEl = document.getElementById('inputerror');
const outputErrorEl = document.getElementById('outputerror');

function identity(x) {
  return x;
}

function refreshUI() {
  let cfg = getConfig();
  inputErrorEl.textContent = cfg['inputError'] || '';
  outputErrorEl.textContent = cfg['outputError'] || '';
  generateButton.disabled = cfg['ioError'];
  renderButton.disabled = cfg['specError'];
  specErrorEl.textContent = [cfg['inputSpecError'], cfg['outputSpecError']]
    .filter(identity)
    .join(', ');
}

let fsOutputRe = /fs_output(\d+)$/;

function parseSymbols(src) {
  return Array.from(src).map(function (c) {
    return c;
  });
}

function splitStringBySpaces(src) {
  return src.split(/\s+/);
}

function checkIOError(s) {
  if (/\s/.test(s)) {
    return 'No whitespace allowed';
  } else if (s.length == 0) {
    return 'Empty string';
  } else {
    return null;
  }
}

function parseOutputSpec(s) {
  return s.trim().split(/\s+/);
}

function getConfig() {
  let inputValue = inputEl.value;
  let outputValue = outputEl.value;

  let inputError = checkIOError(inputValue);
  let outputError = checkIOError(outputValue);

  let inputSpec = inputSpecEl.value;
  let outputSpec = parseOutputSpec(outputSpecEl.value);

  let inputSpecError = checkIOError(inputSpec);
  let stateCount = 1 + inputValue.length;
  let outputSpecError =
    outputSpec.length == stateCount
      ? null
      : 'Inconsistent output spec length: ' +
        outputSpec.length +
        ' vs ' +
        stateCount +
        ')';

  return {
    strlen: strlenNode.value,
    stateCount: stateCount,
    inputSymbols: inputValue,
    outputSymbols: outputValue,
    inputSpec: inputSpec,
    outputSpec: outputSpec,
    inputError: inputError,
    outputError: outputError,
    ioError: inputError || outputError ? true : false,
    inputSpecError: inputSpecError,
    outputSpecError: outputSpecError,
    specError: inputSpecError || outputSpecError ? true : false,
  };
}

let svgNS = 'http://www.w3.org/2000/svg';

function createCircle(cx, cy, radius) {
  let dst = document.createElementNS(svgNS, 'circle');
  dst.setAttribute('cx', cx);
  dst.setAttribute('cy', cy);
  dst.setAttribute('r', radius);
  dst.setAttribute('stroke', 'black');
  dst.setAttribute('stroke-width', 0.25);
  dst.setAttribute('fill', 'transparent');
  return dst;
}

function createLine(x0, y0, x1, y1) {
  let dst = document.createElementNS(svgNS, 'line');
  dst.setAttribute('x1', x0);
  dst.setAttribute('y1', y0);
  dst.setAttribute('x2', x1);
  dst.setAttribute('y2', y1);
  dst.setAttribute('stroke', 'black');
  dst.setAttribute('stroke-width', 0.25);
  return dst;
}

class DrawingContext {
  constructor(svg, cfg) {
    let scale = 1.0;
    this.svg = svg;
    this.margin = 7.5 * scale;
    this.outerRadius = 30 * scale;
    this.textHeight = 5.25 * scale;
    this.fontSize = 4.0 * scale;
    this.innerRadius = this.outerRadius - this.textHeight;
    this.svg = svg;
    this.cfg = cfg;
    this.stateCount = cfg['stateCount'];
    this.angleStep = (2.0 * Math.PI) / this.stateCount;
    let offset = this.margin + this.outerRadius;
    this.cx0 = offset;
    this.cy0 = this.cx0;
    this.cx1 = this.cx0;
    this.cy1 = this.cy0 + 2.0 * this.outerRadius + this.margin;
    this.dotRadius = 1.0 * scale;
  }

  angleAtIndex(i) {
    return i * this.angleStep - Math.PI / 2;
  }

  renderDisk(cx, cy, thickness) {
    let innerRadius = this.outerRadius - thickness;
    let outerCircle = createCircle(cx, cy, this.outerRadius);
    let innerCircle = createCircle(cx, cy, innerRadius);
    this.svg.appendChild(outerCircle);
    this.svg.appendChild(innerCircle);
    for (var i = 0; i < this.stateCount; i++) {
      let angle = this.angleAtIndex(i);
      let cosx = Math.cos(angle);
      let sinx = Math.sin(angle);
      let x0 = cx + innerRadius * cosx;
      let y0 = cy + innerRadius * sinx;
      let x1 = cx + this.outerRadius * cosx;
      let y1 = cy + this.outerRadius * sinx;
      this.svg.appendChild(createLine(x0, y0, x1, y1));
    }
    this.svg.appendChild(
      threadFirst(
        document.createElementNS(svgNS, 'circle'),
        [withAttribute, 'cx', cx],
        [withAttribute, 'cy', cy],
        [withAttribute, 'r', this.dotRadius],
        [withAttribute, 'fill', 'black']
      )
    );
  }

  renderSymbols(cx, cy, baseRadius, symbols, withCharColor) {
    for (var i = 0; i < this.stateCount; i++) {
      let c = symbols[i];
      if (!c) {
        continue;
      }
      let color = 'black';
      if (withCharColor) {
        if (/[A-Z]/.test(c)) {
          color = 'blue';
        } else if (/[a-z]/.test(c)) {
          color = 'red';
        }
      }
      let angleRad = this.angleAtIndex(i + 0.5);
      let angleDeg = (angleRad * 180) / Math.PI + 90;
      let cosx = Math.cos(angleRad);
      let sinx = Math.sin(angleRad);
      let r = baseRadius + 0.5 * this.textHeight;
      let x = cx + r * cosx;
      let y = cy + r * sinx;
      let textNode = threadFirst(
        document.createElementNS(svgNS, 'text'),
        [withAttribute, 'x', x],
        [withAttribute, 'y', y],
        [withAttribute, 'font-size', this.fontSize],
        [
          withAttribute,
          'font-family',
          "'Fira Mono', 'Menlo', 'Consolas', 'Liberation Mono', 'monospace'",
        ],
        [withAttribute, 'text-anchor', 'middle'],
        [withAttribute, 'fill', color],
        [withAttribute, 'dominant-baseline', 'middle'],
        [withAttribute, 'transform', `rotate(${angleDeg},${x},${y})`],
        [withText, c]
      );
      this.svg.appendChild(textNode);
    }
  }
}

/*function setSVGPhysicalSize(svg, widthMM, heightMM) {
  svg.setAttribute("width", widthMM + "mm");
  svg.setAttribute("height", heightMM + "mm");
  svg.setAttribute("viewBox", `0 0 ${widthMM} ${heightMM}`);
}*/

function maxStringLength(arr) {
  return arr.reduce((max, s) => Math.max(max, s.length), 0);
}

function splitOutputSpec(outputSpec) {
  let maxOutLen = maxStringLength(outputSpec);
  let dst = new Array(maxOutLen);
  let n = outputSpec.length;
  for (var i = 0; i < maxOutLen; i++) {
    dst[i] = new Array(n);
  }
  for (var i = 0; i < n; i++) {
    var s = outputSpec[i];
    for (var j = 0; j < s.length; j++) {
      dst[j][i] = s[j];
    }
  }
  return dst;
}

function renderState() {
  let cfg = getConfig();

  let outputSpec = cfg['outputSpec'];
  let splitOutput = splitOutputSpec(outputSpec);
  let maxOutLen = maxStringLength(outputSpec);

  let svg = document.getElementById('drawing');
  // Set SVG to 100x100mm, so radius 40 is 40mm on paper
  //setSVGPhysicalSize(svg, 100, 100);
  drawing.replaceChildren();

  let d = new DrawingContext(drawing, cfg);
  let thickness = d.textHeight * maxOutLen;
  d.renderDisk(d.cx0, d.cy0, thickness);
  d.renderSymbols(d.cx0, d.cy0, d.innerRadius, cfg['inputSpec'], false);
  d.renderDisk(d.cx1, d.cy1, thickness);
  for (var j = 0; j < maxOutLen; j++) {
    d.renderSymbols(
      d.cx1,
      d.cy1,
      d.innerRadius - j * d.textHeight,
      splitOutput[j],
      true
    );
  }
}

function generate() {
  let cfg = getConfig();
  let stateCount = cfg['stateCount'];
  let inputSpec = document.getElementById('inputspec');
  inputSpec.value = shuffleArray(parseSymbols(cfg['inputSymbols'])).join('');

  let outputSpec = document.getElementById('outputspec');
  let strlen = cfg['strlen'];

  let outputValue = randomBalancedSample(
    stateCount,
    strlen,
    cfg['outputSymbols']
  ).join(' ');
  console.log(stateCount, cfg['outputSymbols'], outputValue);
  outputSpec.value = outputValue;

  renderState();
  refreshUI();
}

document.getElementById('renderState').addEventListener('click', renderState);

// Add Print SVG button
function printSVG() {
  const svg = document.getElementById('drawing');
  if (!svg) return;
  const svgData = new XMLSerializer().serializeToString(svg);
  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Print SVG</title>
  <style>
    @page {
      margin: 0;
      size: A4 portrait;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    html, body {
      margin: 0;
      padding: 0;
      width: 210mm;
      height: 297mm;
      overflow: hidden;
    }
    svg {
      display: block;
      width: 210mm;
      height: 297mm;
    }
    @media print {
      html, body {
        margin: 0;
        padding: 0;
        width: 210mm;
        height: 297mm;
        overflow: hidden;
      }
      svg {
        display: block;
        width: 210mm;
        height: 297mm;
        page-break-after: avoid;
      }
    }
  </style>
</head>
<body>${svg.outerHTML}<script>window.onload=function(){window.print();}</script></body>
</html>`);
  win.document.close();
}

// Download SVG function
function downloadSVG() {
  const svg = document.getElementById('drawing');
  if (!svg) return;
  const svgData = new XMLSerializer().serializeToString(svg);
  const blob = new Blob([svgData], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'pasdrowka.svg';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

[inputEl, outputEl].forEach(function (el) {
  el.addEventListener('input', function (e) {
    refreshUI();
  });
});

[inputSpecEl, outputSpecEl].forEach(function (el) {
  el.addEventListener('input', function (e) {
    renderState();
    refreshUI();
  });
});

let strlenNode = document.getElementById('strlen');

inputSpecEl.addEventListener('input', refreshUI);
outputSpecEl.addEventListener('input', refreshUI);

// Create and insert the buttons after the renderState button
const renderBtn = document.getElementById('renderState');
const printBtn = document.createElement('button');
printBtn.textContent = 'Print SVG';
printBtn.type = 'button';
printBtn.style.marginLeft = '0.5em';
printBtn.addEventListener('click', printSVG);
renderBtn.parentNode.insertBefore(printBtn, renderBtn.nextSibling);

const downloadBtn = document.createElement('button');
downloadBtn.textContent = 'Download SVG';
downloadBtn.type = 'button';
downloadBtn.style.marginLeft = '0.5em';
downloadBtn.addEventListener('click', downloadSVG);
renderBtn.parentNode.insertBefore(downloadBtn, printBtn.nextSibling);

refreshUI();
