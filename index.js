const express = require("express");

const PORT = process.env.port || 4040;

const app = express();

app.post("*", async (req, res) => {
	res.send("Hello post");
});

app.get("*", async (req, res) => {
	res.send("Hello get");
});

app.listen(PORT, function (err) {
	if (err) console.log(err);
	console.log("Server is listening on PORT", PORT);
});
