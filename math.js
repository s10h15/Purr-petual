const PI180 = Math.PI / 180;

export function getRays(numRays) {
	let rayDirections = [];
	for (let i = 0; i < numRays; ++i) {
		let angle = (i / numRays) * twoPI;
		let x = Math.cos(angle);
		let y = Math.sin(angle);
		rayDirections.push({ x, y });
	}
	return rayDirections;
}

function getMaxLengthPoint(x, y, dx, dy, maxLength) {
	let scale = maxLength / Math.sqrt(dx * dx + dy * dy);
	return {
		x: x + dx * scale,
		y: y + dy * scale,
		length: maxLength
	};
}

export function getRayHit(x, y, dx, dy, minX, minY, maxX, maxY, maxLength) {
	let tNearX = (minX - x) / dx;
	let tFarX = (maxX - x) / dx;
	let tNearY = (minY - y) / dy;
	let tFarY = (maxY - y) / dy;

	if (tNearX > tFarX)[tNearX, tFarX] = [tFarX, tNearX];
	if (tNearY > tFarY)[tNearY, tFarY] = [tFarY, tNearY];

	let tNear = Math.max(tNearX, tNearY);
	let tFar = Math.min(tFarX, tFarY);

	if (tNear > tFar || tFar < 0) {
		return getMaxLengthPoint(x, y, dx, dy, maxLength);
	}

	let hitX = x + tNear * dx;
	let hitY = y + tNear * dy;
	let length = Math.sqrt((hitX - x) ** 2 + (hitY - y) ** 2);

	if (length > maxLength) {
		return getMaxLengthPoint(x, y, dx, dy, maxLength);
	}

	return {
		x: hitX,
		y: hitY,
		length
	};
}

export function getDistance(x1, y1, x2, y2) {
	const distanceX = x2 - x1;
	const distanceY = y2 - y1;
	return Math.sqrt(distanceX * distanceX + distanceY * distanceY);
}

export function getRotatedDirection(x, y, degrees) {
	const radians = degrees * PI180;
	const rotatedX = x * Math.cos(radians) - y * Math.sin(radians);
	const rotatedY = x * Math.sin(radians) + y * Math.cos(radians);
	return [rotatedX, rotatedY];
}

export function getPath(grid, startX, startY, goalX, goalY) {
	const rows = grid.length,
		cols = grid[0].length;
	if (startX < 0 || startX >= cols || startY < 0 || startY >= rows ||
		grid[startY][startX] || grid[goalY][goalX]) return null; // Changed conditions here

	const h = (x, y) => Math.abs(x - goalX) + Math.abs(y - goalY);
	const openSet = new Map();
	const closedSet = new Set();
	const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];

	openSet.set(`${startX},${startY}`, { x: startX, y: startY, g: 0, h: h(startX, startY), f: h(startX, startY) });

	while (openSet.size) {
		let current = Array.from(openSet.entries()).reduce((a, b) => a[1].f <= b[1].f ? a : b)[1];
		let currentKey = `${current.x},${current.y}`;

		if (current.x == goalX && current.y == goalY) {
			const path = [];
			while (current) {
				path.unshift([current.x, current.y]);
				current = current.parent;
			}
			return path;
		}

		openSet.delete(currentKey);
		closedSet.add(currentKey);

		for (const [dx, dy] of dirs) {
			const newX = current.x + dx,
				newY = current.y + dy;
			const newKey = `${newX},${newY}`;

			if (newX < 0 || newX >= cols || newY < 0 || newY >= rows ||
				grid[newY][newX] || closedSet.has(newKey)) continue; // Changed condition here

			const gScore = current.g + 1;
			const existing = openSet.get(newKey);

			if (!existing) {
				openSet.set(newKey, {
					x: newX,
					y: newY,
					g: gScore,
					h: h(newX, newY),
					f: gScore + h(newX, newY),
					parent: current
				});
			} else if (gScore < existing.g) {
				existing.g = gScore;
				existing.f = gScore + existing.h;
				existing.parent = current;
			}
		}
	}
	return null;
}