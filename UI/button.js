const twoPI = Math.PI * 2;

export function getTextMetrics(buttonWidth, buttonHeight, text, rate, fontName) {
	const canvas = document.createElement("canvas");
	const context = canvas.getContext("2d");
	let fontSize = 0;
	let textWidth;
	let textHeight;

	do {
		context.font = fontSize + "px " + fontName;
		textWidth = context.measureText(text).width;
		const metrics = context.measureText(text);
		textHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
		fontSize++;
	} while (textWidth < (buttonWidth * rate));

	fontSize--;
	context.font = fontSize + "px " + fontName;
	const textMetrics = context.measureText(text);
	textWidth = textMetrics.width;
	textHeight = textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent;
	const textX = (buttonWidth - textWidth) * 0.5;
	const textY = (buttonHeight + textHeight) * 0.5 - textMetrics.actualBoundingBoxDescent;

	return { fontSize, textX, textY };
}

export function getButton(config) {
	const button = {
		posX: config.x * config.scaleRate,
		posY: config.y * config.scaleRate,
		sizeX: config.width * config.scaleRate,
		sizeY: config.height * config.scaleRate,
		endX: config.x * config.scaleRate + config.width * config.scaleRate,
		endY: config.y * config.scaleRate + config.height * config.scaleRate,
		originalWidth: config.width,
		originalHeight: config.height,
		key: config.key,

		color: "rgba(255,255,255,0.2)",
		textColor: "white",
		fontName: "Monospace",
		text: config.text,
		getNewTextFn: config.getNewTextFn,

		buttonToAlignWith: config.buttonToAlignWith,
		alignmentDirectionIndex: config.alignmentDirectionIndex,
		alignmentSpacing: config.alignmentSpacing,

		onClick: config.onClickFn,
		isClickable: true,
		isClickedWhileHovering: false,
		nextFrameIsClick: false,

		scaleRate: config.scaleRate,

		updateText() {
			let newText;
			if (this.getNewTextFn == undefined) {
				newText = this.text;
			} else {
				newText = this.getNewTextFn();
			}
			this.text = newText;
			const { fontSize, textX, textY } = getTextMetrics(this.sizeX, this.sizeY, this.text, 0.8, this.fontName);
			this.fontSize = fontSize;
			this.textX = textX;
			this.textY = textY;
		},

		alignToButton() {
			this.sizeX = this.originalWidth == undefined ? this.buttonToAlignWith.sizeX : this.originalWidth * this.scaleRate;
			this.sizeY = this.originalHeight == undefined ? this.buttonToAlignWith.sizeY : this.originalHeight * this.scaleRate;

			switch (this.alignmentDirectionIndex) {
				case 0:
				case 1:
					break;
				case 2:
					this.posX = this.buttonToAlignWith.posX + this.buttonToAlignWith.sizeX + this.alignmentSpacing * this.scaleRate;
					this.posY = this.buttonToAlignWith.posY;
					break;
				case 3:
					this.posY = this.buttonToAlignWith.posY + this.buttonToAlignWith.sizeY + this.alignmentSpacing * this.scaleRate;
					this.posX = this.buttonToAlignWith.posX;
					break;
				default:
					break;
			}

			this.updateText();

			this.endX = this.posX + this.sizeX;
			this.endY = this.posY + this.sizeY;
		},

		mouseInteract(mousePosX, mousePosY, mousePressStartX, mousePressStartY, isMousePressed) {
			const isHover = (
				mousePosX >= this.posX &&
				mousePosY >= this.posY &&
				mousePosX <= this.endX &&
				mousePosY <= this.endY
			);
			const isClicked = (
				mousePressStartX >= this.posX &&
				mousePressStartY >= this.posY &&
				mousePressStartX <= this.endX &&
				mousePressStartY <= this.endY &&
				isMousePressed
			);

			if (isHover) {
				if (this.isClickedWhileHovering && !isMousePressed) {
					this.nextFrameIsClick = true;
				}
				if (isClicked) {
					if (this.isClickable || this.nextFrameIsClick) {
						this.color = "cyan";
						this.textColor = "black";

						this.onClick();
						this.isClickable = false;
						this.isClickedWhileHovering = true;
						this.nextFrameIsClick = false;
					}
					this.updateText();
				} else {
					this.color = "white";
					this.textColor = "black";
				}
			} else {
				this.color = "rgb(51,51,51,0.8)";
				this.textColor = "white";

				if (!isMousePressed) {
					this.isClickable = true;
				}

				this.isClickedWhileHovering = false;
			}

			return isClicked;
		},

		/*
		mouseInteract(mousePositionsX, mousePositionsY, mousePressStartsX, mousePressStartsY, isMousePressed) {
			let hasBeenClicked = false;
			for (let i = 0; i < mousePositionsX.length; ++i) {
				const mousePosX = mousePositionsX[i];
				const mousePosY = mousePositionsY[i];
				const mousePressStartX = mousePressStartsX[i];
				const mousePressStartY = mousePressStartsY[i];
		
				const isHover = (
					mousePosX >= this.posX &&
					mousePosY >= this.posY &&
					mousePosX <= this.endX &&
					mousePosY <= this.endY
				);
				const isClicked = (
					mousePressStartX >= this.posX &&
					mousePressStartY >= this.posY &&
					mousePressStartX <= this.endX &&
					mousePressStartY <= this.endY &&
					isMousePressed
				);
		
				if (isHover) {
					if (this.isClickedWhileHovering && !isMousePressed) {
						this.nextFrameIsClick = true;
					}
					if (isClicked) {
						if (this.isClickable || this.nextFrameIsClick) {
							this.color = "cyan";
							this.textColor = "black";
		
							this.onClick();
							this.isClickable = false;
							this.isClickedWhileHovering = true;
							this.nextFrameIsClick = false;
						}
						this.updateText();
					} else {
						this.color = "white";
						this.textColor = "black";
					}
				} else {
					this.color = "rgb(51,51,51,0.8)";
					this.textColor = "white";
		
					if (!isMousePressed) {
						this.isClickable = true;
					}
		
					this.isClickedWhileHovering = false;
				}
				if (isClicked) {
					hasBeenClicked = true;
				}
			}
			return hasBeenClicked;
		},
		*/

		draw(ctx) {
			ctx.fillStyle = this.color;
			ctx.fillRect(this.posX, this.posY, this.sizeX, this.sizeY);

			if (this.text) {
				ctx.font = this.fontSize + "px " + this.fontName;
				ctx.fillStyle = this.textColor;
				ctx.fillText(this.text, this.posX + this.textX, this.posY + this.textY);
			}
		},

		keyInteract(heldKeys) {
			if (heldKeys[this.key]) {
				this.onClick();
				delete heldKeys[this.key];
			}
		}
	};

	button.updateText();
	if (button.buttonToAlignWith != undefined) {
		button.alignToButton();
	}

	return button;
}