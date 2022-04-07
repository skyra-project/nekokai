import { envParseNumber, envParseString, setup } from '@skyra/env-wrapper';
import { Client } from '@skyra/http-framework';
import { createBanner } from '@skyra/start-banner';
import { blue, red, redBright } from 'colorette';

setup(import.meta.url);

const client = new Client();
await client.load();

// await registerCommands();

const address = envParseString('HTTP_ADDRESS', '0.0.0.0');
const port = envParseNumber('HTTP_PORT', 3000);
await client.listen({ address, port });

console.log(
	createBanner({
		logo: [
			blue(String.raw`             (`),
			blue(String.raw`            (((((`),
			blue(String.raw`       ${red('*')}${redBright(',')}/((((((((((((((((     (`),
			blue(String.raw`    ${red('****')}${redBright(',')}/(((((((((((((((((((((`),
			blue(String.raw`   ${red('*****')}${redBright(',')}/((((       ((((((((((`),
			blue(String.raw`  (${red('*****')}${redBright(',')}/               ((((((((`),
			blue(String.raw` ((${red('*****')}${redBright(',')}(                ((((((((`),
			blue(String.raw` ((${red('*****')}${redBright(',')}(                 (((((((`),
			blue(String.raw` ((${red('*****')}${redBright(',')}(                 (((((((`),
			blue(String.raw` ((${red('*****')}${redBright(',')}(                 (((((((`),
			blue(String.raw`  (${red('*****')}${redBright(',')}/               ((((((((`),
			blue(String.raw`   ${red('*****')}${redBright(',')}/(((         ((((((((((`),
			blue(String.raw`   &${red('****')}${redBright(',')}/((((((((((((((((((((`),
			blue(String.raw`      ${red('**')}${redBright(',')}/(((((((((((((((((`),
			blue(String.raw`            #(((((((((`)
		],
		name: [
			blue(String.raw`            _         _         _ `),
			blue(String.raw` _ __   ___| | _____ | | ____ _(_)`),
			blue(String.raw`| '_ \ / _ \ |/ / _ \| |/ / _\` | |`),
			blue(String.raw`| | | |  __/   < (_) |   < (_| | |`),
			blue(String.raw`|_| |_|\___|_|\_\___/|_|\_\__,_|_|`)
		],
		extra: [`Listening on ${address}:${port}`]
	})
);
