import type { IntegerString } from '@skyra/env-utilities';

declare module '@skyra/env-utilities' {
	interface Env {
		CLIENT_VERSION: string;

		HTTP_ADDRESS: string;
		HTTP_PORT: IntegerString;

		WEEB_SH_TOKEN: string;
	}
}
