function murmurhash3_32_gc(key, seed) {
	var remainder, bytes, h1, h1b, c1, c2, k1, i;

	remainder = key.length & 3;
	bytes = key.length - remainder;
	h1 = seed;
	c1 = 0xcc9e2d51;
	c2 = 0x1b873593;
	i = 0;

	while (i < bytes) {
		k1 =
			((key.charCodeAt(i) & 0xff)) |
			((key.charCodeAt(++i) & 0xff) << 8) |
			((key.charCodeAt(++i) & 0xff) << 16) |
			((key.charCodeAt(++i) & 0xff) << 24);
		++i;

		k1 = (((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16)) & 0xffffffff;
		k1 = (k1 << 15) | (k1 >>> 17);
		k1 = (((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16)) & 0xffffffff;

		h1 ^= k1;
		h1 = (h1 << 13) | (h1 >>> 19);
		h1b = (((h1 & 0xffff) * 5) + ((((h1 >>> 16) * 5) & 0xffff) << 16)) & 0xffffffff;
		h1 = (((h1b & 0xffff) + 0x6b64) + ((((h1b >>> 16) + 0xe654) & 0xffff) << 16));
	}

	k1 = 0;

	switch (remainder) {
		case 3:
			k1 ^= (key.charCodeAt(i + 2) & 0xff) << 16;
		case 2:
			k1 ^= (key.charCodeAt(i + 1) & 0xff) << 8;
		case 1:
			k1 ^= (key.charCodeAt(i) & 0xff);

			k1 = (((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16)) & 0xffffffff;
			k1 = (k1 << 15) | (k1 >>> 17);
			k1 = (((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16)) & 0xffffffff;
			h1 ^= k1;
	}

	h1 ^= key.length;

	h1 ^= h1 >>> 16;
	h1 = (((h1 & 0xffff) * 0x85ebca6b) + ((((h1 >>> 16) * 0x85ebca6b) & 0xffff) << 16)) & 0xffffffff;
	h1 ^= h1 >>> 13;
	h1 = (((h1 & 0xffff) * 0xc2b2ae35) + ((((h1 >>> 16) * 0xc2b2ae35) & 0xffff) << 16)) & 0xffffffff;
	h1 ^= h1 >>> 16;

	return h1 >>> 0;
}

export function getSeed(string) {
	return murmurhash3_32_gc(string, 0x9747b28c);
}

const floatA = 1664525;
const floatC = 1013904223;
const floatM = 4294967296;
let floatSeed = 1;

function floatLcg() {
	floatSeed = (floatA * floatSeed + floatC) % floatM;
	return floatSeed / floatM;
}

export function getRandomFloat(min, max) {
	const randomValue = floatLcg();
	return min + randomValue * (max - min);
}

const intA = 1103515245;
const intC = 12345;
const intM = 2147483648;
let intSeed = 1;

function intLcg() {
	intSeed = (intA * intSeed + intC) % intM;
	return intSeed / intM;
}

export function getRandomInt(min, max) {
	const randomValue = intLcg();
	return Math.floor(min + randomValue * (max - min + 1));
}

export function setStringSeed(seed) {
	const hash = getSeed(seed);
	floatSeed = hash;
	intSeed = hash;
}
export function setSeed(number) {
	floatSeed = number;
	intSeed = number;
}

export function isChance(rate) {
	return getRandomFloat(0, 1) <= rate;
}