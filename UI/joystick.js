import { getDistance } from '/Purr-petual/math.js';
const twoPI = 2 * Math.PI;

export function getJoystick(canvasWidth, canvasHeight, scaleRate, radius, cornerIndex, spacing) {
	let joystick = {
		x: null,
		y: null,
		radius: radius * scaleRate,
		handleX: null,
		handleY: null,
		directionX: 0,
		directionY: 0,
		cornerIndex: cornerIndex,
		scaleRate: scaleRate,
		canvasWidth: canvasWidth,
		canvasHeight: canvasHeight,
		spacing: spacing * scaleRate,

		draw(ctx) {
			const radius = this.radius;
			const lineWidth = radius * 0.05;
			const adjustedRadius = radius - lineWidth * 0.5;

			ctx.beginPath();
			ctx.arc(this.x, this.y, adjustedRadius, 0, twoPI);
			ctx.strokeStyle = "yellow";
			ctx.lineWidth = lineWidth;
			ctx.stroke();

			ctx.beginPath();
			ctx.arc(this.handleX, this.handleY, adjustedRadius * 0.15, 0, twoPI);
			ctx.fillStyle = "white";
			ctx.fill();
		},

		setup() {
			switch (this.cornerIndex) {
				case 2: {
					this.x = this.radius + this.spacing;
					this.y = this.canvasHeight - this.radius - this.spacing;
				}
				default: {
					break;
				}
			}
			this.handleX = this.x;
			this.handleY = this.y;
		},

		reset() {
			this.handleX = this.x;
			this.handleY = this.y;
			this.directionX = 0;
			this.directionY = 0;
		},

		update(mouseX, mouseY, pressStartX, pressStartY, isPressed) {
			if (!isPressed) {
				this.reset();
				return;
			}

			const distanceToPressStart = getDistance(this.x, this.y, pressStartX, pressStartY);

			if (distanceToPressStart < this.radius) {
				this.handleX = mouseX;
				this.handleY = mouseY;

				const distanceToCurrentPos = getDistance(this.x, this.y, mouseX, mouseY);
				if (distanceToCurrentPos > this.radius) {
					const angle = Math.atan2(mouseY - this.y, mouseX - this.x);
					this.handleX = this.x + this.radius * Math.cos(angle);
					this.handleY = this.y + this.radius * Math.sin(angle);
				}
			}

			this.directionX = (this.handleX - this.x) / this.radius;
			this.directionY = (this.handleY - this.y) / this.radius;
		}
	};

	joystick.setup();

	return joystick;
}