import { Point, X, Y } from '../single/single.definition';
/**
 * Single interpolation store
 * @param {string} points interpolation matrix data
 * @return {void} interpolation execut method
 */
export declare function single(points: Point[]): (params: X | Y) => number;
