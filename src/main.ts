import { setup } from '#lib/setup/all';
import { envParseInteger, envParseString } from '@skyra/env-utilities';
import { Client } from '@skyra/http-framework';
import { init, load } from '@skyra/http-framework-i18n';
import { blue, blueBright, bold } from '@skyra/logger';
import { registerCommands } from '@skyra/shared-http-pieces';
import { createBanner } from '@skyra/start-banner';

setup();

await load(new URL('../src/locales', import.meta.url));
await init({ fallbackLng: 'en-US', returnNull: false, returnEmptyString: false, returnObjects: true });

const client = new Client();
await client.load();

void registerCommands();

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
