type Point = [number, number];

const cross = (a: Point, b: Point, o: Point) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);

export const polygonHull = (points: Point[]) => {
  if (points.length <= 3) {
    return points;
  }

  const pointsCopy = points.slice().sort((a, b) => a[0] === b[0] ? a[1] - b[1] : a[0] - b[0]);

  let lower: Point[] = [];
  for (let i0 = 0; i0 < pointsCopy.length; i0++) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], pointsCopy[i0]) <= 0) {
       lower.pop();
    }
    lower.push(pointsCopy[i0]);
  }

  let upper: Point[] = [];
  for (let i1 = pointsCopy.length - 1; i1 >= 0; i1--) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], pointsCopy[i1]) <= 0) {
       upper.pop();
    }
    upper.push(pointsCopy[i1]);
  }

  upper.pop();
  lower.pop();

  return lower.concat(upper);
};

export const polygonCentroid = (points: Point[]) => {
  if (points.length <= 3) {
    return polygonMean(points);
  }
  const hull = polygonHull(points);
  const n = hull.length;
  let A = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < n; i += 1) {
    const [xi0, yi0] = hull[i];
    const [xi1, yi1] = hull[(i + 1) % n];
    const a = (xi0 * yi1 - xi1 * yi0);
    A += a;
    cx += (a * (xi0 + xi1));
    cy += (a * (yi0 + yi1));
  }
  let d = 3 * A;
  return [cx / d, cy / d];
};

export const polygonMean = (points: Point[]) => {
  let x = 0;
  let y = 0;
  for (let i = 0; i < points.length; i += 1) {
    x += points[i][0];
    y += points[i][1];
  }
  return [x / points.length, y / points.length];
};
