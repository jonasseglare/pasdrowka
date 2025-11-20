const defaultInputSymbols = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ-.';
const defaultOutputSymbols =
  'abcdefghijklmnpqrstuvwxyzABCDEFGHIJKLMNPQRSTUVWXYZ123456789.,';
const defaultStringLength = 2;

let generateButton = document.getElementById('genbutton');
let inputSpecEl = document.getElementById('inputspec');
let outputSpecEl = document.getElementById('outputspec');
let inputEl = document.getElementById('inputsymbols');
let outputEl = document.getElementById('outputsymbols');
let specErrorEl = document.getElementById('specError');
let svgNode = document.getElementById('drawing');
let resetButton = document.getElementById('reset');
let strlenEl = document.getElementById('strlen');
let strlenErrorEl = document.getElementById('strlenerror');

const paperWidthMM = '210';
const paperHeightMM = '297';

let colors = [
  'red',
  'green',
  'blue',
  'cyan',
  'yellow',
  'magenta',
  'gray',
  'black',
];

function reset() {
  inputEl.value = defaultInputSymbols;
  outputEl.value = defaultOutputSymbols;
  strlenEl.value = defaultStringLength;
  inputSpecEl.value = '';
  outputSpecEl.value = '';
  refreshUI();
  renderState();
}

function randInt(max) {
  if (max <= 0 || max > Number.MAX_SAFE_INTEGER)
    throw new Error('max must be a positive safe integer');

  const array = new Uint32Array(1);
  const range = 0x100000000; // 2^32

  // rejection sampling to avoid modulo bias
  const limit = range - (range % max);

  let random;
  do {
    crypto.getRandomValues(array);
    random = array[0];
  } while (random >= limit);

  return random % max;
}

function shuffleArray(array) {
  // Make a shallow copy to avoid mutating the original array
  const shuffled = array.slice();

  for (let i = shuffled.length - 1; i > 0; i--) {
    // Generate a random index from 0 to i
    const j = randInt(i + 1);
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

function randomBalancedSample(inputSymbolCount, strlen, outputSymbols) {
  let cats = outputCategories(outputSymbols);
  let subsets = sampleSubsets(inputSymbolCount, strlen, cats.length);

  function inds2str(subset) {
    let y = '';
    subset.forEach(function (j) {
      y += randNth(cats[j]);
    });
    return y;
  }

  let seenStr = new Set();
  let dst = new Array(inputSymbolCount);
  for (var i = 0; i < inputSymbolCount; i++) {
    var x = null;
    for (var j = 0; j < 5; j++) {
      x = inds2str(subsets[i]);
      if (!seenStr.has(x)) {
        break;
      }
    }
    seenStr.add(x);
    dst[i] = x;
  }
  return dst;
}

function test() {
  {
    let dst = new Set();
    for (let i = 0; i < 300; i++) {
      dst.add(randInt(3));
    }
    console.assert(3 == dst.size);
    console.assert(dst.has(0));
    console.assert(dst.has(1));
    console.assert(dst.has(2));
  }
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
  {
    for (var i = 0; i < 40; i++) {
      let cs = colorSequence(i);
      console.assert(cs.length == i);
      if (2 <= i) {
        for (var j = 0; j < i; j++) {
          let next = (j + 1) % i;
          console.assert(cs[j] != cs[next]);
        }
      }
    }
  }
  console.log('All tests passed.');
}

test();

function randNth(arr) {
  return arr[randInt(arr.length)];
}

function div0(a, b) {
  return Math.floor(a / b);
}

function div1(a, b) {
  return Math.floor((a - 1.0) / b) + 1;
}

function colorSequence(stateCount) {
  let dst = new Array(stateCount);
  if (stateCount == 0) {
    return dst;
  }
  let len = colors.length;
  let cycleCount = div1(stateCount, len);
  let baseCount = div0(stateCount, cycleCount);
  let extra = stateCount - baseCount * cycleCount;

  var at = 0;
  for (var i = 0; i < cycleCount; i++) {
    let limit = baseCount + (i < extra ? 1 : 0);
    for (var j = 0; j < limit; j++) {
      dst[at++] = colors[j];
    }
  }
  console.assert(at === stateCount);
  return dst;
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
  generateButton.disabled = cfg['ioError'] || cfg['strlenError'];
  strlenErrorEl.textContent = cfg['strlenError'] || '';
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

function checkIOError(s, label) {
  if (/\s/.test(s)) {
    return 'No whitespace allowed';
  } else if (s.length == 0) {
    return 'Empty string for ' + label;
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

  let inputError = checkIOError(inputValue, 'input symbols');
  let outputError = checkIOError(outputValue, 'output symbols');

  let inputSpec = inputSpecEl.value;
  let outputSpec = parseOutputSpec(outputSpecEl.value);

  let inputSpecError = checkIOError(inputSpec, 'input spec');
  let inputSymbolCount = 1 + inputValue.length;

  let expectedOutputSpecLen = inputSpec.length + 1;
  let outputSpecError =
    expectedOutputSpecLen == outputSpec.length
      ? null
      : 'Output spec has length ' +
        outputSpec.length +
        ' but should be ' +
        expectedOutputSpecLen;
  let stateCount = Math.max(12, inputSpec.length + 1);

  let strlenError =
    strlenEl.value === ''
      ? 'Invalid value'
      : strlenEl.value < 1
        ? 'Value too low'
        : null;

  return {
    stateCount: stateCount,
    strlen: strlenEl.value,
    strlenError: strlenError,
    inputSymbolCount: inputSymbolCount,
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
  constructor(svg, stateCount) {
    let scale = 1.0;
    this.svg = svg;
    this.margin = 7.5 * scale;
    this.outerRadius = 30 * scale;
    this.textHeight = 5.25 * scale;
    this.lineHeight = 7 * scale;
    this.fontSize = 4.0 * scale;
    this.innerRadius = this.outerRadius - this.textHeight;
    this.svg = svg;
    this.stateCount = stateCount;
    this.angleStep = (2.0 * Math.PI) / this.stateCount;
    let offset = this.margin + this.outerRadius;
    this.cx0 = offset;
    this.cy0 = this.cx0;
    this.cx1 = this.cx0;
    this.cy1 = this.cy0 + 2.0 * this.outerRadius + this.margin;
    this.dotRadius = 1.0 * scale;
    this.coloredSectorRadius = 31 * scale;
    this.sectorColors = colorSequence(this.stateCount);
    this.sectorThickness = 2 * scale;
    this.width = 2 * (this.margin + this.outerRadius);
    this.textY = 3 * this.margin + 4 * this.outerRadius;
    this.baseHeight = this.textY + this.margin;
  }

  computeHeight(lineCount) {
    return this.baseHeight + lineCount * this.lineHeight;
  }

  angleAtIndex(i) {
    return i * this.angleStep - Math.PI / 2;
  }

  fromPolar(cx, cy, angle, radius) {
    return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
  }

  renderColoredSector(cx, cy, index) {
    let alpha = this.angleAtIndex(index);
    let beta = this.angleAtIndex(index + 1);
    let r = this.coloredSectorRadius;
    let x0, y0, x1, y1;
    [x0, y0] = this.fromPolar(cx, cy, alpha, r);
    [x1, y1] = this.fromPolar(cx, cy, beta, r);

    let dst = document.createElementNS(svgNS, 'path');
    dst.setAttribute(
      'd',
      'M ' + x0 + ',' + y0 + ' A ' + r + ',' + r + ' 0 0,1 ' + x1 + ',' + y1
    );
    dst.setAttribute('fill', 'none');
    dst.setAttribute('stroke', this.sectorColors[index]);
    dst.setAttribute('stroke-with', this.sectorThickness);
    this.svg.appendChild(dst);
  }

  renderColoredSectors(cx, cy) {
    for (var i = 0; i < this.stateCount; i++) {
      this.renderColoredSector(cx, cy, i);
    }
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

  createText() {
    return threadFirst(
      document.createElementNS(svgNS, 'text'),
      [withAttribute, 'font-size', this.fontSize],
      [
        withAttribute,
        'font-family',
        "'Fira Mono', 'Menlo', 'Consolas', 'Liberation Mono', 'monospace'",
      ]
    );
  }

  renderLine(lineIndex, text) {
    let x = this.margin;
    let y = lineIndex * this.lineHeight + this.textY;
    this.svg.appendChild(
      threadFirst(
        this.createText(),
        [withAttribute, 'x', x],
        [withAttribute, 'y', y],
        [withAttribute, 'text-anchor', 'left'],
        [withAttribute, 'dominant-baseline', 'auto'],
        [withText, text]
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
        this.createText(),
        [withAttribute, 'x', x],
        [withAttribute, 'y', y],
        [withAttribute, 'text-anchor', 'middle'],
        [withAttribute, 'fill', color],
        [withAttribute, 'dominant-baseline', 'middle'],
        [withAttribute, 'transform', `rotate(${angleDeg},${x},${y})`],
        [withText, c]
      );
      this.svg.appendChild(textNode);
    }
  }

  renderCfg(cfg) {
    let outputSpec = cfg['outputSpec'];
    let splitOutput = splitOutputSpec(outputSpec);
    let maxOutLen = maxStringLength(outputSpec);
    let thickness = this.textHeight * Math.max(1, maxOutLen);
    this.renderDisk(this.cx0, this.cy0, thickness);
    this.renderColoredSectors(this.cx1, this.cy1);
    this.renderSymbols(
      this.cx0,
      this.cy0,
      this.innerRadius,
      cfg['inputSpec'],
      false
    );
    this.renderDisk(this.cx1, this.cy1, thickness);
    for (var j = 0; j < maxOutLen; j++) {
      this.renderSymbols(
        this.cx1,
        this.cy1,
        this.innerRadius - j * this.textHeight,
        splitOutput[j],
        true
      );
    }
    this.renderLine(0, 'Input:  ' + cfg['inputSpec']);
    this.renderLine(1, 'Output:');
    var lineCounter = 2;
    let maxLine = 30;
    var s = '';
    var self = this;
    function emitLine() {
      if (0 < s.length) {
        self.renderLine(lineCounter++, s);
        s = '';
      }
    }
    for (var i = 0; i < outputSpec.length; i++) {
      s += outputSpec[i] + ' ';
      if (maxLine <= s.length) {
        emitLine();
      }
    }
    emitLine();
    return { width: this.width, height: this.computeHeight(lineCounter) };
  }
}

function maxStringLength(arr) {
  return arr.reduce((max, s) => Math.max(max, s.length), 0);
}

function splitOutputSpec(outputSpec) {
  let maxOutLen = maxStringLength(outputSpec);
  let dst = new Array(maxOutLen);
  let n = outputSpec.length;
  for (let i = 0; i < maxOutLen; i++) {
    dst[i] = new Array(n);
  }
  for (let i = 0; i < n; i++) {
    var s = outputSpec[i];
    for (var j = 0; j < s.length; j++) {
      dst[j][i] = s[j];
    }
  }
  return dst;
}

function renderState() {
  let cfg = getConfig();
  svgNode.replaceChildren();
  let d = new DrawingContext(svgNode, cfg['stateCount']);
  let size = d.renderCfg(cfg);
  let width = size['width'];
  let height = size['height'];
  svgNode.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
  svgNode.setAttribute('width', '100%');
  svgNode.removeAttribute('height');
}

function generate() {
  let cfg = getConfig();
  let inputSymbolCount = cfg['inputSymbolCount'];
  let inputSpec = document.getElementById('inputspec');
  inputSpec.value = shuffleArray(parseSymbols(cfg['inputSymbols'])).join('');

  let outputSpec = document.getElementById('outputspec');
  let strlen = cfg['strlen'];

  let outputValue = randomBalancedSample(
    inputSymbolCount,
    strlen,
    cfg['outputSymbols']
  ).join(' ');
  outputSpec.value = outputValue;

  renderState();
  refreshUI();
}

function setAttributes(dst, attribMap) {
  for (let k in attribMap) {
    dst.setAttribute(k, attribMap[k]);
  }
}

function setSvgWidthHeight(dst, widthMM, heightMM) {
  setAttributes(dst, {
    width: widthMM + 'mm',
    height: heightMM + 'mm',
    viewBox: '0 0 ' + widthMM + ' ' + heightMM,
  });
}

function withFullSvg(f) {
  let svg = document.getElementById('drawing');
  if (!svg) {
    f(svg);
    return;
  }

  let newAttrs = {
    width: paperWidthMM + 'mm',
    height: paperHeightMM + 'mm',
    viewBox: '0 0 ' + paperWidthMM + ' ' + paperHeightMM,
  };
  let oldAttrs = {};

  for (let k in newAttrs) {
    oldAttrs[k] = svg.getAttribute(k);
    svg.setAttribute(k, newAttrs[k]);
  }

  f(svg);

  for (let k in oldAttrs) {
    svg.setAttribute(k, oldAttrs[k]);
  }
}

// Add Print SVG button
function printSVG() {
  withFullSvg(function (svg) {
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
  });
}

// Download SVG function
function downloadSVG() {
  withFullSvg(function (svg) {
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
  });
}

[inputEl, outputEl, strlenEl].forEach(function (el) {
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

// Create and insert the buttons after the renderState button
const printBtn = document.getElementById('printBtn');
printBtn.textContent = 'Print SVG';
printBtn.type = 'button';
printBtn.style.marginLeft = '0.5em';
printBtn.addEventListener('click', printSVG);

const downloadBtn = document.getElementById('downloadBtn');
downloadBtn.textContent = 'Download SVG';
downloadBtn.type = 'button';
downloadBtn.style.marginLeft = '0.5em';
downloadBtn.addEventListener('click', downloadSVG);

resetButton.addEventListener('click', reset);

reset();
refreshUI();
renderState();
