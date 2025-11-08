const defaultOutputSymbols = "abcdefghijklmnpqrstuvwxyz123456789,.-/!";

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

const regex = /^\s*(\d+(?:\.\d+)?)\s*%\s*$/;

function parsePercentage(x) {
  let match = x.match(regex);
  return match? 0.01*(new Number(match[1])) : null;
}

function getOutputRateFromText(text) {
  let errors = new Array();
  let parsed = parsePercentage(text);
  if (!parsed) {
    errors.push("Invalid rate syntax");
  } else if (parsed < 0.0) {
    errors.push("Output rate too low");
  } else if (1.0 < parsed) {
    errors.push("Output rate too high");
  }
  return {
    "rate": errors.length == 0? parsed : null,
    "errors": errors
  };
}

function getOutputRate(index) {
  let rateBox = document.getElementById(rateKey(index));
  return getOutputRateFromText(rateBox.value);
}

function refreshTotalError() {
  let config = getConfig();
  let node = document.getElementById("totalerror");
  node.replaceChildren();
  let totalErrors = config["totalErrors"];
  node.appendChild(document.createTextNode(
    totalErrors.join(", ")));
  let isOK = totalErrors.length == 0;
  document.getElementById("genbutton").disabled = !isOK;
}

function refreshOutputRow(index) {
  let errors = getOutputRate(index)["errors"];
  let errorsP = document.getElementById(errorsKey(index));
  errorsP.replaceChildren();
  errorsP.appendChild(document.createTextNode(errors.join(", ")));
}

function outputRowChanged(index) {
  refreshOutputRow(index);
  refreshTotalError();
}

function outputRowChangeListener(index) {
  return function(event) {
    outputRowChanged(index);
  }
}

function withAttribute(dst, k, v) {
  dst.setAttribute(k, v);
  return dst;
}

function legendText(index) {
  return "Output symbols " + index;
}

function outputSymbolsKey(index) {
  return "outputsymbols_out" + index;
}

function randomCaseKey(index) {
  return "randomcase_out" + index;
}

function rateKey(index) {
  return "rate_out" + index;
}

function errorsKey(index) {
  return "errors_out" + index;
}

function removeCall(index) {
  return "removeOut(" + index + ")";
}

function updateRemoveButtonsVisibility() {
  let buttons = document
    .getElementById("configform")
    .querySelectorAll("button");

  if (buttons.length == 1) {
    buttons[0].setAttribute("class", "invisible");
  } else {
    buttons.forEach(function(b) {
      b.removeAttribute("class");
    });
  }
}

function getOutputRowIds() {
  let form = document.getElementById("configform")
  let children = Array.from(form.children).slice(1);
  return children.map(function(el) {
    return fsOutputId2index(el.id);
  });
}

function refreshUI() {
  getOutputRowIds().forEach(refreshOutputRow);
  refreshTotalError();
}


function updateVisibility() {
  updateRemoveButtonsVisibility();
  console.log(getOutputRowIds());
}

function removeOut(index) {
  let dst = document.getElementById("configform");
  //let children = dst.children;
  let toRemove = document.getElementById("fs_output" + index);
  dst.removeChild(toRemove);
  children = dst.children;
  for (let i = 1; i < children.length; i++) {
    let el = children[i];
    let legend = el.querySelector("legend");
    legend.firstChild.nodeValue = legendText(i);
  }
  updateVisibility();
}

function unusedOutputSymbols(form) {
  let dst = new Set();
  let usedSet = new Set();
  getOutputRowIds().forEach(function(index) {
    let el = document.getElementById(outputSymbolsKey(index));
    let s = el.value;
    for (const c of s) {
      usedSet.add(c);
    }
  });
  let unused = "";
  for (const c of defaultOutputSymbols) {
    if (!usedSet.has(c)) {
      unused += c;
    }
  }
  return unused;
}


let fsOutputRe = /fs_output(\d+)$/;

function fsOutputId2index(fsOutputId) {
  return parseInt(fsOutputId.match(fsOutputRe)[1]);
}

function getMaxOutputId() {
  let fieldsets = document.getElementById("configform").children;
  return fsOutputId2index(fieldsets[fieldsets.length-1].id);
}

function getNextOutputId() {
  return 1 + getMaxOutputId();
}

function addRow() {
  let dst = document.getElementById("configform");
  let unused = unusedOutputSymbols(dst);
  let fieldsetCount = document.getElementById(
    "configform").children.length;
  
  let index = getNextOutputId();
  let fieldset = threadFirst(
    document.createElement("fieldset"),
    [withAttribute, "id", "fs_output" + index]);
  let legend = threadFirst(
    document.createElement("legend"),
    [withText, legendText(fieldsetCount)]);
  let symKey = outputSymbolsKey(index);
  let caseKey = randomCaseKey(index);
  let rKey = rateKey(index);
  let eKey = errorsKey(index);
  let label = threadFirst(
    document.createElement("label"),
    [withText, "Output symbols"],
    [withAttribute, "for", symKey]);
  let symbols = threadFirst(
    document.createElement("input"),
    [withAttribute, "id", symKey],
    [withAttribute, "value", unused]);
  let remove = threadFirst(
    document.createElement("button"),
    [withText, "Remove"],
    [withAttribute, "onclick", removeCall(index)]);
  let caseInput = threadFirst(
    document.createElement("input"),
    [withAttribute, "id", caseKey],
    [withAttribute, "type", "checkbox"],
    [withAttribute, "checked", "true"]);
  let caseLabel = threadFirst(
    document.createElement("label"),
    [withText, "Random case"],
    [withAttribute, "for", caseKey]);
  
  let rateLabel = threadFirst(
    document.createElement("label"),
    [withText, "Rate"],
    [withAttribute, "for", rKey]);
  let rateInput = threadFirst(
    document.createElement("input"),
    [withAttribute, "id", rKey],
    [withAttribute, "value", "100%"],
    [withEventListener, "input", outputRowChangeListener(index)]);
  let errorsP = threadFirst(
    document.createElement("p"),
    [withAttribute, "id", eKey],
    [withAttribute, "class", "error"]
  );
  fieldset.appendChild(legend);
  fieldset.appendChild(label);
  fieldset.appendChild(symbols);
  fieldset.appendChild(caseInput);
  fieldset.appendChild(caseLabel);
  fieldset.appendChild(rateLabel);
  fieldset.appendChild(rateInput);
  fieldset.appendChild(remove);
  fieldset.appendChild(errorsP);
  dst.appendChild(fieldset);
  updateVisibility();
}

function parseSymbols(src) {
  return Array.from(src).map(function(c) {return c;});
}

function splitStringBySpaces(src) {
  return src.split(/\s+/);
}

function getConfig() {
  let inputValue = document.getElementById("inputsymbols").value;
  let inputSymbols = parseSymbols(inputValue);
  let children = Array.from(
    document.getElementById("configform").children);
  let errorFound = false;
  let outputRows = children.slice(1).map((child) => {
    let inputs = child.querySelectorAll("input");
    let textInput = inputs[0];
    let checkboxInput = inputs[1];
    let rateInput = inputs[2];
    let rate = getOutputRateFromText(rateInput.value)["rate"];
    if (!rate) {
      errorFound = true;
    }
    return {
      "outputSymbols": parseSymbols(textInput.value),
      "randomCase": checkboxInput.checked,
      "rate": rate
    };
  });

  let totalErrors = [];

  if (/\s/.test(inputValue)) {
    totalErrors.push("Whitespace not allowed in input value");
  }
  
  let found = false;
  outputRows.forEach(function(row) {
    let rate = row["rate"];
    if (1.0 <= rate) {
      found = true;
    }
  });
  if (errorFound) {
    totalErrors.push("Error in output symbols spec");
  }
  if (!found) {
    totalErrors.push("There must be at least one output row with rate 100%");
  }
  let inputSpec = document.getElementById("inputspec").value;
  let outputSpec = document.getElementById("outputspec").value;
  

  return {
    "inputSymbols": inputSymbols,
    "outputRows": outputRows,
    "stateCount": inputSymbols.length + 1,
    "totalErrors": totalErrors,
    "inputSpec": inputSpec,
    "outputSpec": splitStringBySpaces(outputSpec)
  };
}

let svgNS = "http://www.w3.org/2000/svg";

function createCircle(cx, cy, radius) {
  let dst = document.createElementNS(svgNS, "circle");
  dst.setAttribute("cx", cx);
  dst.setAttribute("cy", cy);
  dst.setAttribute("r", radius);
  dst.setAttribute("stroke", "black");
  dst.setAttribute("stroke-width", 0.25);
  dst.setAttribute("fill", "transparent");
  return dst;
}

function createLine(x0, y0, x1, y1) {
  let dst = document.createElementNS(svgNS, "line");
  dst.setAttribute("x1", x0);
  dst.setAttribute("y1", y0);
  dst.setAttribute("x2", x1);
  dst.setAttribute("y2", y1);
  dst.setAttribute("stroke", "black");
  dst.setAttribute("stroke-width", 0.25);  
  return dst;
}

class DrawingContext {
  constructor(svg, cfg) {
    let scale = 1.0;
    this.svg = svg;
    this.margin = 7.5*scale;
    this.outerRadius = 30*scale;
    this.textHeight = 5.25*scale;
    this.fontSize = 4.0*scale;
    this.innerRadius = this.outerRadius - this.textHeight;
    this.svg = svg;
    this.cfg = cfg;
    this.stateCount = cfg["stateCount"];
    this.angleStep = 2.0*Math.PI/this.stateCount;
    let offset = this.margin + this.outerRadius;
    this.cx0 = offset;
    this.cy0 = this.cx0;
    this.cx1 = this.cx0;
    this.cy1 = this.cy0 + 2.0*this.outerRadius + this.margin;
    this.dotRadius = 2.0*scale;
  }


  angleAtIndex(i) {
    return i*this.angleStep - Math.PI/2;
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
      let x0 = cx + innerRadius*cosx;
      let y0 = cy + innerRadius*sinx;
      let x1 = cx + this.outerRadius*cosx;
      let y1 = cy + this.outerRadius*sinx;
      this.svg.appendChild(createLine(x0, y0, x1, y1));
    }
    this.svg.appendChild(
      threadFirst(
        document.createElementNS(svgNS, "circle"),
        [withAttribute, "cx", cx],
        [withAttribute, "cy", cy],
        [withAttribute, "r", this.dotRadius],
        [withAttribute, "fill", "black"]
      ));
  }

  renderSymbols(cx, cy, baseRadius, symbols, withCharColor) {
    for (var i = 0; i < this.stateCount; i++) {
      let c = symbols[i];
      if (!c) {
        continue;
      }
      let color = "black";
      if (withCharColor) {
        if (/[A-Z]/.test(c)) {
          color = "blue";
        } else if (/[a-z]/.test(c)) {
          color = "red";
        }
      }
      let angleRad = this.angleAtIndex(i + 0.5);
      let angleDeg = angleRad * 180 / Math.PI + 90;
      let cosx = Math.cos(angleRad);
      let sinx = Math.sin(angleRad);
      let r = baseRadius + 0.5*this.textHeight;
      let x = cx + r * cosx;
      let y = cy + r * sinx;
      let textNode = threadFirst(
        document.createElementNS(svgNS, "text"),
        [withAttribute, "x", x],
        [withAttribute, "y", y],
        [withAttribute, "font-size", this.fontSize],
        [withAttribute, "font-family", "'Fira Mono', 'Menlo', 'Consolas', 'Liberation Mono', 'monospace'"],
        [withAttribute, "text-anchor", "middle"],
        [withAttribute, "fill", color],
        [withAttribute, "dominant-baseline", "middle"],
        [withAttribute, "transform", `rotate(${angleDeg},${x},${y})`],
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
  
  let outputSpec = cfg["outputSpec"];
  let splitOutput = splitOutputSpec(outputSpec);
  let maxOutLen = maxStringLength(outputSpec);

  let svg = document.getElementById("drawing");
  // Set SVG to 100x100mm, so radius 40 is 40mm on paper
  //setSVGPhysicalSize(svg, 100, 100);
  drawing.replaceChildren();


  let d = new DrawingContext(drawing, cfg);
  let thickness = d.textHeight*maxOutLen;
  d.renderDisk(d.cx0, d.cy0, thickness);
  d.renderSymbols(d.cx0, d.cy0, d.innerRadius, cfg["inputSpec"], false);
  d.renderDisk(d.cx1, d.cy1, thickness);
  for (var j = 0; j < maxOutLen; j++) {
    d.renderSymbols(d.cx1, d.cy1, d.innerRadius - j*d.textHeight, splitOutput[j], true);
  }
}

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

function div1(a, b) {
  return Math.floor((a - 1)/b) + 1;
}

function randomCase(c) {
  if (Math.random() < 0.5) {
    return c;
  }
  let d = c.toLowerCase();
  return c === d? c.toUpperCase() : d;
}

function identity(x) {
  return x;
}

function* sampledSeq(s) {
  let n = s.length;
  if (n == 0) {
    return;
  }
  while (true) {
    shuffleArray(s).forEach(function(c) {
      yield c;
    });
  }
}

function randomBalancedSample(stateCount, rate, rc, outputSymbols) {
  let rcFun = rc? randomCase : identity;
  let dst = new Array(stateCount);
  if (outputSymbols.length <= 0) {
    return dst;
  }
  let n = Math.round(rate*stateCount);
  if (n <= 0) {
    return dst;
  }
  let rep = div1(n, outputSymbols.length);
  let tmp = [];
  for (var i = 0; i < rep-1; i++) {
    tmp = tmp.concat(outputSymbols);
  }
  tmp = tmp.concat(shuffleArray(outputSymbols)).slice(0, n);
  for (var i = 0; i < n; i++) {
    dst[i] = rcFun(tmp[i]);
  }
  return shuffleArray(dst);
}

function generateOutputsForRow(stateCount, outputRow) {
  let outputSymbols = outputRow["outputSymbols"];
  return randomBalancedSample(
    stateCount, outputRow["rate"],
    outputRow["randomCase"], outputSymbols);
}

function generate() {
  let cfg = getConfig();
  console.log(cfg);

  let stateCount = cfg["stateCount"];
  
  let inputSpec = document.getElementById("inputspec");
  inputSpec.value = shuffleArray(cfg["inputSymbols"]).join("");

  let outputSpec = document.getElementById("outputspec");

  let dst = new Array(stateCount);
  for (var i = 0; i < stateCount; i++) {
    dst[i] = "";
  }
  cfg["outputRows"].forEach(function(row) {
    let tmp = generateOutputsForRow(stateCount, row);
    for (var i = 0; i < stateCount; i++) {
      let c = tmp[i];
      if (c) {
        dst[i] += c;
      }
    }
  });
  let outputValue = dst.join(" ");
  outputSpec.value = outputValue;
  
  renderState();
}

document.getElementById("renderState").addEventListener(
  "click", renderState);

// Add Print SVG button
function printSVG() {
  const svg = document.getElementById("drawing");
  if (!svg) return;
  const svgData = new XMLSerializer().serializeToString(svg);
  const win = window.open("", "_blank");
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
  const svg = document.getElementById("drawing");
  if (!svg) return;
  const svgData = new XMLSerializer().serializeToString(svg);
  const blob = new Blob([svgData], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "pasdrowka.svg";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Create and insert the buttons after the renderState button
const renderBtn = document.getElementById("renderState");
const printBtn = document.createElement("button");
printBtn.textContent = "Print SVG";
printBtn.type = "button";
printBtn.style.marginLeft = "0.5em";
printBtn.addEventListener("click", printSVG);
renderBtn.parentNode.insertBefore(printBtn, renderBtn.nextSibling);

const downloadBtn = document.createElement("button");
downloadBtn.textContent = "Download SVG";
downloadBtn.type = "button";
downloadBtn.style.marginLeft = "0.5em";
downloadBtn.addEventListener("click", downloadSVG);
renderBtn.parentNode.insertBefore(downloadBtn, printBtn.nextSibling);

document.getElementById("inputsymbols").addEventListener("input", function() {
  refreshTotalError();
});

refreshUI();
