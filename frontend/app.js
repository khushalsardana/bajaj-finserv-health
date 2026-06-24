const DEFAULT_API_URL = "http://localhost:5000";

const EXAMPLES = {
  default: `[\n  "A->B", "A->C", "B->D", "C->E", "E->F",\n  "X->Y", "Y->Z", "Z->X",\n  "P->Q", "Q->R",\n  "G->H", "G->H", "G->I",\n  "hello", "1->2", "A->"\n]`,
  cycle: `[\n  "X->Y",\n  "Y->Z",\n  "Z->W",\n  "W->X"\n]`
};

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  // Dynamically set default API URL based on where the app is running
  const defaultUrl = window.location.origin.includes("localhost") || window.location.origin.startsWith("file://")
    ? "http://localhost:5000"
    : window.location.origin;
  document.getElementById("api-url").value = defaultUrl;

  loadExample('default');
  loadIdentityDetails();
  document.getElementById("api-url").addEventListener("change", loadIdentityDetails);
  document.getElementById("analyzer-form").addEventListener("submit", handleFormSubmit);
});

// Load examples
window.loadExample = function(type) {
  const textarea = document.getElementById("node-data");
  if (EXAMPLES[type]) {
    textarea.value = EXAMPLES[type];
  }
};

// Fetch student info on load
async function loadIdentityDetails() {
  const apiUrl = document.getElementById("api-url").value.trim() || DEFAULT_API_URL;
  try {
    const response = await fetch(`${apiUrl}/bfhl`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: [] })
    });
    if (response.ok) {
      const data = await response.json();
      document.getElementById("header-email").textContent = data.email_id;
      document.getElementById("header-roll").textContent = data.college_roll_number;
    }
  } catch (error) {
    document.getElementById("header-email").textContent = "Offline";
    document.getElementById("header-roll").textContent = "N/A";
  }
}

// Parses input string into array of edges
function parseEdgeInput(inputStr) {
  const trimmed = inputStr.trim();
  if (!trimmed) return [];
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed.map(item => String(item).trim());
    }
  } catch (e) {}
  return trimmed.split(/[,\n]+/).map(item => item.trim()).filter(Boolean);
}

// Submit graph data
async function handleFormSubmit(e) {
  e.preventDefault();
  const apiUrl = document.getElementById("api-url").value.trim() || DEFAULT_API_URL;
  const nodeDataStr = document.getElementById("node-data").value;
  const submitBtn = document.getElementById("submit-btn");

  submitBtn.disabled = true;
  submitBtn.textContent = "Analyzing...";

  const parsedData = parseEdgeInput(nodeDataStr);

  try {
    const response = await fetch(`${apiUrl}/bfhl`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: parsedData })
    });
    if (!response.ok) throw new Error("API error");

    const data = await response.json();
    renderResults(data);

    document.getElementById("placeholder-content").classList.add("hidden");
    document.getElementById("results-content").classList.remove("hidden");
  } catch (error) {
    alert("Error: Could not connect to API server.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Analyze Graph";
  }
}

// Render values into elements
function renderResults(data) {
  document.getElementById("sum-trees").textContent = data.summary.total_trees;
  document.getElementById("sum-cycles").textContent = data.summary.total_cycles;
  document.getElementById("sum-largest-root").textContent = data.summary.largest_tree_root || "None";

  const trees = data.hierarchies.filter(h => !h.has_cycle);
  const cycles = data.hierarchies.filter(h => h.has_cycle);

  // Render Trees
  const treesContainer = document.getElementById("trees-list-container");
  treesContainer.innerHTML = trees.length === 0
    ? '<p class="info-text">No valid trees found.</p>'
    : trees.map(treeObj => `
        <div class="tree-card">
          <p class="tree-title">Tree Root: ${treeObj.root} (Depth: ${treeObj.depth})</p>
          <pre>${JSON.stringify(treeObj.tree, null, 2)}</pre>
        </div>
      `).join("");

  // Render Cycles
  const cyclesContainer = document.getElementById("cycles-list-container");
  cyclesContainer.innerHTML = cycles.length === 0
    ? '<p class="info-text">No cyclic groups detected.</p>'
    : cycles.map(cycleObj => `
        <div class="cycle-card">
          <strong>Cycle Root: ${cycleObj.root}</strong> - Cyclic loop detected.
        </div>
      `).join("");

  // Render Validation Invalid Entries
  const invalidContainer = document.getElementById("invalid-entries-container");
  invalidContainer.innerHTML = data.invalid_entries.length === 0
    ? '<span class="info-text">None</span>'
    : data.invalid_entries.map(entry => `<span class="badge">${entry}</span>`).join("");

  // Render Validation Duplicate Edges
  const duplicateContainer = document.getElementById("duplicate-edges-container");
  duplicateContainer.innerHTML = data.duplicate_edges.length === 0
    ? '<span class="info-text">None</span>'
    : data.duplicate_edges.map(entry => `<span class="badge badge-warning">${entry}</span>`).join("");

  // Raw JSON
  document.getElementById("raw-json-output").textContent = JSON.stringify(data, null, 2);
}
