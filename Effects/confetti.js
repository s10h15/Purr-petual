import { getRandomFloat, getRandomInt } from "/Helpers/random.js";

const twoPI = Math.PI * 2;

export function getConfettiAnimation() {
	return {
		particles: [],
		isRunning: false,
		startTime: null,
		isFinished: false,

		start(scaleRate) {
			if (this.startTime == null) {
				this.startTime = performance.now();
				this.isRunning = true;
				this.generate(scaleRate);
			}
		},

		generate(scaleRate) {
			this.particles.length = 0;
			for (let i = 0; i < 1000; ++i) {
				this.particles.push({
					x: getRandomFloat(0, 1),
					y: 1,
					speedX: getRandomFloat(-0.0035, 0.0035),
					speedY: getRandomFloat(-0.07, -0.005),
					radius: getRandomInt(10, 15) * scaleRate,
					color: "rgba(" + getRandomInt(85, 255) + "," + getRandomInt(85, 255) + "," + getRandomInt(85, 255) + "," + getRandomFloat(0.5, 1) + ")"
				});
			}
		},

		draw(ctx, width, height) {
			for (let i = 0; i < this.particles.length; ++i) {
				const particle = this.particles[i];
				const x = particle.x * width;
				const y = particle.y * height;
				ctx.beginPath();
				ctx.arc(x, y, particle.radius, 0, twoPI);
				ctx.fillStyle = particle.color;
				ctx.fill();
			}
		},

		update() {
			if (!this.isRunning) {
				return;
			}
			for (let i = 0; i < this.particles.length; ++i) {
				const particle = this.particles[i];
				particle.x += particle.speedX;
				particle.y += particle.speedY;
				particle.speedY += 0.0001;
			}

			if (performance.now() - this.startTime > 5000) {
				this.isRunning = false;
				this.startTime = null;
				this.isFinished = true;
			}
		}
	};
}