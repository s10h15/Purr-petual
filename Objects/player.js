import { getRandomInt, getRandomFloat, setStringSeed } from "./Helpers/random.js";

const twoPI = Math.PI * 2;
const PI180 = Math.PI / 180;

const keyToDirection = {
	"w": [0, -1],
	"a": [-1, 0],
	"s": [0, 1],
	"d": [1, 0]
};

export function getPlayer() {
	return {
		x: 0,
		y: 0,
		speed: 3,
		radius: 50,
		isDead: false,
		isWon: false,
		isVisible: true,
		isInteracting: false,
		heldItem: null,
		itemBubbleSeed: 0,
		lastItemBubbleUpdateTime: null,
		lastTimeStartedInteracting: null,

		draw(ctx, offsetX, offsetY, zoomInRate) {
			if (!this.isVisible) {
				return;
			}
			const radius = this.radius * zoomInRate;
			const lineWidth = radius * 0.5;
			const adjustedRadius = radius - lineWidth * 0.5;

			const x = (this.x - offsetX) * zoomInRate;
			const y = (this.y - offsetY) * zoomInRate;

			ctx.beginPath();
			ctx.arc(x, y, adjustedRadius, 0, twoPI);
			ctx.strokeStyle = "white";
			ctx.lineWidth = lineWidth;
			ctx.stroke();

			if (this.heldItem != null) {
				setStringSeed(this.itemBubbleSeed.toString());

				const circleCount = 3;
				const startCircleRadius = 4 * zoomInRate;
				const circleSpacing = 5 * zoomInRate;
				let circleX = x + radius - 5 * zoomInRate;
				let circleY = y - radius;
				for (let i = 0; i < circleCount; ++i) {
					ctx.beginPath();
					const currentRadius = startCircleRadius + (i * 2 * zoomInRate);
					ctx.arc(circleX, circleY, currentRadius, 0, twoPI);
					ctx.fillStyle = "rgb(100,100,100)";
					ctx.fill();

					circleX += circleSpacing + currentRadius;
					circleY -= circleSpacing;
				}

				const bubbleWidth = 85 * zoomInRate;
				const bubbleHeight = 70 * zoomInRate;
				const bubbleCenterX = x + radius + bubbleWidth * 0.5;
				const bubbleCenterY = y - radius - bubbleHeight * 0.5;
				const bubblesCount = 105;
				const circleSize = 12 * zoomInRate;

				for (let i = 0; i < bubblesCount; ++i) {
					const angle = getRandomInt(0, 360) * PI180;
					const radiusVariation = getRandomFloat(0.2, 1);

					const circleX = bubbleCenterX + (bubbleWidth * 0.5 * Math.cos(angle) * radiusVariation);
					const circleY = bubbleCenterY + (bubbleHeight * 0.5 * Math.sin(angle) * radiusVariation);

					ctx.beginPath();
					ctx.arc(circleX, circleY, circleSize, 0, twoPI);
					ctx.fillStyle = "rgba(100,100,100," + getRandomFloat(0.2, 0.5) + ")";
					ctx.fill();
				}

				this.heldItem.drawCenteredMiniature(
					ctx,
					bubbleCenterX - bubbleWidth * 0.25,
					bubbleCenterY - bubbleHeight * 0.25,
					bubbleWidth * 0.5,
					bubbleHeight * 0.5,
					zoomInRate
				);
			}
		},

		controlMovementDirection(directionX, directionY) {
			this.x += directionX * this.speed;
			this.y += directionY * this.speed;
		},
		controlMovementKeys(heldKeys) {
			let directionSumX = 0;
			let directionSumY = 0;
			for (const key in heldKeys) {
				const keyDirection = keyToDirection[key];
				if (keyDirection) {
					directionSumX += keyDirection[0];
					directionSumY += keyDirection[1];
				}
			}

			if (directionSumX !== 0 && directionSumY != 0) {
				const magnitude = Math.sqrt(directionSumX * directionSumX + directionSumY * directionSumY);
				directionSumX = directionSumX / magnitude;
				directionSumY = directionSumY / magnitude;
			}

			this.controlMovementDirection(directionSumX, directionSumY);
		},

		restart() {
			this.isDead = false;
			this.isWon = false;
			this.isVisible = true;
			this.heldItem = null;
			this.lastItemBubbleUpdateTime = null;
			this.itemBubbleSeed = 0;
		},

		giveItem(item) {
			if (this.heldItem == null) {
				this.heldItem = item;
			}
		},

		makeInteract() {
			if (!this.isDead) {
				this.isInteracting = true;
				this.lastTimeStartedInteracting = performance.now();
			}
		},

		update() {
			if (this.lastItemBubbleUpdateTime == null) {
				this.lastItemBubbleUpdateTime = performance.now();
			} else if (performance.now() - this.lastItemBubbleUpdateTime > 1000) {
				this.lastItemBubbleUpdateTime = performance.now();
				++this.itemBubbleSeed;
			}

			if (this.isInteracting && performance.now() - this.lastTimeStartedInteracting > 500) {
				this.isInteracting = false;
			}
		}
	}
}