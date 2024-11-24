import { closestSegmentPoint } from "./Helpers/collision.js";
import { getRandomInt, setStringSeed } from "./Helpers/random.js";

function isColliding(rect1, rect2) {
	return !(rect1.x + rect1.width <= rect2.x ||
		rect1.x >= rect2.x + rect2.width ||
		rect1.y + rect1.height <= rect2.y ||
		rect1.y >= rect2.y + rect2.height);
}

function hasAnyCollision(rectangle, rectangles) {
	return rectangles.some(rect => isColliding(rectangle, rect));
}

function resolveRectangleOutRectangles(rectangle, rectangles) {
	if (!hasAnyCollision(rectangle, rectangles)) {
		return [rectangle.x, rectangle.y];
	}

	let step = 1;
	let x = rectangle.x;
	let y = rectangle.y;
	const maxAttempts = 100;
	let attempts = 0;

	while (attempts < maxAttempts) {
		for (let i = 0; i < step; ++i) {
			x += 1;
			if (!hasAnyCollision({ ...rectangle, x, y }, rectangles)) {
				return [x, y];
			}
		}
		for (let i = 0; i < step; i++) {
			y += 1;
			if (!hasAnyCollision({ ...rectangle, x, y }, rectangles)) {
				return [x, y];
			}
		}
		step++;
		for (let i = 0; i < step; i++) {
			x -= 1;
			if (!hasAnyCollision({ ...rectangle, x, y }, rectangles)) {
				return [x, y];
			}
		}
		for (let i = 0; i < step; i++) {
			y -= 1;
			if (!hasAnyCollision({ ...rectangle, x, y }, rectangles)) {
				return [x, y];
			}
		}
		step++;
		attempts++;
	}

	return [rectangle.x, rectangle.y];
}

export function getFoodBox(vertexes) {
	const box = {
		vertexes: vertexes,
		isPlayerClose: false,
		objectsInside: [],
		centerX: null,
		centerY: null,
		objectsInsidePositioningSeed: Math.floor(Math.random() * 10),
		boundingBoxX: null,
		boundingBoxY: null,
		boundingBoxEndX: null,
		boundingBoxEndY: null,
		name: "foodBox",
		gridIndexes: [],

		isShouldDissapear: false,
		id: Math.random() * Number.MAX_SAFE_INTEGER,
		
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
			return null;
		},

		getVertexes() {
			return this.vertexes;
		},

		updateBoundingBox() {
			this.boundingBoxX = Number.MAX_SAFE_INTEGER;
			this.boundingBoxY = Number.MAX_SAFE_INTEGER;
			this.boundingBoxEndX = -Number.MAX_SAFE_INTEGER;
			this.boundingBoxEndY = -Number.MAX_SAFE_INTEGER;
			for (let i = 0; i < this.vertexes.length; ++i) {
				const vertex = this.vertexes[i];
				if (vertex[0] < this.boundingBoxX) {
					this.boundingBoxX = vertex[0];
				}
				if (vertex[1] < this.boundingBoxY) {
					this.boundingBoxY = vertex[1];
				}
				if (vertex[0] > this.boundingBoxEndX) {
					this.boundingBoxEndX = vertex[0];
				}
				if (vertex[1] > this.boundingBoxEndY) {
					this.boundingBoxEndY = vertex[1];
				}
			}
		},
		getCenter() {
			let sumX = 0;
			let sumY = 0;
			for (let i = 0; i < this.vertexes.length; ++i) {
				sumX += this.vertexes[i][0];
				sumY += this.vertexes[i][1];
			}
			return [sumX / this.vertexes.length, sumY / this.vertexes.length];
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

		drawObjectsInside(ctx, offsetX, offsetY, zoomInRate) {
			setStringSeed(this.objectsInsidePositioningSeed.toString());

			let miniaturesInside = [];
			for (let objectIndex = 0; objectIndex < this.objectsInside.length; ++objectIndex) {
				const object = this.objectsInside[objectIndex];

				let miniatureRadius = 35;
				let miniatureWidth = miniatureRadius;
				let miniatureHeight = miniatureRadius;
				let miniatureX = getRandomInt(this.boundingBoxX, this.boundingBoxEndX) - miniatureWidth * 0.5;
				let miniatureY = getRandomInt(this.boundingBoxY, this.boundingBoxEndY) - miniatureHeight * 0.5;
				miniaturesInside.push({
					width: miniatureWidth,
					height: miniatureHeight,
					x: miniatureX,
					y: miniatureY
				});

				miniatureWidth *= zoomInRate;
				miniatureHeight *= zoomInRate;
				miniatureX = (miniatureX - offsetX) * zoomInRate;
				miniatureY = (miniatureY - offsetY) * zoomInRate;

				object.drawCenteredMiniature(ctx, miniatureX, miniatureY, miniatureWidth, miniatureHeight, zoomInRate);
			}
		},
		draw(ctx, offsetX, offsetY, zoomInRate) {
			ctx.beginPath();
			ctx.moveTo((this.vertexes[0][0] - offsetX) * zoomInRate, (this.vertexes[0][1] - offsetY) * zoomInRate);

			for (let i = 1; i < this.vertexes.length; ++i) {
				ctx.lineTo((this.vertexes[i][0] - offsetX) * zoomInRate, (this.vertexes[i][1] - offsetY) * zoomInRate);
			}
			ctx.closePath();
			ctx.fillStyle = this.isPlayerClose ? "black" : "purple";
			ctx.fill();
			if (this.isPlayerClose) {
				ctx.strokeStyle = "pink";
				ctx.lineWidth = 15 * zoomInRate;
				ctx.stroke();
			}

			this.drawObjectsInside(ctx, offsetX, offsetY, zoomInRate);
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

		interactPlayer(player) {
			if (player.isInteracting) {
				player.isInteracting = false;
				if (player.heldItem != null) {
					this.objectsInside.push(player.heldItem);
					player.heldItem = null;
				}
			}
		},
		update(player) {
			this.isPlayerClose = false;

			for (let i = 0; i < this.vertexes.length; ++i) {
				const start = this.vertexes[i];
				const end = this.vertexes[(i + 1) % this.vertexes.length];

				const closestPoint = closestSegmentPoint(player.x, player.y, start, end);

				const dx = player.x - closestPoint[0];
				const dy = player.y - closestPoint[1];
				const distance = Math.sqrt(dx * dx + dy * dy);

				if (distance < player.radius + 5) {
					this.isPlayerClose = true;
					this.interactPlayer(player);
					break;
				}
			}
		}
	};

	[box.centerX, box.centerY] = box.getCenter();
	box.updateBoundingBox();

	return box;
}