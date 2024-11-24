import { getRandomInt, isChance } from '/Purr-petual/Helpers/random.js';
import { getDistance } from '/Purr-petual/math.js';

const twoPI = Math.PI * 2;

let foodCount = 0;
export function getFood(x, y) {
	++foodCount;
	return {
		x: x,
		y: y,
		radius: getRandomInt(10, 20),
		isInflatedAnimation: isChance(0.5),
		lastRadiusUpdateTime: null,
		name: "food",
		gridIndexes: [],

		id: foodCount,
		isShouldDissapear: false,
		isMovedLastStep: false,

		isPointInside(x, y) {
			return false;
		},
		isCollidesCircle(x, y, radius) {
			return getDistance(this.x, this.y, x, y) < radius + this.radius;
		},
		getRayIntersection(x, y, directionX, directionY, maxLength) {
			return null;
		},

		getVertexes() {
			return [[this.x, this.y]];
		},

		draw(ctx, offsetX, offsetY, zoomInRate) {
			const x = (this.x - offsetX) * zoomInRate;
			const y = (this.y - offsetY) * zoomInRate;

			ctx.beginPath();
			let radius = this.radius;
			if (this.isInflatedAnimation) {
				radius += 5;
			}
			ctx.arc(x, y, radius * zoomInRate, 0, twoPI);
			ctx.fillStyle = this.isInflatedAnimation ? "cyan" : "yellow";
			ctx.fill();
		},
		drawCenteredMiniature(ctx, boxX, boxY, boxWidth, boxHeight, zoomInRate) {
			ctx.beginPath();
			ctx.arc(boxX + boxWidth * 0.5, boxY + boxHeight * 0.5, this.radius * zoomInRate, 0, twoPI);
			ctx.fillStyle = "cyan";
			ctx.fill();
		},

		resolveCollisionCircle() {
			return null;
		},

		update(player) {
			let dirX = player.x - this.x;
			let dirY = player.y - this.y;
			const magnitude = Math.sqrt(dirX * dirX + dirY * dirY);
			if (player.heldItem == null && magnitude < player.radius + this.radius) {
				this.isShouldDissapear = true;
				player.giveItem(this);
			}

			if (this.lastRadiusUpdateTime == null) {
				this.lastRadiusUpdateTime = performance.now();
			} else if (performance.now() - this.lastRadiusUpdateTime > 100) {
				this.lastRadiusUpdateTime = performance.now();
				this.isInflatedAnimation = !this.isInflatedAnimation;
			}
		}
	};
}