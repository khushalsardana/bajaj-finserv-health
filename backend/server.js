const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

const USER_ID = process.env.USER_ID || "khushalsardana";
const EMAIL_ID = process.env.EMAIL_ID || "khushal0630.be23@chitkara.edu.in";
const ROLL_NUMBER = process.env.ROLL_NUMBER || "2310990630";

app.get('/bfhl', (req, res) => {
  res.json({ operation_code: 1 });
});

app.post('/bfhl', (req, res) => {
  try {
    const { data } = req.body;
    if (!data || !Array.isArray(data)) {
      return res.status(400).json({ success: false, message: "data must be an array" });
    }

    const invalid_entries = [];
    const seenEdges = new Set();
    const duplicate_edges = [];
    const hasParent = new Map();
    const validEdges = [];

    // 1. Process and validate input edges
    for (const entry of data) {
      if (typeof entry !== 'string') {
        invalid_entries.push(String(entry));
        continue;
      }
      const trimmed = entry.trim();
      const match = trimmed.match(/^([A-Z])->([A-Z])$/);
      if (!match) {
        invalid_entries.push(entry);
        continue;
      }
      
      const [_, u, v] = match;
      if (u === v) {
        invalid_entries.push(entry);
        continue;
      }

      const edge = `${u}->${v}`;
      if (seenEdges.has(edge)) {
        if (!duplicate_edges.includes(edge)) duplicate_edges.push(edge);
        continue;
      }
      seenEdges.add(edge);

      if (hasParent.has(v)) continue; // discard multi-parent

      hasParent.set(v, u);
      validEdges.push({ u, v });
    }

    // 2. Build graph maps and preserve encounter order
    const adj = {}, children = {}, nodeOrder = [];
    for (const { u, v } of validEdges) {
      if (!nodeOrder.includes(u)) nodeOrder.push(u);
      if (!nodeOrder.includes(v)) nodeOrder.push(v);

      if (!adj[u]) adj[u] = [];
      if (!adj[v]) adj[v] = [];
      adj[u].push(v);
      adj[v].push(u);

      if (!children[u]) children[u] = [];
      children[u].push(v);
    }

    // 3. Find connected components using DFS
    const visited = new Set();
    const components = [];
    for (const node of nodeOrder) {
      if (!visited.has(node)) {
        const comp = [];
        const dfs = (curr) => {
          visited.add(curr);
          comp.push(curr);
          for (const next of (adj[curr] || [])) {
            if (!visited.has(next)) dfs(next);
          }
        };
        dfs(node);
        components.push(comp);
      }
    }

    // Helper functions for trees
    const buildTree = (node) => {
      const tree = {};
      const kids = (children[node] || []).sort();
      for (const kid of kids) {
        tree[kid] = buildTree(kid);
      }
      return tree;
    };

    const getDepth = (node) => {
      const kids = children[node] || [];
      if (kids.length === 0) return 1;
      return 1 + Math.max(...kids.map(getDepth));
    };

    // 4. Construct hierarchies
    const hierarchies = [];
    let total_trees = 0, total_cycles = 0;
    let largestTreeRoot = "", largestTreeDepth = -1;

    for (const comp of components) {
      const roots = comp.filter(node => !hasParent.has(node));
      if (roots.length === 1) {
        const root = roots[0];
        const depth = getDepth(root);
        
        hierarchies.push({
          root,
          tree: { [root]: buildTree(root) },
          depth
        });
        total_trees++;

        if (depth > largestTreeDepth || (depth === largestTreeDepth && (!largestTreeRoot || root < largestTreeRoot))) {
          largestTreeDepth = depth;
          largestTreeRoot = root;
        }
      } else {
        hierarchies.push({
          root: [...comp].sort()[0],
          tree: {},
          has_cycle: true
        });
        total_cycles++;
      }
    }

    res.json({
      user_id: USER_ID,
      email_id: EMAIL_ID,
      college_roll_number: ROLL_NUMBER,
      hierarchies,
      invalid_entries,
      duplicate_edges,
      summary: {
        total_trees,
        total_cycles,
        largest_tree_root: largestTreeRoot
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
