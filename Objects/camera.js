export function getCamera(scaleRate) {
	return {
		x: 0,
		y: 0,
		zoomInRate: 1 * scaleRate,
		zoomOutRate: 1 - 0.25,
		zoomInSpeed: 0.25,
		minZoomInRate: 0
	};
}