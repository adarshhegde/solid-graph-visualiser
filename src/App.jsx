import { createSignal, onMount } from "solid-js";
import { createStore } from "solid-js/store";
import "./App.css";
import {wait, getIndexFactory} from './utility';
// global state

const [selectionMode, setSelectionMode] = createSignal(null);
const [source_node, setSource_node] = createSignal(13);
const [dest_node, setDest_node] = createSignal(99);
const [grid, setGrid] = createStore([]);
const [graph_rows, setGraph_rows] = createSignal(20);
const [graph_cols, setGraph_cols] = createSignal(20);
const [algo_dropdown_selected, setAlgo_dropdown_selected] = createSignal(
  "breadth_first_search"
);
const getIndex = getIndexFactory(graph_rows(), graph_cols());


class Cell {
  constructor(i, j, type, oneDindex) {
    this.i = i;
    this.idx = oneDindex;
    this.j = j;
    this.id = i + "" + j;
    this.type = createSignal(type);
    this.visited = createSignal(false);
	this.highlight = createSignal(false);
    this.pathnode = createSignal(false);
    this.borders = createSignal([true, true, true, true]);
  }

  getNeighbours() {
    let top = getIndex(this.i - 1, this.j);
    let right = getIndex(this.i, this.j + 1);
    let bottom = getIndex(this.i + 1, this.j);
    let left = getIndex(this.i, this.j - 1);

    return [top, right, bottom, left].filter(
      (x) => x != -1 && grid[x].type[0]() != "wall"
    );
  }

  getUnvisitedNeighbours() {

		let top = getIndex(this.i - 1, this.j);
		let right = getIndex(this.i, this.j + 1);
		let bottom = getIndex(this.i + 1, this.j);
		let left = getIndex(this.i, this.j - 1);

		return [top, right, bottom, left].filter(x=> x !== -1);
  }
}

function CellElement(props) {
  console.log("Rendered cell");

  function handleCellClick(idx) {
    if (selectionMode() == "source") {
      if (source_node() != null) {
        grid[source_node()].type[1]("vert");
      }
      grid[idx].type[1]("source");
      setSource_node(idx);
    } else if (selectionMode() == "dest") {
      if (dest_node() != null) {
        grid[dest_node()].type[1]("vert");
      }
      grid[idx].type[1]("dest");
      setDest_node(idx);
    } else if (
      selectionMode() == "wall" &&
      idx != source_node() &&
      idx != dest_node()
    ) {
      if (grid[idx].type[0]() == "wall") {
        grid[idx].type[1]("vert");
      } else {
        grid[idx].type[1]("wall");
      }
    }
  }

  return (
    <div
      onClick={() => handleCellClick(props.cell.idx)}
      class={[
        "cell",
        props.cell.type[0](),
        props.cell.visited[0]() === true ? "visited" : "",
        props.cell.pathnode[0]() === true ? "pathnode" : "",
		props.cell.highlight[0]() === true ? "highlight" : "",

      ].join(" ")}
    >
      {/* {props.cell.id} */}
    </div>
  );
}

function App() {
  let changes = [];

  let [animating, setAnimating] = createSignal(false);

  onMount(() => {
    let temp = [];

    for (let i = 0; i < graph_rows(); i++) {
      for (let j = 0; j < graph_cols(); j++) {
        let type = "vert";
        let oneDindex = i * graph_rows() + j;
        if (oneDindex == source_node()) type = "source";
        else if (oneDindex == dest_node()) type = "dest";
        else {
          // if(Math.random() > 0.7) type = 'wall';
        }
        temp.push(new Cell(i, j, type, oneDindex));
      }
    }
    setGrid(temp);

    // start_bfs();
  });

  function changeSelectionModeHandler(e) {
    setSelectionMode(
      selectionMode() === e.target.dataset.type ? null : e.target.dataset.type
    );
  }

  function handleStart() {
    if (animating()) return console.log("already animation started");

    if (source_node() != null && dest_node() == null) {
      alert("Set Starting & Ending Nodes");
    } else {
      if (algo_dropdown_selected() === "breadth_first_search") {
        start_bfs();
      } else if (algo_dropdown_selected() === "depth_first_search") {
        start_dfs();
      }
    }
  }

  function handleReset() {
	if(animating()) {
		setAnimating(false);
	}
	changes = [];
	grid.map((cell) => cell.visited[1](false));
    grid.map((cell) => cell.pathnode[1](false));
  }

  async function handleRandomize() {
	setAnimating(true);

    changes = [];

    const previous = new Map();
    const source = source_node();
    const dest = dest_node();

    grid.map((cell) => cell.visited[1](false));
    grid.map((cell) => cell.pathnode[1](false));

    let visited = new Array(grid.length).fill(false);

	const stack = [0];


	// Iterative implementation


	// 	Choose the initial cell, mark it as visited and push it to the stack
	// 	While the stack is not empty
	// 		Pop a cell from the stack and make it a current cell
	// 		If the current cell has any neighbours which have not been visited
	// 			Push the current cell to the stack
	// 			Choose one of the unvisited neighbours
	// 			Remove the wall between the current cell and the chosen cell
	// 			Mark the chosen cell as visited and push it to the stack

	grid[0].visited[1](true);
	grid[0].highlight[1](true);
	let old_current = 0;

	while(stack.length > 0) {
		let vert = stack.pop();
		grid[old_current].highlight[1](false);
		grid[vert].highlight[1](true);
		old_current=vert;
		let unvisited_neighbours = grid[vert].getNeighbours().filter(n => !visited[n]);
		if(unvisited_neighbours.length > 0) {
			stack.push(vert);
			let random = unvisited_neighbours[Math.floor(Math.random() * unvisited_neighbours.length)];
			console.log(random);
			if(Math.sin(Math.random()) > 0.6) grid[random].type[1]('wall');
			visited[random] = true;
			stack.push(random);
		}
		await wait(10);
	}
	

    await animate(changes);
    setAnimating(false);

    return;
  }

  async function start_bfs() {
    setAnimating(true);

    changes = [];

    const previous = new Map();

    grid.map((cell) => cell.visited[1](false));
    grid.map((cell) => cell.pathnode[1](false));

    let visited = new Array(grid.length).fill(false);

    const source = source_node();
    const dest = dest_node();

    let queue = [source];

    while (queue.length > 0) {
      let vert = queue.shift();
      if (!visited.includes(vert)) {
        if (vert === dest) {
          await showPath(previous);
          break;
        }

        // grid[vert].visited[1](true);
        changes.push({ vert, property: "visited", value: true });
        visited.push(vert);
        for (let n of grid[vert].getNeighbours()) {
          if (!visited.includes(n)) {
            if (!previous.has(n)) {
              previous.set(n, vert);
            }
            queue.push(n);
          }
        }
      }
    }

    await animate(changes);
    setAnimating(false);

    return;
  }

  async function animate(changes) {
    const delta = 1 + (changes.length * 2 ) / grid.length;
    const delay_calc = 50 / delta;
	console.log(delta);
    for (let change of changes) {
		if(!animating()) return;
      grid[change.vert][change.property][1](change.value);
      await wait(delay_calc);
    }
    return;
  }

  async function showPath(previous) {
    let currentNode = dest_node();

    let path = [];
    while (currentNode !== source_node()) {
      currentNode = previous.get(currentNode);
      path.push(currentNode);
      // grid[currentNode].pathnode[1](true);
      changes.push({ vert: currentNode, property: "pathnode", value: true });
    }
  }

  async function start_dfs() {
    setAnimating(true);

    changes = [];

    grid.map((cell) => cell.visited[1](false));
    grid.map((cell) => cell.pathnode[1](false));

    const previous = new Map();
    let visited = new Array(grid.length).fill(false);

    let stack = [source_node()];

	let old_current = stack[0];
	changes.push({ vert:old_current, property: "highlight", value: true });

    while (stack.length > 0) {
      let vert = stack.pop();
	  
	  changes.push({ vert:old_current, property: "highlight", value: false });

      if (vert === dest_node()) {
		  showPath(previous);
		  break;
		}
	changes.push({ vert, property: "highlight", value: true });
	old_current = vert;

      if (!visited.includes(vert)) {
        // grid[vert].visited[1](true);
        changes.push({ vert, property: "visited", value: true });

        visited.push(vert);
        for (let n of grid[vert].getNeighbours()) {
          if (!previous.has(n)) {
            previous.set(n, vert);
          }
          if (!visited.includes(n)) {
            stack.push(n);
          }
        }
      }
    }
    await animate(changes);

    setAnimating(false);
    return;
  }

  return (
    <div class="app">
      <header>
        <div className="controls-group">
          <button
            data-type="source"
            onClick={changeSelectionModeHandler}
            className={selectionMode() === "source" ? "selecting" : ""}
          >
            Source
          </button>
          <button
            data-type="dest"
            onClick={changeSelectionModeHandler}
            className={selectionMode() === "dest" ? "selecting" : ""}
          >
            Destination
          </button>
          <button
            data-type="wall"
            onClick={changeSelectionModeHandler}
            className={selectionMode() === "wall" ? "selecting" : ""}
          >
            Wall
          </button>

          <select
            name="algorithm-selector"
            id="algorithm-selector"
            onChange={(e) => setAlgo_dropdown_selected(e.target.value)}
          >
            <option value="breadth_first_search">Breadth First Search</option>
            <option value="depth_first_search">Depth First Search</option>
            <option value="dijikstra">Dijikstra</option>
          </select>
		  <button onClick={handleRandomize}>randomize</button>

          <button onClick={handleStart}>start</button>
		  <button onClick={handleReset}>reset</button>

        </div>
      </header>

      <div class="graph-grid" style={{ "--rows": graph_rows() }}>
        <For each={grid}>{(cell, idx) => <CellElement cell={cell} />}</For>
      </div>
    </div>
  );
}

export default App;
