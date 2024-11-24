import { closestSegmentPoint, isRayIntersectsLine } from "/Helpers/collision.js";
import { getDistance } from "/math.js";

const twoPI = Math.PI * 2;

export function getWall(vertexes) {
	return {
		vertexes: vertexes,
		name: "wall",
		isShouldDissapear: false,
		id: Math.random() * Number.MAX_SAFE_INTEGER,
		gridIndexes: [],

		isPointInside(x, y) {
			let inside = false;
			for (let i = 0, j = this.vertexes.length - 1; i < this.vertexes.length; j = i++) {
				const xi = this.vertexes[i][0],
					yi = this.vertexes[i][1];
				const xj = this.vertexes[j][0],
					yj = this.vertexes[j][1];

				const intersect = ((yi > y) != (yj > y)) &&
					(x < (xj - xi) * (y - yi) / (yj - yi) + xi);
				if (intersect) inside = !inside;
			}
			return inside;
		},
		isCollidesCircle(x, y, radius) {
			for (let i = 0; i < this.vertexes.length; ++i) {
				const start = this.vertexes[i];
				const end = this.vertexes[(i + 1) % this.vertexes.length];

				const point = closestSegmentPoint(x, y, start, end);

				const dx = x - point[0];
				const dy = y - point[1];
				const distance = Math.sqrt(dx * dx + dy * dy);

				if (distance < radius) {
					return true;
				}
			}
			return false;
		},
		getRayIntersection(x, y, directionX, directionY, maxLength) {
			let closestResult = null;
			let smallestDistance = Infinity;
			for (let i = 0; i < this.vertexes.length; ++i) {
				const start = this.vertexes[i];
				const end = this.vertexes[(i + 1) % this.vertexes.length];
				const result = isRayIntersectsLine(
					x, y,
					directionX, directionY,
					start[0], start[1],
					end[0], end[1],
					maxLength
				);
				if (result.isIntersecting) {
					const distance = getDistance(x, y, result.x, result.y);
					if (distance < smallestDistance) {
						smallestDistance = distance;
						closestResult = result;
					}
				}
			}
			return closestResult;
		},

		getVertexes() {
			return this.vertexes;
		},

		draw(ctx, offsetX, offsetY, zoomInRate) {
			ctx.beginPath();
			ctx.moveTo((this.vertexes[0][0] - offsetX) * zoomInRate, (this.vertexes[0][1] - offsetY) * zoomInRate);

			for (let i = 1; i < this.vertexes.length; ++i) {
				ctx.lineTo((this.vertexes[i][0] - offsetX) * zoomInRate, (this.vertexes[i][1] - offsetY) * zoomInRate);
			}
			ctx.closePath();
			ctx.fillStyle = "gray";
			ctx.fill();
		},

		resolveCollisionCircle(x, y, radius) {
			let closestPoint = null;
			let minDistance = Number.MAX_SAFE_INTEGER;
			let closestEdgeStart = null;
			let closestEdgeEnd = null;

			for (let i = 0; i < this.vertexes.length; ++i) {
				const start = this.vertexes[i];
				const end = this.vertexes[(i + 1) % this.vertexes.length];

				const point = closestSegmentPoint(x, y, start, end);

				const dx = x - point[0];
				const dy = y - point[1];
				const distance = Math.sqrt(dx * dx + dy * dy);

				if (distance < minDistance) {
					minDistance = distance;
					closestPoint = point;
				}
			}

			if (minDistance < radius) {
				const dx = x - closestPoint[0];
				const dy = y - closestPoint[1];
				const distance = Math.sqrt(dx * dx + dy * dy);
				if (distance == 0) {
					return null;
				}
				const pushX = (dx / distance) * (radius - minDistance);
				const pushY = (dy / distance) * (radius - minDistance);

				return [x + pushX, y + pushY];
			}
			return null;
		},

		update() {}
	};
}

export function getBarrier(vertexes) {
	return {
		vertexes: vertexes,
		name: "barrier",
		isShouldDissapear: false,
		id: Math.random() * Number.MAX_SAFE_INTEGER,
		gridIndexes: [],

		isPointInside(x, y) {
			return false;
		},
		isCollidesCircle(x, y, radius) {
			for (let i = 0; i < this.vertexes.length - 1; ++i) {
				const start = this.vertexes[i];
				const end = this.vertexes[i + 1];

				const point = closestSegmentPoint(x, y, start, end);

				const dx = x - point[0];
				const dy = y - point[1];
				const distance = Math.sqrt(dx * dx + dy * dy);

				if (distance < radius) {
					return true;
				}
			}
			return false;
		},
		getRayIntersection(x, y, directionX, directionY, maxLength) {
			let closestResult = null;
			let smallestDistance = Infinity;
			const endIndex = this.vertexes.length - 1;
			for (let i = 0; i < endIndex; ++i) {
				const start = this.vertexes[i];
				const end = this.vertexes[i + 1];
				const result = isRayIntersectsLine(
					x, y,
					directionX, directionY,
					start[0], start[1],
					end[0], end[1],
					maxLength
				);
				if (result.isIntersecting) {
					const distance = getDistance(x, y, result.x, result.y);
					if (distance < smallestDistance) {
						smallestDistance = distance;
						closestResult = result;
					}
				}
			}
			return closestResult;
		},

		getVertexes() {
			return this.vertexes;
		},

		draw(ctx, offsetX, offsetY, zoomInRate) {
			ctx.beginPath();
			ctx.moveTo((this.vertexes[0][0] - offsetX) * zoomInRate, (this.vertexes[0][1] - offsetY) * zoomInRate);
			for (let vertexIndex = 1; vertexIndex < this.vertexes.length; ++vertexIndex) {
				const xWRTCamera = (this.vertexes[vertexIndex][0] - offsetX) * zoomInRate;
				const yWRTCamera = (this.vertexes[vertexIndex][1] - offsetY) * zoomInRate;
				ctx.lineTo(xWRTCamera, yWRTCamera);
			}
			ctx.strokeStyle = "yellow";
			ctx.lineWidth = 15 * zoomInRate;
			ctx.stroke();

			for (let vertexIndex = 0; vertexIndex < this.vertexes.length; ++vertexIndex) {
				const xWRTCamera = (this.vertexes[vertexIndex][0] - offsetX) * zoomInRate;
				const yWRTCamera = (this.vertexes[vertexIndex][1] - offsetY) * zoomInRate;
				ctx.beginPath();
				ctx.arc(xWRTCamera, yWRTCamera, 10 * zoomInRate, 0, twoPI);
				ctx.strokeStyle = "rgb(200,200,0)";
				ctx.stroke();
			}
		},

		resolveCollisionCircle(x, y, radius) {
			let closestPoint = null;
			let minDistance = Number.MAX_SAFE_INTEGER;
			let closestEdgeStart = null;
			let closestEdgeEnd = null;

			for (let i = 0; i < this.vertexes.length - 1; ++i) {
				const start = this.vertexes[i];
				const end = this.vertexes[i + 1];

				const point = closestSegmentPoint(x, y, start, end);

				const dx = x - point[0];
				const dy = y - point[1];
				const distance = Math.sqrt(dx * dx + dy * dy);

				if (distance < minDistance) {
					minDistance = distance;
					closestPoint = point;
				}
			}

			if (minDistance < radius) {
				const dx = x - closestPoint[0];
				const dy = y - closestPoint[1];
				const distance = Math.sqrt(dx * dx + dy * dy);
				if (distance == 0) {
					return null;
				}
				const pushX = (dx / distance) * (radius - minDistance);
				const pushY = (dy / distance) * (radius - minDistance);

				return [x + pushX, y + pushY];
			}
			return null;
		},

		update() {}
	};
}