import { getWall, getBarrier } from "/Objects/wall.js";
import { getFood } from "/Objects/food.js";
import { getSeeker } from "/Objects/seeker.js";
import { getCloset } from "/Objects/closet.js";
import { getFoodBox } from "/Objects/foodBox.js";

import { getRandomInt, getRandomFloat, setSeed, isChance } from "/Helpers/random.js";
import { getRotatedDirection, getPath } from "/math.js";

const twoPI = Math.PI * 2;

// Helper function to get list of valid neighbor cells that are walls
function getNeighborWalls(maze, x, y, width, height) {
	const neighbors = [];
	const directions = [[-2, 0], [2, 0], [0, -2], [0, 2]];

	for (const [dx, dy] of directions) {
		const newX = x + dx;
		const newY = y + dy;

		if (newX >= 0 && newX < width && newY >= 0 && newY < height && maze[newY][newX]) {
			neighbors.push([newX, newY, x + dx / 2, y + dy / 2]);
		}
	}
	return neighbors;
}

/**
 * Generates a maze using Prim's algorithm
 * @param {number} width - The width of the maze (will be adjusted to odd number if even)
 * @param {number} height - The height of the maze (will be adjusted to odd number if even)
 * @returns {boolean[][]} - 2D array representing the maze where true=wall, false=path
 */
function generateMaze(width, height) {
	// Ensure odd dimensions for proper maze generation
	if (width % 2 === 0) width++;
	if (height % 2 === 0) height++;

	// Initialize maze with all walls
	const maze = Array(height).fill().map(() => Array(width).fill(true));

	// Start with fixed odd coordinates (could use random odd coordinates)
	const startX = 1;
	const startY = 1;

	// Mark the starting cell as path
	maze[startY][startX] = false;

	// Initialize walls frontier with neighbors of starting cell
	const walls = getNeighborWalls(maze, startX, startY, width, height);

	// While there are walls in frontier
	while (walls.length > 0) {
		// Pick a random wall from frontier
		const wallIdx = getRandomInt(0, walls.length - 1);
		const [x, y, pathX, pathY] = walls[wallIdx];

		// Remove wall from frontier
		walls.splice(wallIdx, 1);

		// If cell on opposite side of wall is still a wall
		if (maze[y][x]) {
			// Make it a path and create passage
			maze[y][x] = false;
			maze[pathY][pathX] = false;

			// Add neighboring walls to frontier
			walls.push(...getNeighborWalls(maze, x, y, width, height));
		}
	}

	return maze;
}

export function generateScattered(objects, getEmptyPos, getBoolWorldRepresentation, player) {
	const numCells = 9;
	const cellsSize = 300;
	const boundaryOffset = 1000;
	const sceneCenter = (numCells * cellsSize) * 0.5;
	const totalWidth = numCells * cellsSize + boundaryOffset * 2;
	const halfWidth = totalWidth * 0.5;
	const safeZone = {
		min: -halfWidth + boundaryOffset,
		max: halfWidth - boundaryOffset
	};

	function isPointInBounds(x, y) {
		return x >= safeZone.min && x <= safeZone.max &&
			y >= safeZone.min && y <= safeZone.max;
	}

	function clamp(value, min, max) {
		return Math.max(min, Math.min(max, value));
	}

	function clampVertices(vertices) {
		return vertices.map(([x, y]) => [
            clamp(x, safeZone.min, safeZone.max),
            clamp(y, safeZone.min, safeZone.max)
        ]);
	}

	let wallsGrid = generateMaze(numCells, numCells);

	for (let y = 0; y < numCells; ++y) {
		for (let x = 0; x < numCells; ++x) {
			if (wallsGrid[y][x] && isChance(0.3)) {
				wallsGrid[y][x] = false;
			}
		}
	}

	const noise = cellsSize * 0.3;
	for (let y = 0; y < numCells; ++y) {
		for (let x = 0; x < numCells; ++x) {
			if (wallsGrid[y][x] && isChance(0.1)) {
				const randomY = y + getRandomInt(-3, 3);
				const randomX = x + getRandomInt(-3, 3);

				if (randomY >= 0 && randomY < numCells && randomX >= 0 && randomX < numCells) {
					const startX = clamp(cellsSize * x + cellsSize * 0.5 + getRandomInt(-noise, noise) - sceneCenter, safeZone.min, safeZone.max);
					const startY = clamp(cellsSize * y + cellsSize * 0.5 + getRandomInt(-noise, noise) - sceneCenter, safeZone.min, safeZone.max);
					const endX = clamp(cellsSize * randomX + cellsSize * 0.5 + getRandomInt(-noise, noise) - sceneCenter, safeZone.min, safeZone.max);
					const endY = clamp(cellsSize * randomY + cellsSize * 0.5 + getRandomInt(-noise, noise) - sceneCenter, safeZone.min, safeZone.max);
					const midX = clamp((startX + endX) * 0.5 + getRandomInt(-noise * 0.5, noise * 0.5), safeZone.min, safeZone.max);
					const midY = clamp((startY + endY) * 0.5 + getRandomInt(-noise * 0.5, noise * 0.5), safeZone.min, safeZone.max);

					objects.barriers.push(getBarrier([[startX, startY], [midX, midY], [endX, endY]]));
				}
			}
		}
	}

	const closetRadius = cellsSize * 0.75;
	for (let y = 0; y < numCells; ++y) {
		for (let x = 0; x < numCells; ++x) {
			if (wallsGrid[y][x] && isChance(0.15)) {
				const centerX = cellsSize * x + cellsSize * 0.5;
				const centerY = cellsSize * y + cellsSize * 0.5;

				const angle = getRandomFloat(0, twoPI);
				const closetX = centerX + closetRadius * Math.cos(angle);
				const closetY = centerY + closetRadius * Math.sin(angle);

				const rotationAngle = angle + Math.PI * 0.5 + getRandomInt(-20, 20);
				const closetWidth = cellsSize * 0.6;
				const closetHeight = cellsSize * 0.3;

				let vertices = [
                    [-closetWidth * 0.5, -closetHeight * 0.5],
                    [closetWidth * 0.5, -closetHeight * 0.5],
                    [closetWidth * 0.5, closetHeight * 0.5],
                    [-closetWidth * 0.5, closetHeight * 0.5]
                ].map(([vx, vy]) => [
                    closetX + vx * Math.cos(rotationAngle) - vy * Math.sin(rotationAngle) - sceneCenter,
                    closetY + vx * Math.sin(rotationAngle) + vy * Math.cos(rotationAngle) - sceneCenter
                ]);

				if (vertices.every(([x, y]) => isPointInBounds(x, y))) {
					objects.closets.push(getCloset(vertices));
				}
			}
		}
	}

	for (let y = 0; y < numCells; ++y) {
		for (let x = 0; x < numCells; ++x) {
			if (wallsGrid[y][x]) {
				const wallX = cellsSize * x;
				const wallY = cellsSize * y;
				let vertices = [
                    [wallX + getRandomInt(-noise, noise) - sceneCenter, wallY + getRandomInt(-noise, noise) - sceneCenter],
                    [wallX + cellsSize + getRandomInt(-noise, noise) - sceneCenter, wallY - sceneCenter],
                    [wallX + cellsSize + getRandomInt(-noise, noise) - sceneCenter, wallY + cellsSize - sceneCenter],
                    [wallX - sceneCenter, wallY + cellsSize - sceneCenter]
                ];

				vertices = clampVertices(vertices);
				objects.walls.push(getWall(vertices));
			}
		}
	}

	objects.walls.push(getWall([
        [-halfWidth, -halfWidth],
        [halfWidth, -halfWidth],
        [halfWidth, -halfWidth + boundaryOffset],
        [-halfWidth, -halfWidth + boundaryOffset]
    ]));
	objects.walls.push(getWall([
        [-halfWidth, halfWidth - boundaryOffset],
        [halfWidth, halfWidth - boundaryOffset],
        [halfWidth, halfWidth],
        [-halfWidth, halfWidth]
    ]));
	objects.walls.push(getWall([
        [-halfWidth, -halfWidth],
        [-halfWidth + boundaryOffset, -halfWidth],
        [-halfWidth + boundaryOffset, halfWidth],
        [-halfWidth, halfWidth]
    ]));
	objects.walls.push(getWall([
        [halfWidth - boundaryOffset, -halfWidth],
        [halfWidth, -halfWidth],
        [halfWidth, halfWidth],
        [halfWidth - boundaryOffset, halfWidth]
    ]));

	const foodBoxSize = 90;
	const halfFoodBox = foodBoxSize * 0.5;
	let [foodBoxX, foodBoxY] = getEmptyPos(foodBoxSize);
	foodBoxX -= halfFoodBox;
	foodBoxY -= halfFoodBox;
	let worldGrid = getBoolWorldRepresentation(256);
	const foodBoxGridX = Math.floor((foodBoxX + halfFoodBox - worldGrid.gridStartX) / worldGrid.cellsSizeX);
	const foodBoxGridY = Math.floor((foodBoxY + halfFoodBox - worldGrid.gridStartY) / worldGrid.cellsSizeY);

	let numSeekersSpawned = 0;
	for (let i = 0; i < 1; ++i) {
		const [x, y] = getEmptyPos(50);
		const seekerGridX = Math.floor((x - worldGrid.gridStartX) / worldGrid.cellsSizeX);
		const seekerGridY = Math.floor((y - worldGrid.gridStartY) / worldGrid.cellsSizeY);
		const seekerToFoodBoxPath = getPath(worldGrid.grid, seekerGridX, seekerGridY, foodBoxGridX, foodBoxGridY)
		if (seekerToFoodBoxPath != null) {
			objects.seekers.push(getSeeker(x, y));
			++numSeekersSpawned;
		}
	}
	if (numSeekersSpawned == 0) {
		return false;
	}

	let numFoodSpawned = 0;
	for (let i = 0; i < 10; ++i) {
		const [foodX, foodY] = getEmptyPos(cellsSize * 0.5);
		const foodGridX = Math.floor((foodX - worldGrid.gridStartX) / worldGrid.cellsSizeX);
		const foodGridY = Math.floor((foodY - worldGrid.gridStartY) / worldGrid.cellsSizeY);
		const foodToBoxPath = getPath(worldGrid.grid, foodGridX, foodGridY, foodBoxGridX, foodBoxGridY);
		if (foodToBoxPath != null) {
			objects.food.push(getFood(foodX, foodY));
			++numFoodSpawned;
		}
	}
	if (numFoodSpawned == 0) {
		return false;
	}
	objects.foodBoxes.push(getFoodBox([
		[foodBoxX, foodBoxY], [foodBoxX + foodBoxSize, foodBoxY], [foodBoxX + foodBoxSize, foodBoxY + foodBoxSize], [foodBoxX, foodBoxY + foodBoxSize]
	]));

	for (let attempt = 0; attempt < 100; ++attempt) {
		const [playerX, playerY] = getEmptyPos(player.radius);
		const playerGridX = Math.floor((playerX - worldGrid.gridStartX) / worldGrid.cellsSizeX);
		const playerGridY = Math.floor((playerY - worldGrid.gridStartY) / worldGrid.cellsSizeY);
		const playerToBoxPath = getPath(worldGrid.grid, playerGridX, playerGridY, foodBoxGridX, foodBoxGridY);
		if (playerToBoxPath != null) {
			player.x = playerX;
			player.y = playerY;
			return true;
		}
	}
	return false;
}

export function generateTest(objects) {
	objects.walls.push(getWall(
		[[50, 0], [500, 0], [500, 300], [0, 300]]
	));
	objects.walls.push(getWall(
		[[500, 0], [700, 0], [700, 800], [500, 300]]
	));

	objects.closets.push(getCloset(
		[[350, 350], [550, 550], [450, 600], [250, 400]]
	));

	objects.foodBoxes.push(getFoodBox(
		[[-100, 750], [150, 750], [150, 1000], [-100, 1000]]
	));

	objects.food.push(getFood(600, -30));
	objects.food.push(getFood(0, 500));
	objects.food.push(getFood(1300, 900));

	const centerX = 500;
	const centerY = 500;
	const numPoints = 40;
	const maxRadius = 1200;
	let points = [];
	const numRotations = 5;
	for (let i = 0; i < numPoints; ++i) {
		const angle = (i / numPoints) * numRotations * twoPI;
		const radius = getRandomInt(maxRadius * 0.8, maxRadius);

		const noiseFactor = 0.2;
		const xNoise = (getRandomInt(-50, 50) / 100) * maxRadius * noiseFactor;
		const yNoise = (getRandomInt(-50, 50) / 100) * maxRadius * noiseFactor;
		const x = centerX + radius * Math.cos(angle) + xNoise;
		const y = centerY + radius * Math.sin(angle) + yNoise;

		points.push([x, y]);
	}
	objects.barriers.push(getBarrier(
		points
	));

	objects.seekers.push(getSeeker(750, 0));

	player.x = 0;
	player.y = 0;

	return true;
}