export const wait = (t) =>
  new Promise((res, rej) => {
    setTimeout(res, t);
  });

export function getIndexFactory(graph_rows, graph_cols) {
  return function(i, j) {
    if (i < 0 || i > graph_rows - 1) return -1;
    if (j < 0 || j > graph_cols - 1) return -1;
    return i * graph_rows + j;
  };
}
