const twoPI = Math.PI * 2;

export function getTerrorAnimation(scaleRate) {
	return {
		isRunning: true,
		intensity: 0,
		isDisappearing: false,
		maxRectangles: 3000 * scaleRate,
		baseRectSize: 150 * scaleRate,
		minClearRadius: 200 * scaleRate,
		maxClearRadius: 1000 * scaleRate,
		triggerDistance: 750,
		baseOpacity: 0.1,
		maxOpacityBoost: 0.85,
		finalOpacityMult: 0.2,
		rectHeightRatio: 0.1,
		minRectSizeMult: 0.1,
		disappearSpeed: 0.005,
		clearRadius: 1000 * scaleRate,

		draw(ctx, width, height, halfWidth, halfHeight) {
			if (this.intensity <= 0) return;

			const maxRectangles = Math.floor(this.maxRectangles * this.intensity);
			const maxDistance = Math.sqrt(width * width + height * height) * 0.5;
			const distanceRange = maxDistance - this.clearRadius;

			ctx.save();

			for (let i = 0; i < maxRectangles; i++) {
				const angle = Math.random() * twoPI;
				const distanceFromCenter = this.clearRadius +
					Math.sqrt(Math.random()) * distanceRange;

				const x = halfWidth + Math.cos(angle) * distanceFromCenter;
				const y = halfHeight + Math.sin(angle) * distanceFromCenter;

				const sizeVariation = 1 + (distanceFromCenter / maxDistance);
				const rectWidth = this.baseRectSize *
					(this.minRectSizeMult + Math.random()) * sizeVariation;
				const rectHeight = rectWidth * this.rectHeightRatio;

				const distanceOpacity = distanceFromCenter / maxDistance;
				/*const opacity = (this.baseOpacity +
						(this.maxOpacityBoost * this.intensity)) *
					(0.5 + distanceOpacity) * this.finalOpacityMult;*/
				
				//const brightness = ~~(Math.random() * 255);
				ctx.fillStyle = "rgba(255,255,255," + Math.random() + ")";
				ctx.fillRect(
					x - rectWidth * 0.5,
					y - rectHeight * 0.5,
					rectWidth,
					rectHeight
				);
			}

			ctx.restore();
		},

		update(config) {
			if (this.isDisappearing) {
				this.intensity = Math.max(0, this.intensity - this.disappearSpeed);
				this.clearRadius = Math.max(
					this.minClearRadius,
					this.maxClearRadius * (1 - this.intensity)
				);

				if (this.intensity <= 0) {
					this.isDisappearing = false;
					this.isRunning = false;
					this.reset();
				}
				return;
			}

			if (config.playerSeekerDistance >= this.triggerDistance) {
				this.intensity = 0;
				this.clearRadius = this.maxClearRadius;
			} else {
				this.intensity = 1 - (config.playerSeekerDistance / this.triggerDistance);
				this.clearRadius = Math.max(
					this.minClearRadius,
					this.maxClearRadius * (1 - this.intensity)
				);
			}
		},

		startDisappearing() {
			this.isDisappearing = true;
		},

		reset() {
			this.intensity = 0;
			this.clearRadius = this.maxClearRadius;
			this.isDisappearing = false;
		}
	};
}