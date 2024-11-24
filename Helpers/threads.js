export function thread(asyncFunction) {
	let currentId = 0;
	const promises = {};

	const script = `
		$$ = (${asyncFunction});
		onmessage = (e) => {
			Promise.resolve(e.data[1]).then(
				v => $$.apply($$, v)
			).then(
				d => {
					postMessage([e.data[0], 0, d], [d].filter(x => (
						(x instanceof ArrayBuffer) ||
						(x instanceof MessagePort) ||
						(self.ImageBitmap && x instanceof ImageBitmap)
					)));
				},
				er => { postMessage([e.data[0], 1, '' + er]); }
			);
		};
	`;

	const workerURL = URL.createObjectURL(new Blob([script]));
	const worker = new Worker(workerURL);

	worker.onmessage = e => {
		promises[e.data[0]][e.data[1]](e.data[2]);
		promises[e.data[0]] = null;
	};

	return function(args) {
		return new Promise(function(resolve, reject) {
			promises[++currentId] = [resolve, reject];
			worker.postMessage([currentId, args]);
		});
	};
}
