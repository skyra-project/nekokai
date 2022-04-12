import { envParseInteger, envParseString, setup } from '@skyra/env-utilities';
import { Client } from '@skyra/http-framework';
import { createBanner } from '@skyra/start-banner';
import { blue, blueBright, bold } from 'colorette';

// import '@skyra/shared-http-pieces/register';

setup(new URL('../src/.env', import.meta.url));

const client = new Client();
await client.load();

// await registerCommands();

const address = envParseString('HTTP_ADDRESS', '0.0.0.0');
const port = envParseInteger('HTTP_PORT', 3000);
await client.listen({ address, port });

console.log(
	createBanner({
		logo: [
			bold(blueBright('      ::::    :::')),
			bold(blueBright('     :+:+:   :+:')),
			blueBright('    :+:+:+  +:+'),
			blueBright('   +#+ +:+ +#+'),
			blue('  +#+  +#+#+#'),
			blue(' #+#   #+#+#'),
			blue('###    ####')
		],
		name: [
			blue(String.raw`     __     _         _         _`),
			blue(String.raw`  /\ \ \___| | _____ | | ____ _(_)`),
			blue(String.raw` /  \/ / _ \ |/ / _ \| |/ / _' | |`),
			blue(String.raw`/ /\  /  __/   < (_) |   < (_| | |`),
			blue(String.raw`\_\ \/ \___|_|\_\___/|_|\_\__,_|_|`)
		],
		extra: [`Listening on ${address}:${port}`]
	})
);
