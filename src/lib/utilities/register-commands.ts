import { envIsDefined, envParseString } from '@skyra/env-utilities';
import { applicationCommandRegistry } from '@skyra/http-framework';

export async function registerCommands() {
	if (envIsDefined('REGISTRY_GUILD_ID')) {
		await applicationCommandRegistry.pushAllCommandsInGuild(envParseString('REGISTRY_GUILD_ID'));
	} else {
		await applicationCommandRegistry.pushGlobalCommands();
	}
}
