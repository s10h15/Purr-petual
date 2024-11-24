export function closestSegmentPoint(x, y, start, end) {
	const ax = end[0] - start[0];
	const ay = end[1] - start[1];
	const bx = x - start[0];
	const by = y - start[1];

	const proj = (ax * bx + ay * by) / (ax * ax + ay * ay);
	const t = Math.max(0, Math.min(1, proj));

	return [start[0] + t * ax, start[1] + t * ay];
}

export function isRayIntersectsCircle(
	rayStartX, rayStartY,
	rayDirectionX, rayDirectionY,
	circleCenterX, circleCenterY,
	circleRadius,
	maximumLength
) {
	const vectorToCircleX = circleCenterX - rayStartX;
	const vectorToCircleY = circleCenterY - rayStartY;

	const projection = vectorToCircleX * rayDirectionX + vectorToCircleY * rayDirectionY;

	const closestPointX = rayStartX + projection * rayDirectionX;
	const closestPointY = rayStartY + projection * rayDirectionY;

	const distanceSquared =
		(closestPointX - circleCenterX) * (closestPointX - circleCenterX) +
		(closestPointY - circleCenterY) * (closestPointY - circleCenterY);

	const radiusSquared = circleRadius * circleRadius;

	if (distanceSquared > radiusSquared) {
		return { isIntersecting: false, x: null, y: null, length: null };
	}

	const halfChord = Math.sqrt(radiusSquared - distanceSquared);
	const intersection1 = projection - halfChord;
	const intersection2 = projection + halfChord;

	if (intersection1 >= 0 && intersection1 <= maximumLength) {
		const x = rayStartX + rayDirectionX * intersection1;
		const y = rayStartY + rayDirectionY * intersection1;
		return { isIntersecting: true, x, y, length: intersection1 };
	}

	if (intersection2 >= 0 && intersection2 <= maximumLength) {
		const x = rayStartX + rayDirectionX * intersection2;
		const y = rayStartY + rayDirectionY * intersection2;
		return { isIntersecting: true, x, y, length: intersection2 };
	}

	return { isIntersecting: false, x: null, y: null, length: null };
}

export function isRayIntersectsLine(
	rayStartX, rayStartY,
	rayDirectionX, rayDirectionY,
	lineStartX, lineStartY,
	lineEndX, lineEndY,
	maximumLength
) {
	const lineVectorX = lineEndX - lineStartX;
	const lineVectorY = lineEndY - lineStartY;

	const cross = rayDirectionX * lineVectorY - rayDirectionY * lineVectorX;

	if (Math.abs(cross) < 1e-10) {
		return { isIntersecting: false, x: null, y: null, length: null };
	}

	const startDiffX = lineStartX - rayStartX;
	const startDiffY = lineStartY - rayStartY;

	const t = (startDiffX * lineVectorY - startDiffY * lineVectorX) / cross;

	const u = (startDiffX * rayDirectionY - startDiffY * rayDirectionX) / cross;

	if (t >= 0 && t <= maximumLength && u >= 0 && u <= 1) {
		const x = rayStartX + rayDirectionX * t;
		const y = rayStartY + rayDirectionY * t;
		return { isIntersecting: true, x, y, length: t };
	}

	return { isIntersecting: false, x: null, y: null, length: null };
}

export function isPointInPolygon(x, y, polygon) {
	let n = polygon.length;
	let xinters;
	let p1x, p1y, p2x, p2y;

	for (let i = 0, j = n - 1; i < n; j = i++) {
		p1x = polygon[i][0];
		p1y = polygon[i][1];
		p2x = polygon[j][0];
		p2y = polygon[j][1];

		if (y > Math.min(p1y, p2y)) {
			if (y <= Math.max(p1y, p2y)) {
				if (x <= Math.max(p1x, p2x)) {
					if (p1y !== p2y) {
						xinters = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x;
					}
					if (p1x === p2x || x <= xinters) {
						return true;
					}
				}
			}
		}
	}
	return false;
}