function erroHandler(error, name, from) {
	let loggerFunction = console.log;

	// if ((process.env.ENV = "PROD")) {
	// 	// we can have a different logger if needed
	// }

	loggerFunction("---START---");
	loggerFunction("Error occured in " + name);
	if (from === "axios") {
		if (error.response) {
			loggerFunction(error.response.data);
			loggerFunction(error.response.status);
			loggerFunction(error.response.header);
		}
	} else if (error.request) {
		loggerFunction(error.request);
	} else {
		loggerFunction("Error", error.message);
	}
	loggerFunction("---END---");
}

module.exports = {
	erroHandler,
};
