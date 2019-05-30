import * as dotenv from "dotenv";
// Load configuration settings from the .env file in the same directory as this script
dotenv.config();
import * as path from "path";
import * as express from "express";
import * as compression from "compression";
import * as bodyParser from "body-parser";
// import * as expressHandlebars from "express-handlebars";
import * as utils from "./utils";

// const handlebars = expressHandlebars.create();

// Let the process crash on unhandled promises
process.on('unhandledRejection', err => { throw err; });

const app = express();

if (app.settings.env === "production")
{
	// Redirect http to https in production only
	app.use((req, res, next) => {
		if (req.header("x-forwarded-proto") !== "https")
			res.redirect(`https://${req.header("host")}${req.url}`);
		else
			next();
	});
}

app.use(compression());
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(bodyParser.text());

// app.get("/", async (req, res, next) =>
// {
// 	const html = await handlebars.render("src/webclient/index.handlebars", {});
// 	res.send(html);
// });

// app.get("/service-worker.js", (req, res, next) => res.sendFile(path.resolve("src/webclient/service-worker.js")));

app.use("/", express.static("static"));

// Start the webserver
app.listen(process.env.PORT || 8080, () => {
	console.log(`Listening at port ${process.env.PORT}`);
});
