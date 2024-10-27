import '#lib/setup/logger';
import '#lib/setup/prisma';
import { setup as envRun } from '@skyra/env-utilities';
import { initializeSentry, setInvite, setRepository } from '@skyra/shared-http-pieces';

import '@skyra/shared-http-pieces/register';

export function setup() {
	envRun(new URL('../../../src/.env', import.meta.url));

	setRepository('nekokai');
	setInvite('939613684592934992', '16384');
	initializeSentry();
}
