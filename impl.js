const defaultOutputSymbols = "abcdefghijklmnopqrstuvwxyz0123456789,.-/!";

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
  console.log("IS OK?", isOK);
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

function updateRateVisibility() {
  //let rateLabels = document.getElementById("configform");
  
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

function getConfig() {
  let inputSymbols = parseSymbols(
    document.getElementById("inputsymbols").value);
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

  return {
    "inputSymbols": inputSymbols,
    "outputRows": outputRows,
    "stateCount": inputSymbols.length + 1,
    "totalErrors": totalErrors
  };
}

let svgNS = "http://www.w3.org/2000/svg";

function createCircle(cx, cy, radius) {
  let dst = document.createElementNS(svgNS, "circle");
  dst.setAttribute("cx", cx);
  dst.setAttribute("cy", cy);
  dst.setAttribute("r", radius);
  dst.setAttribute("stroke", "black");
  dst.setAttribute("stroke-width", 0.5);
  dst.setAttribute("fill", "transparent");
  return dst;
}

function renderState() {
  let svg = document.getElementById("drawing");

  let margin = 10;
  let outerRadius = 40;
  let textHeight = 10;
  let innerRadius = outerRadius - textHeight;
  let c0 = margin + outerRadius;
  
  let outerCircle = createCircle(c0, c0, outerRadius);
  let innerCircle = createCircle(c0, c0, innerRadius);
  
  drawing.replaceChildren();
  drawing.appendChild(outerCircle);
  drawing.appendChild(innerCircle);  
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

function generate() {
  let cfg = getConfig();
  console.log(cfg);
  let inputSpec = document.getElementById("inputspec");
  inputSpec.value = shuffleArray(cfg["inputSymbols"]).join("");
  
  renderState();
}

refreshUI();
