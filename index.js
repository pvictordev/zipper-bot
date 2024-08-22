const express = require("express");

const PORT = process.env.port || 4040;
const { handler } = require("./controller");
const app = express();

// middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("*", async (req, res) => {
	console.log(req.body);
	res.send(await handler(req, "POST"));
});

app.get("*", async (req, res) => {
	res.send(await handler(req, "GET"));
});

app.listen(PORT, function (err) {
	if (err) console.log(err);
	console.log("Server is listening on PORT", PORT);
});
