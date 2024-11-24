/*import { thread } from "/Helpers/threads.js";

async function parallel(func, parameters) {
	const threadedFunction = thread(func);
	const promises = parameters.map(paramSet => threadedFunction(paramSet));
	return Promise.all(promises);
}

// Example function to test
async function exampleFunction(param1, param2) {
	return new Promise(resolve => {
		setTimeout(() => {
			resolve(`Result: ${param1}, ${param2}`);
		}, 1000);
	});
}

// Example usage
const params = [
	[1, 2],
	[3, 4],
	[5, 6]
];

parallel(exampleFunction, params).then(results => {
	console.log(results); // Should log correct results without undefined
});
*/