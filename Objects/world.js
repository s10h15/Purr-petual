import { getRandomInt, getRandomFloat, setStringSeed, isChance } from '/Purr-petual/Helpers/random.js';
import { isRayIntersectsCircle, isRayIntersectsLine, isPointInPolygon, closestSegmentPoint } from '/Purr-petual/Helpers/collision.js';
import { getRotatedDirection, getDistance, getPath } from '/Purr-petual/math.js';

const twoPI = Math.PI * 2;
const PI180 = Math.PI / 180;

export class World {
	constructor() {
		this.objects = {
			walls: [],
			food: [],
			barriers: [],
			seekers: [],
			closets: [],
			foodBoxes: []
		};

		this.grid = [];
		this.gridCellsSizeX;
		this.gridCellsSizeY;
		this.gridNumCells;
		this.gridStartX;
		this.gridStartY;
		this.gridEndX;
		this.gridEndY;
		this.gridSizeX;
		this.gridSizeY;

		this.lastRetrievedGridIndexXDraw;
		this.lastRetrievedGridIndexYDraw;
		this.lastRetrievedGridIndexXUpdate;
		this.lastRetrievedGridIndexYUpdate;
		this.lastRetrievedGridObjectsDraw = [];
		this.lastRetrievedGridObjectsUpdate = [];

		this.didAnObjectSwitchCells = false;

		this.shadowNoiseNumCells = 16;
		this.shadowNoiseCellsSize;
		this.shadowNoiseSeed = 0;
		this.lastShadowNoiseSeedUpdateTime = performance.now();

		this.numFoodToCollect = 0;
	}

	setup(maxDimension) {
		this.shadowNoiseCellsSize = maxDimension / this.shadowNoiseNumCells;
	}

	getBoolSceneRepresentation = (size) => {
		const cellsSizeX = this.gridSizeX / size;
		const cellsSizeY = this.gridSizeY / size;
		const halfCellX = cellsSizeX * 0.5;
		const halfCellY = cellsSizeY * 0.5;
		const radius = (cellsSizeX + cellsSizeY) * 0.5;
		let grid = [];
		for (let y = 0; y < size; ++y) {
			let row = [];
			for (let x = 0; x < size; ++x) {
				const posX = x * cellsSizeX + this.gridStartX + halfCellX;
				const posY = y * cellsSizeY + this.gridStartY + halfCellY;
				let isInside = false;
				objectsLoop: for (const key in this.objects) {
					const objects = this.objects[key];
					for (let i = 0; i < objects.length; ++i) {
						const object = objects[i];
						if (object.isPointInside(posX, posY) || object.isCollidesCircle(posX, posY, radius)) {
							isInside = true;
							break objectsLoop;
						}
					}
				}
				row.push(isInside);
			}
			grid.push(row);
		}
		return { grid: grid, cellsSizeX: cellsSizeX, cellsSizeY: cellsSizeY, gridStartX: this.gridStartX, gridStartY: this.gridStartY };
	}

	getEmptyPosForCircle = (radius) => {
		this.updateGrid();

		const maxAttempts = 500;

		for (let attempt = 0; attempt < maxAttempts; ++attempt) {
			const freeSpace = [getRandomFloat(this.gridStartX, this.gridEndX), getRandomFloat(this.gridStartY, this.gridEndY)];

			const [gridIndexX, gridIndexY] = this.getGridIndexFromPoint(freeSpace[0], freeSpace[1]);
			const rangeX = Math.ceil(radius / this.gridCellsSizeX);
			const rangeY = Math.ceil(radius / this.gridCellsSizeY);

			let isValidPosition = true;

			for (let y = gridIndexY - rangeY; y <= gridIndexY + rangeY; ++y) {
				for (let x = gridIndexX - rangeX; x <= gridIndexX + rangeX; ++x) {
					if (x < 0 || y < 0 || x >= this.gridNumCells || y >= this.gridNumCells) continue;

					const cellObjects = this.grid[y][x];
					for (const object of cellObjects) {
						if (object.isPointInside(freeSpace[0], freeSpace[1]) || object.isCollidesCircle(freeSpace[0], freeSpace[1], radius)) {
							isValidPosition = false;
							break;
						}
					}
					if (!isValidPosition) break;
				}
				if (!isValidPosition) break;
			}
			if (isValidPosition) return freeSpace;
		}
		return [getRandomFloat(this.gridStartX, this.gridEndX), getRandomFloat(this.gridStartY, this.gridEndY)];
	}

	addObjectOntoGrid(object) {
		const gridNumCellsMinusOne = this.gridNumCells - 1;

		const objectVertexes = object.getVertexes();
		if (objectVertexes.length == 1) {
			const gridIndexX = Math.max(0, Math.min(gridNumCellsMinusOne, Math.floor((objectVertexes[0][0] - this.gridStartX) / this.gridCellsSizeX)));
			const gridIndexY = Math.max(0, Math.min(gridNumCellsMinusOne, Math.floor((objectVertexes[0][1] - this.gridStartY) / this.gridCellsSizeY)));
			this.grid[gridIndexY][gridIndexX].push(object);
			object.gridIndexes = [[gridIndexX, gridIndexY]];
			return;
		} else {
			object.gridIndexes.length = 0;
		}

		for (let vertexIndex = 0; vertexIndex < objectVertexes.length; ++vertexIndex) {
			if (vertexIndex + 1 >= objectVertexes.length) {
				break;
			}
			const point = objectVertexes[vertexIndex];

			const nextPoint = objectVertexes[vertexIndex + 1];
			const distanceX = Math.abs(nextPoint[0] - point[0]);
			const distanceY = Math.abs(nextPoint[1] - point[1]);
			const numSteps = Math.max(distanceX, distanceY);
			const incrementX = distanceX / numSteps;
			const incrementY = distanceY / numSteps;
			let currentX = point[0];
			let currentY = point[1];
			for (let i = 0; i < numSteps; ++i) {
				const gridIndexX = Math.max(0, Math.min(gridNumCellsMinusOne, Math.floor((currentX - this.gridStartX) / this.gridCellsSizeX)));
				const gridIndexY = Math.max(0, Math.min(gridNumCellsMinusOne, Math.floor((currentY - this.gridStartY) / this.gridCellsSizeY)));
				let isThisObjectAlreadyPresent = false;
				for (let presentObjectIndex = 0; presentObjectIndex < this.grid[gridIndexY][gridIndexX].length; ++presentObjectIndex) {
					const presentObject = this.grid[gridIndexY][gridIndexX][presentObjectIndex];
					if (object.id == presentObject.id) {
						isThisObjectAlreadyPresent = true;
						break;
					}
				}
				if (!isThisObjectAlreadyPresent) {
					object.gridIndexes.push([gridIndexX, gridIndexY]);
					this.grid[gridIndexY][gridIndexX].push(object);
				}

				currentX += incrementX;
				currentY += incrementY;
			}
		}
	}

	updateRelevantObjects(offsetX, offsetY, zoomInRate, halfWidth, halfHeight, maxDimension, player) {
		const [gridIndexX, gridIndexY] = this.getGridIndexFromPoint(offsetX, offsetY);
		if (this.didAnObjectSwitchCells || gridIndexX != this.lastRetrievedGridIndexXDraw || gridIndexY != this.lastRetrievedGridIndexYDraw || !this.lastRetrievedGridIndexXDraw || !this.lastRetrievedGridIndexYDraw) {
			this.didAnObjectSwitchCells = false;
			this.lastRetrievedGridObjectsDraw.length = 0;
			this.lastRetrievedGridObjectsDraw = this.getClosestObjectsToPoint(offsetX + halfWidth / zoomInRate, offsetY + halfHeight / zoomInRate, maxDimension / zoomInRate);
			this.lastRetrievedGridIndexXDraw = gridIndexX;
			this.lastRetrievedGridIndexYDraw = gridIndexY;
		}
		if (this.didAnObjectSwitchCells || gridIndexX != this.lastRetrievedGridIndexXUpdate || gridIndexY != this.lastRetrievedGridIndexYUpdate || !this.lastRetrievedGridIndexXUpdate || !this.lastRetrievedGridIndexYUpdate) {
			this.lastRetrievedGridObjectsUpdate.length = 0;
			this.lastRetrievedGridObjectsUpdate = this.getClosestObjectsToPoint(player.x + halfWidth / zoomInRate, player.y + halfHeight / zoomInRate, 3000);
			this.lastRetrievedGridIndexXUpdate = gridIndexX;
			this.lastRetrievedGridIndexYUpdate = gridIndexY;
		}
	}

	updateAreaPositions() {
		let smallestObjectX = Number.MAX_SAFE_INTEGER;
		let smallestObjectY = Number.MAX_SAFE_INTEGER;
		let largestObjectX = -Number.MAX_SAFE_INTEGER;
		let largestObjectY = -Number.MAX_SAFE_INTEGER;

		for (const objectsOfSomeTypeKey in this.objects) {
			const objectsOfSomeType = this.objects[objectsOfSomeTypeKey];
			for (let objectIndex = 0; objectIndex < objectsOfSomeType.length; ++objectIndex) {
				const object = objectsOfSomeType[objectIndex];
				const objectVertexes = object.getVertexes();

				for (let vertexIndex = 0; vertexIndex < objectVertexes.length; ++vertexIndex) {
					const point = objectVertexes[vertexIndex];
					if (point[0] < smallestObjectX) {
						smallestObjectX = point[0];
					}
					if (point[1] < smallestObjectY) {
						smallestObjectY = point[1];
					}
					if (point[0] > largestObjectX) {
						largestObjectX = point[0];
					}
					if (point[1] > largestObjectY) {
						largestObjectY = point[1];
					}
				}
			}
		}

		this.gridSizeX = largestObjectX - smallestObjectX;
		this.gridSizeY = largestObjectY - smallestObjectY;
		this.gridStartX = smallestObjectX;
		this.gridStartY = smallestObjectY;
		this.gridEndX = largestObjectX;
		this.gridEndY = largestObjectY;
	}
	updateGrid() {
		this.updateAreaPositions();

		this.gridNumCells = Math.max(1, Math.floor(Math.max(this.gridSizeX, this.gridSizeY) / 500));

		this.gridCellsSizeX = this.gridSizeX / this.gridNumCells;
		this.gridCellsSizeY = this.gridSizeY / this.gridNumCells;

		this.grid.length = 0;
		for (let y = 0; y < this.gridNumCells; ++y) {
			let row = [];
			for (let x = 0; x < this.gridNumCells; ++x) {
				row.push([]);
			}
			this.grid.push(row);
		}

		for (const objectsOfSomeTypeKey in this.objects) {
			const objectsOfSomeType = this.objects[objectsOfSomeTypeKey];
			for (let objectIndex = 0; objectIndex < objectsOfSomeType.length; ++objectIndex) {
				this.addObjectOntoGrid(objectsOfSomeType[objectIndex]);
			}
		}
	}

	clear() {
		for (const objectsOfSomeTypeKey in this.objects) {
			this.objects[objectsOfSomeTypeKey].length = 0;
		}
		this.lastRetrievedGridIndexXDraw = 0;
		this.lastRetrievedGridIndexYDraw = 0;
		this.lastRetrievedGridIndexXUpdate = 0;
		this.lastRetrievedGridIndexYUpdate = 0;
		this.lastRetrievedGridObjectsDraw.length = 0;
		this.lastRetrievedGridObjectsUpdate.length = 0;
		this.didAnObjectSwitchCells = false;
	}

	countFood() {
		this.numFoodToCollect = 0;
		for (const objectsOfSomeTypeKey in this.objects) {
			const objectsOfSomeType = this.objects[objectsOfSomeTypeKey];
			for (let objectIndex = 0; objectIndex < objectsOfSomeType.length; ++objectIndex) {
				const object = objectsOfSomeType[objectIndex];
				if (object.name == "food") {
					++this.numFoodToCollect;
				}
			}
		}
	}

	generate(generatorFn, seed, player) {
		setStringSeed(seed);

		for (let attempt = 0; attempt < 10; ++attempt) {
			this.clear();
			const isSuccessful = generatorFn(this.objects, this.getEmptyPosForCircle, this.getBoolSceneRepresentation, player);
			if (isSuccessful) {
				break;
			}
		}

		this.countFood();
		this.updateGrid();
	}

	getGridIndexFromPoint(x, y) {
		const gridNumCellsMinusOne = this.gridNumCells - 1;
		const gridIndexX = Math.min(gridNumCellsMinusOne, Math.floor((x - this.gridStartX) / this.gridCellsSizeX));
		const gridIndexY = Math.min(gridNumCellsMinusOne, Math.floor((y - this.gridStartY) / this.gridCellsSizeY));
		return [gridIndexX, gridIndexY];
	}

	getClosestObjectsToPoint(x, y, rangePixels) {
		const uniqueObjects = new Map();
		const [gridIndexX, gridIndexY] = this.getGridIndexFromPoint(x, y);

		const rangeCellsX = Math.max(1, Math.ceil(rangePixels / this.gridCellsSizeX));
		const rangeCellsY = Math.max(1, Math.ceil(rangePixels / this.gridCellsSizeY));
		const endY = gridIndexY + rangeCellsY;
		const endX = gridIndexX + rangeCellsX;

		for (let y = gridIndexY - rangeCellsY; y < endY; ++y) {
			for (let x = gridIndexX - rangeCellsX; x < endX; ++x) {
				if (x < 0 || y < 0 || x >= this.gridNumCells || y >= this.gridNumCells) {
					continue;
				}
				const cell = this.grid[y][x];
				for (let cellObjectIndex = 0; cellObjectIndex < cell.length; ++cellObjectIndex) {
					const object = cell[cellObjectIndex];
					uniqueObjects.set(object.id, object);
				}
			}
		}
		return Array.from(uniqueObjects.values());
	}

	drawBackgroundNoise(ctx, offsetX, offsetY, zoomInRate, width, height) {
		const cellSize = 200;
		const startX = Math.floor(offsetX / cellSize);
		const endX = Math.ceil((offsetX + width / zoomInRate) / cellSize);
		const startY = Math.floor(offsetY / cellSize);
		const endY = Math.ceil((offsetY + height / zoomInRate) / cellSize);

		for (let cellY = startY; cellY <= endY; ++cellY) {
			for (let cellX = startX; cellX <= endX; ++cellX) {
				const seed = cellX * 73856093 ^ cellY * 19349663;
				const brightness = 51 + ((seed & 0xFF) % 21) - 10;

				ctx.fillStyle = "rgb(" + brightness + ",0," + brightness + ")";
				ctx.fillRect(
					(cellX * cellSize - offsetX) * zoomInRate,
					(cellY * cellSize - offsetY) * zoomInRate,
					cellSize * zoomInRate,
					cellSize * zoomInRate
				);
			}
		}
	}

	draw(ctx, offsetX, offsetY, zoomInRate, halfWidth, halfHeight, width, height, maxDimension) {
		const extraExtension = 0;
		let visibilityPolygon = [];

		const cameraX = offsetX + halfWidth / zoomInRate;
		const cameraY = offsetY + halfHeight / zoomInRate;

		const screenLeft = cameraX - halfWidth / zoomInRate;
		const screenRight = cameraX + halfWidth / zoomInRate;
		const screenTop = cameraY - halfHeight / zoomInRate;
		const screenBottom = cameraY + halfHeight / zoomInRate;

		const screenVertices = [
			[screenLeft, screenTop],
			[screenRight, screenTop],
			[screenRight, screenBottom],
			[screenLeft, screenBottom]
		];

		for (let objectIndex = 0; objectIndex < this.lastRetrievedGridObjectsDraw.length; ++objectIndex) {
			const object = this.lastRetrievedGridObjectsDraw[objectIndex];
			const objectVertexes = object.getVertexes();
			if (objectVertexes.length < 2) continue;

			for (let vertexIndex = 0; vertexIndex < objectVertexes.length; ++vertexIndex) {
				const vertex = objectVertexes[vertexIndex];

				let toVertexX = vertex[0] - cameraX;
				let toVertexY = vertex[1] - cameraY;
				const magnitude = Math.sqrt(toVertexX * toVertexX + toVertexY * toVertexY);
				toVertexX /= magnitude;
				toVertexY /= magnitude;

				for (let angle of [-0.000000001, 0, 0.000000001]) {
					const [rotatedX, rotatedY] = getRotatedDirection(toVertexX, toVertexY, angle);
					let closestDist = Infinity;
					let closestPoint = null;

					for (let testObjectIndex = 0; testObjectIndex < this.lastRetrievedGridObjectsDraw.length; ++testObjectIndex) {
						const testObject = this.lastRetrievedGridObjectsDraw[testObjectIndex];
						const rayCastResult = testObject.getRayIntersection(
							cameraX, cameraY,
							rotatedX, rotatedY,
							maxDimension / zoomInRate
						);
						if (rayCastResult != null) {
							const distance = getDistance(cameraX, cameraY, rayCastResult.x, rayCastResult.y);
							if (distance < closestDist) {
								closestDist = distance;
								closestPoint = [rayCastResult.x, rayCastResult.y];
							}
						}
					}

					for (let i = 0; i < screenVertices.length; ++i) {
						const start = screenVertices[i];
						const end = screenVertices[(i + 1) % screenVertices.length];

						const result = isRayIntersectsLine(
							cameraX, cameraY,
							rotatedX, rotatedY,
							start[0], start[1],
							end[0], end[1],
							maxDimension / zoomInRate
						);

						if (result.isIntersecting) {
							const dx = result.x - cameraX;
							const dy = result.y - cameraY;
							const dist = Math.sqrt(dx * dx + dy * dy);

							if (dist < closestDist) {
								closestDist = dist;
								const extendedX = result.x + rotatedX * extraExtension;
								const extendedY = result.y + rotatedY * extraExtension;
								closestPoint = [extendedX, extendedY];
							}
						}
					}

					if (closestPoint) {
						visibilityPolygon.push({
							point: closestPoint,
							angle: Math.atan2(closestPoint[1] - cameraY, closestPoint[0] - cameraX)
						});
					}
				}
			}
		}

		for (let vertexIndex = 0; vertexIndex < screenVertices.length; ++vertexIndex) {
			const vertex = screenVertices[vertexIndex];
			let toVertexX = vertex[0] - cameraX;
			let toVertexY = vertex[1] - cameraY;
			const magnitude = Math.sqrt(toVertexX * toVertexX + toVertexY * toVertexY);
			toVertexX /= magnitude;
			toVertexY /= magnitude;

			for (let angle of [-0.000000001, 0, 0.000000001]) {
				const [rotatedX, rotatedY] = getRotatedDirection(toVertexX, toVertexY, angle);
				let closestDist = Infinity;
				let closestPoint = null;
				let hitScreenBoundary = false;

				for (let objectIndex = 0; objectIndex < this.lastRetrievedGridObjectsDraw.length; ++objectIndex) {
					const object = this.lastRetrievedGridObjectsDraw[objectIndex];
					const rayCastResult = object.getRayIntersection(
						cameraX, cameraY,
						rotatedX, rotatedY,
						maxDimension / zoomInRate
					);
					if (rayCastResult != null) {
						const distance = getDistance(cameraX, cameraY, rayCastResult.x, rayCastResult.y);
						if (distance < closestDist) {
							closestDist = distance;
							closestPoint = [rayCastResult.x, rayCastResult.y];
						}
					}
				}

				for (let i = 0; i < screenVertices.length; ++i) {
					const start = screenVertices[i];
					const end = screenVertices[(i + 1) % screenVertices.length];

					const result = isRayIntersectsLine(
						cameraX, cameraY,
						rotatedX, rotatedY,
						start[0], start[1],
						end[0], end[1],
						maxDimension / zoomInRate
					);

					if (result.isIntersecting) {
						const dx = result.x - cameraX;
						const dy = result.y - cameraY;
						const dist = Math.sqrt(dx * dx + dy * dy);

						if (dist < closestDist) {
							closestDist = dist;
							const extendedX = result.x + rotatedX * extraExtension;
							const extendedY = result.y + rotatedY * extraExtension;
							closestPoint = [extendedX, extendedY];
							hitScreenBoundary = true;
						}
					}
				}

				if (closestPoint) {
					visibilityPolygon.push({
						point: closestPoint,
						angle: Math.atan2(closestPoint[1] - cameraY, closestPoint[0] - cameraX)
					});
				}
			}
		}

		visibilityPolygon.sort((a, b) => a.angle - b.angle);
		visibilityPolygon = visibilityPolygon.map(v => v.point);
		let vertexesSumX = 0;
		let vertexesSumY = 0;
		for (let i = 0; i < visibilityPolygon.length; ++i) {
			const vertex = visibilityPolygon[i];
			vertexesSumX += vertex[0];
			vertexesSumY += vertex[1];
		}
		const centerX = vertexesSumX / visibilityPolygon.length;
		const centerY = vertexesSumY / visibilityPolygon.length;
		const expansion = 100;
		for (let i = 0; i < visibilityPolygon.length; ++i) {
			const vertex = visibilityPolygon[i];
			let toCenterX = vertex[0] - cameraX;
			let toCenterY = vertex[1] - cameraY;
			const magnitude = Math.sqrt(toCenterX * toCenterX + toCenterY * toCenterY);
			toCenterX /= magnitude;
			toCenterY /= magnitude;
			vertex[0] += toCenterX * expansion;
			vertex[1] += toCenterY * expansion;
		}

		if (visibilityPolygon.length > 0) {
			setStringSeed(this.shadowNoiseSeed.toString());
			for (let y = 0; y < this.shadowNoiseNumCells; ++y) {
				for (let x = 0; x < this.shadowNoiseNumCells; ++x) {
					const brightness = getRandomInt(0, 25);
					ctx.fillStyle = "rgb(" + brightness + "," + brightness + "," + brightness + ")";
					ctx.fillRect(x * this.shadowNoiseCellsSize, y * this.shadowNoiseCellsSize, this.shadowNoiseCellsSize, this.shadowNoiseCellsSize);
				}
			}

			ctx.save();

			ctx.beginPath();
			ctx.moveTo(
				(visibilityPolygon[0][0] - offsetX) * zoomInRate,
				(visibilityPolygon[0][1] - offsetY) * zoomInRate
			);
			for (let i = 1; i < visibilityPolygon.length; ++i) {
				ctx.lineTo(
					(visibilityPolygon[i][0] - offsetX) * zoomInRate,
					(visibilityPolygon[i][1] - offsetY) * zoomInRate
				);
			}

			ctx.closePath();
			ctx.clip();

			this.drawBackgroundNoise(ctx, offsetX, offsetY, zoomInRate, width, height);

			for (let objectIndex = 0; objectIndex < this.lastRetrievedGridObjectsDraw.length; ++objectIndex) {
				const object = this.lastRetrievedGridObjectsDraw[objectIndex];
				object.draw(ctx, offsetX, offsetY, zoomInRate);
			}

			ctx.restore();
		}
	}

	resolveCircleCollisions(x, y, radius) {
		let currentX = x;
		let currentY = y;
		for (let objectIndex = 0; objectIndex < this.lastRetrievedGridObjectsDraw.length; ++objectIndex) {
			const object = this.lastRetrievedGridObjectsDraw[objectIndex];
			const collisionResult = object.resolveCollisionCircle(currentX, currentY, radius);
			if (collisionResult != null) {
				[currentX, currentY] = collisionResult;
			}
		}
		return [currentX, currentY];
	}

	deleteObject(object) {
		for (let i = 0; i < object.gridIndexes.length; ++i) {
			const gridCell = this.grid[object.gridIndexes[i][1]][object.gridIndexes[i][0]];
			for (let gridObjectIndex = 0; gridObjectIndex < gridCell.length; ++gridObjectIndex) {
				const gridObject = gridCell[gridObjectIndex];
				if (gridObject.id == object.id) {
					gridCell.splice(gridObjectIndex, 1);
					break;
				}
			}
		}
		for (const key in this.objects) {
			const objects = this.objects[key];
			for (let i = 0; i < objects.length; ++i) {
				const anyObject = objects[i];
				if (object.id == anyObject.id) {
					objects.splice(i, 1);
					break;
				}
			}
		}
		for (let i = 0; i < this.lastRetrievedGridObjectsDraw.length; ++i) {
			const anyObject = this.lastRetrievedGridObjectsDraw[i];
			if (object.id == anyObject.id) {
				this.lastRetrievedGridObjectsDraw.splice(i, 1);
				break;
			}
		}
		for (let i = 0; i < this.lastRetrievedGridObjectsUpdate.length; ++i) {
			const anyObject = this.lastRetrievedGridObjectsUpdate[i];
			if (object.id == anyObject.id) {
				this.lastRetrievedGridObjectsUpdate.splice(i, 1);
				break;
			}
		}
		this.didAnObjectSwitchCells = true;
	}
	updateObjectGridPlace(object) {
		let isNewPositionDiffirentFromStoredGridIndexes = false;
		const vertexes = object.getVertexes();
		for (let vertexIndex = 0; vertexIndex < vertexes.length; ++vertexIndex) {
			const [newGridIndexX, newGridIndexY] = this.getGridIndexFromPoint(vertexes[vertexIndex][0], vertexes[vertexIndex][1]);
			for (let i = 0; i < object.gridIndexes.length; ++i) {
				if (object.gridIndexes[i][0] != newGridIndexX || object.gridIndexes[i][1] != newGridIndexY) {
					isNewPositionDiffirentFromStoredGridIndexes = true;
					break;
				}
			}
		}
		if (isNewPositionDiffirentFromStoredGridIndexes) {
			this.didAnObjectSwitchCells = true;
			for (let i = 0; i < object.gridIndexes.length; ++i) {
				const gridCell = this.grid[object.gridIndexes[i][1]][object.gridIndexes[i][0]];
				for (let gridObjectIndex = 0; gridObjectIndex < gridCell.length; ++gridObjectIndex) {
					const gridObject = gridCell[gridObjectIndex];
					if (gridObject.id == object.id) {
						gridCell.splice(gridObjectIndex, 1);
						break;
					}
				}
			}
		}
		this.addObjectOntoGrid(object);
	}

	updateObjectsFixedStep(offsetX, offsetY, zoomInRate, halfWidth, halfHeight, maxDimension, player, world) {
		for (let objectIndex = 0; objectIndex < this.lastRetrievedGridObjectsUpdate.length; ++objectIndex) {
			const object = this.lastRetrievedGridObjectsUpdate[objectIndex];
			object.update(player, world);

			/*if (object.isShouldDissapear) {
				this.deleteObject(object);
			} else if (object.isMovedLastStep === true) {
				object.isMovedLastStep = false;
				this.updateObjectGridPlace(object);
			}*/
			if (object.isShouldDissapear === true && object.isMovedLastStep === true) {
				this.deleteObject(object);
				object.isShouldDissapear = false;
				object.isMovedLastStep = false;
			} else if (object.isShouldDissapear === true && object.isMovedLastStep === false) {
				object.isShouldDissapear = false;
				this.deleteObject(object);
			} else if (object.isShouldDissapear === false && object.isMovedLastStep === true) {
				this.updateObjectGridPlace(object);
			}
		}
	}
	updateObjectsFrame(offsetX, offsetY, zoomInRate, halfWidth, halfHeight, maxDimension, player) {
		this.updateRelevantObjects(offsetX, offsetY, zoomInRate, halfWidth, halfHeight, maxDimension, player);
		this.isAllFoodCollected(player);
		const time = performance.now();
		if (time - this.lastShadowNoiseSeedUpdateTime > 1000) {
			this.lastShadowNoiseSeedUpdateTime = time;
			++this.shadowNoiseSeed;
		}
	}

	isAllFoodCollected(player) {
		let totalFoodCollected = 0;
		for (let foodBoxIndex = 0; foodBoxIndex < this.objects.foodBoxes.length; ++foodBoxIndex) {
			const foodBox = this.objects.foodBoxes[foodBoxIndex];
			for (let foodBoxObjectIndex = 0; foodBoxObjectIndex < foodBox.objectsInside.length; ++foodBoxObjectIndex) {
				const object = foodBox.objectsInside[foodBoxObjectIndex];
				if (object.name == "food") {
					++totalFoodCollected;
				}
			}
		}
		if (totalFoodCollected >= this.numFoodToCollect) {
			player.isWon = true;
		}
	}

	getDistanceToASeekerFromPoint(x, y) {
		let smallestDistance = Number.MAX_SAFE_INTEGER;
		for (let i = 0; i < this.objects.seekers.length; ++i) {
			const seeker = this.objects.seekers[i];
			const distance = getDistance(x, y, seeker.x, seeker.y);
			if (distance < smallestDistance) {
				smallestDistance = distance;
			}
		}
		return smallestDistance;
	}
}