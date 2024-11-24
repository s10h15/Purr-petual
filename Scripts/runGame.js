import { World } from "/Objects/world.js";
import { getPlayer } from "/Objects/player.js";
import { getCamera } from "/Objects/camera.js";
import { Mouse } from "/Objects/mouse.js";
import { getJoystick } from "/UI/joystick.js";
import { getButton } from "/UI/button.js";
import { drawDeathOnContext, drawWinOnContext } from "/Helpers/popups.js";
import { getConfettiAnimation } from "/Effects/confetti.js";
import { getTerrorAnimation } from "/Effects/terror.js";

import { generateScattered, generateTest } from "/Helpers/worldGenerators.js";

const PI180Back = 180 / Math.PI;
const PI180 = Math.PI / 180;

const isPC = false;

function getRandomSeed() {
	return Math.random().toString();
}
const worldGeneratorFn = generateScattered;

const currentlyHeldKeys = {};
const pressedKeys = {};
window.addEventListener("keydown", event => {
	const key = event.key.toLowerCase();
	currentlyHeldKeys[key] = true;

	if (!pressedKeys[key]) {
		pressedKeys[key] = true;
	}
});
window.addEventListener("keyup", event => {
	const key = event.key.toLowerCase();
	delete currentlyHeldKeys[key];
});

const canvas = {
	element: document.getElementById("canvasElement"),
	ctx: null,
	width: 0,
	height: 0,
	centerX: 0,
	centerY: 0,
	minDimension: 0,
	maxDimension: 0,
	scaleRate: 0
};
canvas.ctx = canvas.element.getContext("2d");
canvas.width = canvas.element.width;
canvas.width05 = canvas.width * 0.5;
canvas.height = canvas.element.height;
canvas.height05 = canvas.height * 0.5;
canvas.centerX = canvas.width * 0.5;
canvas.centerY = canvas.height * 0.5;
canvas.minDimension = Math.min(canvas.width, canvas.height);
canvas.maxDimension = Math.max(canvas.width, canvas.height);
canvas.scaleRate = canvas.minDimension / 1024;

const pageConsole = {
	element: document.getElementById("pageConsole"),
	parameterSeparator: ","
};

const game = {
	world: new World(),
	player: getPlayer(),
	camera: getCamera(canvas.scaleRate),
	mouse: new Mouse(canvas.element, canvas.scaleRate),
};
game.camera.x = game.player.x - canvas.width05 / game.camera.zoomInRate;
game.camera.y = game.player.y - canvas.height05 / game.camera.zoomInRate;
game.world.setup(canvas.maxDimension);

const effects = {
	confettiAnimation: getConfettiAnimation(),
	terrorAnimation: getTerrorAnimation(canvas.scaleRate)
};

const UI = {
	joystick: getJoystick(canvas.width, canvas.height, canvas.scaleRate, 200, 2, 5),
}
const buttons = {};
buttons.buttonZoomOut = getButton({
	scaleRate: canvas.scaleRate,
	x: 0,
	y: 0,
	width: 150,
	height: 150,
	text: "-",
	key: "0",
	onClickFn: () => {
		const cameraCenterX = game.camera.x + canvas.width05 / game.camera.zoomInRate;
		const cameraCenterY = game.camera.y + canvas.height05 / game.camera.zoomInRate;

		game.camera.zoomInRate *= game.camera.zoomOutRate;
		if (game.camera.zoomInRate < game.camera.minZoomInRate) {
			game.camera.zoomInRate = game.camera.minZoomInRate;
		}

		game.camera.x = cameraCenterX - canvas.width05 / game.camera.zoomInRate;
		game.camera.y = cameraCenterY - canvas.height05 / game.camera.zoomInRate;
	},
	getNewTextFn: () => {
		return "-";
	}
});
buttons.buttonZoomIn = getButton({
	scaleRate: canvas.scaleRate,
	buttonToAlignWith: buttons.buttonZoomOut,
	alignmentDirectionIndex: 2,
	alignmentSpacing: 10,
	text: "+",
	key: "1",
	onClickFn: () => {
		const cameraCenterX = game.camera.x + canvas.width05 / game.camera.zoomInRate;
		const cameraCenterY = game.camera.y + canvas.height05 / game.camera.zoomInRate;

		game.camera.zoomInRate += game.camera.zoomInSpeed * (game.camera.zoomInRate <= 0 ? game.camera.minZoomInRate : game.camera.zoomInRate);

		game.camera.x = cameraCenterX - canvas.width05 / game.camera.zoomInRate;
		game.camera.y = cameraCenterY - canvas.height05 / game.camera.zoomInRate;
	}
});
buttons.buttonRestart = getButton({
	scaleRate: canvas.scaleRate,
	buttonToAlignWith: buttons.buttonZoomOut,
	alignmentDirectionIndex: 3,
	alignmentSpacing: 50,
	text: "↻",
	key: "r",
	onClickFn: () => {
		game.world.generate(worldGeneratorFn, getRandomSeed(), game.player);
		game.player.restart();
		effects.confettiAnimation.isFinished = false;
		effects.terrorAnimation.isRunning = true;
		effects.terrorAnimation.reset();
	}
});
buttons.buttonInteract = getButton({
	x: canvas.width / canvas.scaleRate - 300,
	y: canvas.height / canvas.scaleRate * 0.5,
	width: 300,
	height: 300,
	scaleRate: canvas.scaleRate,
	text: "use",
	key: "e",
	onClickFn: () => {
		game.player.makeInteract();
	}
});
game.world.generate(worldGeneratorFn, getRandomSeed(), game.player);

const timing = {
	targetFps: 144,
	fixedStep: 1 / 144,
	maxAccumulator: 1 / 144 * 32,
	fps: 0,
	minDelay: 0
};
timing.minDelay = 1000 / timing.targetFps;

const simulation = {
	accumulator: 0,
	lastFrameTime: performance.now(),
	framesCount: 0
};

function drawEffects() {
	for (const name in effects) {
		const effect = effects[name];
		if (effect.isRunning) {
			effect.draw(canvas.ctx, canvas.width, canvas.height, canvas.width05, canvas.height05);
		}
	}
}

function updateEffects() {
	const config = {
		playerSeekerDistance: game.world.getDistanceToASeekerFromPoint(game.player.x, game.player.y)
	};
	for (const name in effects) {
		effects[name].update(config);
	}
}

function drawUI() {
	if (isPC) {
		return;
	}
	canvas.ctx.textAlign = "start";
	canvas.ctx.textBaseline = "alphabetic";

	UI.joystick.draw(canvas.ctx);
	for (let buttonKey in buttons) {
		const button = buttons[buttonKey];
		button.draw(canvas.ctx);
	}
}

function updateUI() {
	for (let buttonKey in buttons) {
		const button = buttons[buttonKey];
		button.mouseInteract(game.mouse.x, game.mouse.y, game.mouse.actualPressStartPosX, game.mouse.actualPressStartPosY, game.mouse.isPressed);
	}
}

function updateButtonKeys() {
	for (let buttonKey in buttons) {
		const button = buttons[buttonKey];
		button.keyInteract(pressedKeys);
	}
}

/*function getObjectsUpdateConfig() {
	return {
		cameraX: game.camera.x,
		cameraY: game.camera.y,
		zoomInRate: game.camera.zoomInRate,
		halfWidth: canvas.width05,
		halfHeight: canvas.height05,
		maxDimension: canvas.maxDimension,
		player: game.player,
		world: game.world
	};
}*/

function perFixedStepUpdate() {
	const lerpSpeed = (game.player.isVisible ? 0.2 : 0.05) * game.camera.zoomInRate;
	const targetX = game.player.x - (canvas.width05) / game.camera.zoomInRate;
	const targetY = game.player.y - (canvas.height05) / game.camera.zoomInRate;
	game.camera.x += (targetX - game.camera.x) * lerpSpeed;
	game.camera.y += (targetY - game.camera.y) * lerpSpeed;

	if (!game.player.isDead && !game.player.isWon) {
		game.world.updateObjectsFixedStep(game.camera.x, game.camera.y, game.camera.zoomInRate, canvas.width05, canvas.height05, canvas.maxDimension, game.player, game.world);

		if (isPC) {
			game.player.controlMovementKeys(currentlyHeldKeys);
		} else {
			game.player.controlMovementDirection(UI.joystick.directionX, UI.joystick.directionY);
		}
		const [newPlayerX, newPlayerY] = game.world.resolveCircleCollisions(game.player.x, game.player.y, game.player.radius);
		game.player.x = newPlayerX;
		game.player.y = newPlayerY;
	}

	updateEffects();
}

function perFrameUpdate() {
	if (isPC) {
		updateButtonKeys();
	} else {
		UI.joystick.update(game.mouse.x, game.mouse.y, game.mouse.actualPressStartPosX, game.mouse.actualPressStartPosY, game.mouse.isPressed);
		updateUI();
	}

	if (!game.player.isDead && !game.player.isWon) {
		game.player.update();
		game.world.updateObjectsFrame(game.camera.x, game.camera.y, game.camera.zoomInRate, canvas.width05, canvas.height05, canvas.maxDimension, game.player);
	} else {
		effects.terrorAnimation.isDisappearing = true;
	}
}

function runFrame() {
	const frameStart = performance.now();
	const deltaTime = (frameStart - simulation.lastFrameTime) / 1000;
	simulation.lastFrameTime = frameStart;

	simulation.accumulator += deltaTime;
	if (simulation.accumulator > timing.maxAccumulator) {
		simulation.accumulator = timing.maxAccumulator;
	}

	while (simulation.accumulator >= timing.fixedStep) {
		perFixedStepUpdate();
		simulation.accumulator -= timing.fixedStep;
	}

	perFrameUpdate();

	render();

	const processTime = performance.now() - frameStart;
	const nextFrameDelay = timing.minDelay - processTime;
	setTimeout(runFrame, Math.max(0, nextFrameDelay));
}

function render() {
	canvas.ctx.fillStyle = "black";
	canvas.ctx.fillRect(0, 0, canvas.width, canvas.height);

	game.world.draw(canvas.ctx, game.camera.x, game.camera.y, game.camera.zoomInRate, canvas.width05, canvas.height05, canvas.width, canvas.height, canvas.maxDimension);
	game.player.draw(canvas.ctx, game.camera.x, game.camera.y, game.camera.zoomInRate);

	drawEffects();
	drawUI();

	if (game.player.isDead) {
		drawDeathOnContext(canvas.ctx, canvas.width, canvas.height, canvas.scaleRate);
	} else if (game.player.isWon) {
		drawWinOnContext(canvas.ctx, canvas.width, canvas.height, canvas.scaleRate);
		if (!effects.confettiAnimation.isFinished) {
			effects.confettiAnimation.start(canvas.scaleRate);
		}
	}
}

runFrame();