"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const single_1 = require("../single");
/**
 * Format matrix points to simple structure points
 * @param {string} params interpolation params
 * @param {string} points interpolation matrix
 * @return {array} formatted points
 */
exports.format = (params, points) => {
    if ('x' in params) {
        return [params.x, points.map((i) => [i.x, i.y, i.z])];
    }
    if ('y' in params) {
        return [params.y, points.map((i) => [i.y, i.x, i.z])];
    }
    throw new Error("Can't calculate double interpolation");
};
/**
 * Double interpolation store
 * @param {string} points interpolation matrix data
 * @return {void} interpolation execut method
 */
function double(points) {
    if (points.length <= 3) {
        throw new Error("Can't calculate double interpolation, please provide more points");
    }
    return (params) => {
        if ('x' in params && 'y' in params) {
            const sortX1 = (a, b) => b.x - a.x;
            const findX1 = (i) => i.x <= params.x;
            const x1 = points.sort(sortX1).find(findX1);
            const sortX2 = (a, b) => a.x - b.x;
            const findX2 = (i) => i.x >= params.x;
            const x2 = points.sort(sortX2).find(findX2);
            if (!x1 || !x2) {
                throw new Error(`Can't calculate double interpolation for x: '${params.x}'`);
            }
            const sortY1 = (a, b) => b.y - a.y;
            const findY1 = (i) => i.y <= params.y;
            const y1 = points.sort(sortY1).find(findY1);
            const sortY2 = (a, b) => a.y - b.y;
            const findY2 = (i) => i.y >= params.y;
            const y2 = points.sort(sortY2).find(findY2);
            if (!y1 || !y2) {
                throw new Error(`Can't calculate double interpolation for y: '${params.y}'`);
            }
            if (x1.x === x2.x) {
                const filter = (i) => i.x === x1.x;
                const map = (i) => ({ x: i.y, y: i.z });
                return single_1.single(points.filter(filter).map(map))({ x: params.y });
            }
            if (y1.y === y2.y) {
                const filter = (i) => i.y === y1.y;
                const map = (i) => ({ x: i.x, y: i.z });
                return single_1.single(points.filter(filter).map(map))({ x: params.x });
            }
            const z11 = points.find((i) => i.x === x1.x && i.y === y1.y);
            const z12 = points.find((i) => i.x === x2.x && i.y === y1.y);
            const z21 = points.find((i) => i.x === x1.x && i.y === y2.y);
            const z22 = points.find((i) => i.x === x2.x && i.y === y2.y);
            if (!z11 || !z12 || !z21 || !z22) {
                throw new Error(`Can't calculate double interpolation for x: '${params.x}' and y: '${params.y}'`);
            }
            const p1 = (((x2.x - params.x) * (y2.y - params.y)) / ((x2.x - x1.x) * (y2.y - y1.y))) * z11.z;
            const p2 = (((params.x - x1.x) * (y2.y - params.y)) / ((x2.x - x1.x) * (y2.y - y1.y))) * z12.z;
            const p3 = (((x2.x - params.x) * (params.y - y1.y)) / ((x2.x - x1.x) * (y2.y - y1.y))) * z21.z;
            const p4 = (((params.x - x1.x) * (params.y - y1.y)) / ((x2.x - x1.x) * (y2.y - y1.y))) * z22.z;
            return p1 + p2 + p3 + p4;
        }
        if ('z' in params) {
            const [c, p] = exports.format(params, points);
            const sortMin = (a, b) => b[0] - a[0];
            const findMin = (i) => i[0] <= c;
            const min = p.sort(sortMin).find(findMin);
            const sortMax = (a, b) => a[0] - b[0];
            const findMax = (i) => i[0] >= c;
            const max = p.sort(sortMax).find(findMax);
            if (!min || !max) {
                throw new Error("Can't calculate double interpolation");
            }
            const p1 = p.filter((i) => i[0] === min[0]);
            const p2 = p.filter((i) => i[0] === max[0]);
            const map = (curr, i) => ({
                x: (((c - curr[0]) * (p1[i][2] - curr[2])) / (p1[i][0] - curr[0]) || 0) + curr[2],
                y: curr[1],
            });
            return single_1.single(p2.map(map))({ x: params.z });
        }
        throw new Error("Can't calculate double interpolation");
    };
}
exports.double = double;
//# sourceMappingURL=double.js.map