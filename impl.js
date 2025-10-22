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

function withText(dst, text) {
  dst.appendChild(document.createTextNode(text));
  return dst;
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
  updateRemoveButtonsVisibility();
}

function unusedOutputSymbols(form) {
  let dst = new Set();
  let children = form.children;
  let usedSet = new Set();
  for (let i = 1; i < children.length; i++) {
    let el = document.getElementById(outputSymbolsKey(i));
    let s = el.value;
    for (const c of s) {
      usedSet.add(c);
    }
  }
  let unused = "";
  for (const c of defaultOutputSymbols) {
    if (!usedSet.has(c)) {
      unused += c;
    }
  }
  return unused;
}


let fsOutputRe = /fs_output(\d+)$/;

function getMaxOutputId() {
  let fieldsets = document.getElementById("configform").children;
  return parseInt(
    fieldsets[fieldsets.length-1]
      .id.match(fsOutputRe)[1]);
}

function getNextOutputId() {
  return 1 + getMaxOutputId();
}

function addRow() {
  let dst = document.getElementById("configform");
  let unused = unusedOutputSymbols(dst);
  
  let index = getNextOutputId();
  let fieldset = threadFirst(
    document.createElement("fieldset"),
    [withAttribute, "id", "fs_output" + index]);
  let legend = threadFirst(
    document.createElement("legend"),
    [withText, legendText(index)]);
  let symKey = outputSymbolsKey(index);
  let caseKey = randomCaseKey(index);
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
    [withAttribute, "type", "checkbox"]);
  let caseLabel = threadFirst(
    document.createElement("label"),
    [withText, "Random case"],
    [withAttribute, "for", caseKey]);
  fieldset.appendChild(legend);
  fieldset.appendChild(label);
  fieldset.appendChild(symbols);
  fieldset.appendChild(caseInput);
  fieldset.appendChild(caseLabel);
  fieldset.appendChild(remove);
  dst.appendChild(fieldset);
  updateRemoveButtonsVisibility();
}

function getState() {
  let inputSymbols = document.getElementById("inputsymbols").value;
  let outputSymbolSets = [];
  let children = Array.from(
    document.getElementById("configform").children);
  children.forEach((child, i) => {
    if (1 <= i) {
      let input = child.querySelector("input");
      console.log(input.value);
    }
  });
  return {
    "inputSymbols": inputSymbols,
    //"outputSymbols": outputRows
  };
}

console.log(getMaxOutputId());

function generate() {
  console.log(getState());
}
