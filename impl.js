var globalState = {
  "view": "generate",
  "config": {
    "inputSize": [6, 6],
    "outputSize": [7, 11]
  },
};

function removeAllChildren(root) {
  while (root.firstChild) {
    root.removeChild(root.lastChild);
  }
}

function renderViewGenerate(root, state) {
  removeAllChildren(root);
  let header = document.createElement("h2");
  header.appendChild(document.createTextNode("Generate Password"));
  root.appendChild(header);

  let inputHeader = <h2>Input matrix</h2>;
  root.appendChild(inputHeader);
  
  console.log("Done");
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

renderState(globalState);
