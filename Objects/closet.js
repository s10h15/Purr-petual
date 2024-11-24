import { closestSegmentPoint } from "/Helpers/collision.js";

export function getCloset(vertexes) {
	return {
		vertexes: vertexes,
		isPlayerClose: false,
		onEnterPlayerX: null,
		onEnterPlayerY: null,
		isPlayerInside: false,
		name: "closet",
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

		draw(ctx, offsetX, offsetY, zoomInRate) {
			ctx.beginPath();
			ctx.moveTo((this.vertexes[0][0] - offsetX) * zoomInRate, (this.vertexes[0][1] - offsetY) * zoomInRate);

			for (let i = 1; i < this.vertexes.length; ++i) {
				ctx.lineTo((this.vertexes[i][0] - offsetX) * zoomInRate, (this.vertexes[i][1] - offsetY) * zoomInRate);
			}
			ctx.closePath();
			ctx.fillStyle = this.isPlayerClose ? (this.isPlayerInside ? "gray" : "cyan") : "white";
			ctx.fill();
			if (this.isPlayerClose && !this.isPlayerInside) {
				ctx.strokeStyle = "yellow";
				ctx.lineWidth = 15 * zoomInRate;
				ctx.stroke();
			}
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

		getCenter() {
			let sumX = 0;
			let sumY = 0;
			for (let i = 0; i < this.vertexes.length; ++i) {
				sumX += this.vertexes[i][0];
				sumY += this.vertexes[i][1];
			}
			return [sumX / this.vertexes.length, sumY / this.vertexes.length];
		},

		interactPlayer(player) {
			if (player.isInteracting) {
				player.isInteracting = false;
				if (this.isPlayerInside) {
					this.isPlayerInside = false;
					player.isVisible = true;
					player.x = this.onEnterPlayerX;
					player.y = this.onEnterPlayerY;
				} else {
					this.isPlayerInside = true;
					player.isVisible = false;
					this.onEnterPlayerX = player.x;
					this.onEnterPlayerY = player.y;
				}
			}
			if (this.isPlayerInside) {
				[player.x, player.y] = this.getCenter();
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

				if (distance < player.radius + 50) {
					this.isPlayerClose = true;
					this.interactPlayer(player);
					break;
				}
			}
		}

	};
}