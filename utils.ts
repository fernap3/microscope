let crypto2 = require("crypto");
let getRandomValues = require("get-random-values");

export function guid()
{
	return ((<any>[1e7])+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, (c: any) =>
		(c ^ getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
	)
}

export function log(req: any, text: string)
{
	const userId = req && req.session && req.session.userId ? req.session.userId : null;
	console.log(`userid:${userId} ${text}`);
}

export function generateSalt()
{
	return crypto2.randomBytes(16).toString("hex");
}

export function hashPassword(salt: string, password: string)
{
	return crypto2.createHash('sha256').update(salt + password).digest("hex");
}
