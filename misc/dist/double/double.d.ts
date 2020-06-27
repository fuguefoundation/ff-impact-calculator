import { Point, X, Y, Z } from './double.definition';
/**
 * Format matrix points to simple structure points
 * @param {string} params interpolation params
 * @param {string} points interpolation matrix
 * @return {array} formatted points
 */
export declare const format: (params: X | Y | Z, points: Point[]) => [number, number[][]];
/**
 * Double interpolation store
 * @param {string} points interpolation matrix data
 * @return {void} interpolation execut method
 */
export declare function double(points: Point[]): (params: X | Y | Z) => number;
