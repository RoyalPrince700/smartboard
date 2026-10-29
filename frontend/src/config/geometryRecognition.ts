/**
 * Shape, triangle, and diagram recognition is suspended.
 *
 * Handwritten strokes were being scored as geometry (lines, triangles, circles)
 * and routed away from equation solving. While this is false, the board only
 * reads and solves handwritten arithmetic and equations.
 *
 * The geometry engine under `engine/geometry` is unchanged. Set this to true
 * to restore shape capture, OpenCV, and diagram routing.
 */
export const GEOMETRY_RECOGNITION_ENABLED = false;
