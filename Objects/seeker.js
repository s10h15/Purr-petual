import { isChance, getRandomInt, setSeed } from '/Purr-petual/Helpers/random.js';
import { getDistance } from '/Purr-petual/math.js';
import { isRayIntersectsCircle, isRayIntersectsLine } from '/Purr-petual/Helpers/collision.js';

const twoPI = Math.PI * 2;
const PI180 = Math.PI / 180;

export function getSeeker(x, y) {
	return {
		x: x,
		y: y,
		radius: 50,
		maxSpeed: 4,
		lookDirectionX: 1,
		lookDirectionY: 0,
		maxLookLength: 1000,
		lookLength: 0,
		lookRotationIsLeft: null,
		maxRotationSpeed: 2,
		isShouldDissapear: false,
		name: "seeker",
		gridIndexes: [],

		closestWorldObjects: null,
		lastWorldGridIndexX: null,
		lastWorldGridIndexY: null,

		unexploredGridIndexes: null,
		explorationGridNumCells: 50,
		explorationGridCellsSizeX: null,
		explorationGridCellsSizeY: null,
		lastExplorationGoalChangeTime: null,

		lastSeenPlayerX: null,
		lastSeenPlayerY: null,
		lastSeenPlayerTime: null,
		isSawPlayer: false,

		isSearchingCell: false,
		cellToFollow: null,

		prevX: 0,
		prevY: 0,
		prevPlayerX: 0,
		prevPlayerY: 0,

		isEvenUpdateCall: false,

		isMovedLastStep: false,
		id: Math.random() * Number.MAX_SAFE_INTEGER,

		isPointInside(x, y) {
			return getDistance(this.x, this.y, x, y) < this.radius;
		},
		isCollidesCircle(x, y, radius) {
			return getDistance(this.x, this.y, x, y) < this.radius + radius;
		},
		getRayIntersection(x, y, directionX, directionY, maxLength) {
			return null;
		},

		draw(ctx, offsetX, offsetY, zoomInRate) {
			const x = (this.x - offsetX) * zoomInRate;
			const y = (this.y - offsetY) * zoomInRate;

			const radius = this.radius * zoomInRate;
			const lineWidth = radius * 0.5;
			const adjustedRadius = radius - lineWidth * 0.5;
			ctx.beginPath();
			ctx.arc(x, y, adjustedRadius, 0, twoPI);
			ctx.fillStyle = "red";
			ctx.fill();
			ctx.strokeStyle = "purple";
			ctx.lineWidth = lineWidth;
			ctx.stroke();

			const lookRayLength = this.lookLength * zoomInRate;
			ctx.beginPath();
			ctx.moveTo(x, y);
			ctx.lineTo(x + this.lookDirectionX * lookRayLength, y + this.lookDirectionY * lookRayLength);
			ctx.strokeStyle = "white";
			ctx.lineWidth = 10 * zoomInRate;
			ctx.stroke();
		},

		resolveCollisionCircle() {
			return null;
		},

		getVertexes() {
			return [[this.x, this.y]];
		},

		rotateDegrees(degrees) {
			const radians = degrees * PI180;
			const previousX = this.lookDirectionX;
			this.lookDirectionX = this.lookDirectionX * Math.cos(radians) - this.lookDirectionY * Math.sin(radians);
			this.lookDirectionY = previousX * Math.sin(radians) + this.lookDirectionY * Math.cos(radians);
		},
		walkTo(x, y) {
			let dirX = x - this.x;
			let dirY = y - this.y;
			const dirLength = Math.sqrt(dirX * dirX + dirY * dirY);
			dirX /= dirLength;
			dirY /= dirLength;
			this.x += dirX * this.maxSpeed;
			this.y += dirY * this.maxSpeed;
		},

		explore(world) {
			if (this.unexploredGridIndexes == null || this.unexploredGridIndexes.length == 0) {
				this.explorationGridCellsSizeX = (world.gridEndX - world.gridStartX) / this.explorationGridNumCells;
				this.explorationGridCellsSizeY = (world.gridEndY - world.gridStartY) / this.explorationGridNumCells;
				this.unexploredGridIndexes = [];
				for (let y = 0; y < this.explorationGridNumCells; ++y) {
					for (let x = 0; x < this.explorationGridNumCells; ++x) {
						this.unexploredGridIndexes.push([x, y]);
					}
				}
			} else if (!this.isSearchingCell && this.unexploredGridIndexes.length > 0) {
				const randomIndex = getRandomInt(0, this.unexploredGridIndexes.length - 1);
				this.cellToFollow = this.unexploredGridIndexes[randomIndex];
				this.unexploredGridIndexes.splice(randomIndex, 1);
				this.isSearchingCell = true;
				this.lastExplorationGoalChangeTime = performance.now();
			}

			if (this.isSearchingCell) {
				const goalX = this.cellToFollow[0] * this.explorationGridCellsSizeX + this.explorationGridCellsSizeX * 0.5 + world.gridStartX;
				const goalY = this.cellToFollow[1] * this.explorationGridCellsSizeY + this.explorationGridCellsSizeY * 0.5 + world.gridStartY;
				this.walkTo(goalX, goalY);

				if (getDistance(this.x, this.y, goalX, goalY) < 5 || getDistance(this.x, this.y, this.prevX, this.prevY) < 1) {
					this.isSearchingCell = false;
				}
			}
		},
		killPlayer(player) {
			if (player.isVisible) {
				const distanceX = player.x - this.x;
				const distanceY = player.y - this.y;
				if (Math.sqrt(distanceX * distanceX + distanceY * distanceY) - this.radius < player.radius) {
					player.isDead = true;
				}
			}
		},
		updateClosestObjects(world) {
			if (this.lastWorldGridIndexX == null) {
				[this.lastWorldGridIndexX, this.lastWorldGridIndexY] = world.getGridIndexFromPoint(this.x, this.y);
				this.closestWorldObjects = world.getClosestObjectsToPoint(this.x, this.y, this.maxLookLength);
			} else {
				const [currentGridIndexX, currentGridIndexY] = world.getGridIndexFromPoint(this.x, this.y);
				if (currentGridIndexX != this.lastWorldGridIndexX || currentGridIndexY != this.lastWorldGridIndexY) {
					this.closestWorldObjects = world.getClosestObjectsToPoint(this.x, this.y, this.maxLookLength);
					this.isMovedLastStep = true;
				}
			}
		},
		lookStraight(player, world) {
			let smallestLookRay = this.maxLookLength;
			if (this.closestWorldObjects != null) {
				for (let objectIndex = 0; objectIndex < this.closestWorldObjects.length; ++objectIndex) {
					const object = this.closestWorldObjects[objectIndex];
					const rayCastResult = object.getRayIntersection(
						this.x, this.y,
						this.lookDirectionX, this.lookDirectionY,
						this.maxLookLength
					);
					if (rayCastResult != null && rayCastResult.isIntersecting && rayCastResult.length < smallestLookRay) {
						smallestLookRay = rayCastResult.length;
					}
				}
			}

			if (player.isVisible) {
				const playerRayCast = isRayIntersectsCircle(this.x, this.y, this.lookDirectionX, this.lookDirectionY, player.x, player.y, player.radius, this.maxLookLength);
				if (playerRayCast.isIntersecting && playerRayCast.length < smallestLookRay) {
					smallestLookRay = playerRayCast.length;
					this.isSawPlayer = true;
					this.lastSeenPlayerX = player.x;
					this.lastSeenPlayerY = player.y;
					this.lastSeenPlayerTime = performance.now();
				} else {
					this.isSawPlayer = false;
				}
			} else {
				this.isSawPlayer = false;
			}

			this.lookLength = smallestLookRay;
		},
		shakeHead() {
			if (isChance(0.1)) {
				this.lookRotationIsLeft = isChance(0.5);
			}
			if (!this.isSawPlayer) {
				if (this.lookRotationIsLeft) {
					this.rotateDegrees(-this.maxRotationSpeed);
				} else {
					this.rotateDegrees(this.maxRotationSpeed);
				}
			}
		},
		followPlayer(player, world) {
			if (this.isSawPlayer) {
				const targetAngle = Math.atan2(player.y - this.y, player.x - this.x);
				const currentAngle = Math.atan2(this.lookDirectionY, this.lookDirectionX);
				let angleDiff = targetAngle - currentAngle;
				while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
				while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

				const rotationSpeedRadians = this.maxRotationSpeed * PI180;
				if (Math.abs(angleDiff) > rotationSpeedRadians) {
					if (angleDiff > 0) {
						this.rotateDegrees(this.maxRotationSpeed);
					} else {
						this.rotateDegrees(-this.maxRotationSpeed);
					}
				}

				const futurePlayerX = player.x - (this.prevPlayerX - player.x) * player.speed * 5;
				const futurePlayerY = player.y - (this.prevPlayerY - player.y) * player.speed * 5;
				this.walkTo(futurePlayerX, futurePlayerY);
			} else {
				if (this.lastSeenPlayerX == null) {
					this.explore(world);
				} else {
					this.walkTo(this.lastSeenPlayerX, this.lastSeenPlayerY);
					if (performance.now() - this.lastSeenPlayerTime > 2000 || getDistance(this.x, this.y, this.lastSeenPlayerX, this.lastSeenPlayerY) < 5) {
						this.lastSeenPlayerX = null;
						this.lastSeenPlayerY = null;
					}
				}
			}
		},
		updateMovement(player) {
			if (this.isEvenUpdateCall) {
				this.prevX = this.x;
				this.prevY = this.y;

				if (this.isSawPlayer) {
					this.prevPlayerX = player.x;
					this.prevPlayerY = player.y;
				}
			}
		},
		updateCounters() {
			this.isEvenUpdateCall = !this.isEvenUpdateCall;
		},
		resolveCollisions() {
			let currentX = this.x;
			let currentY = this.y;
			for (let i = 0; i < this.closestWorldObjects.length; ++i) {
				const object = this.closestWorldObjects[i];
				const collisionResult = object.resolveCollisionCircle(currentX, currentY, this.radius);
				if (collisionResult != null) {
					[currentX, currentY] = collisionResult;
				}
			}
			this.x = currentX;
			this.y = currentY;
		},
		update(player, world) {
			setSeed(performance.now());
			this.killPlayer(player);
			this.updateClosestObjects(world);
			this.lookStraight(player, world);
			this.shakeHead();
			this.followPlayer(player, world);
			this.updateMovement(player);
			this.updateCounters(player);
			this.resolveCollisions();
		}
	}
}