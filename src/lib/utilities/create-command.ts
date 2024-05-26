import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { WeebCommand } from '#lib/structures/WeebCommand';
import { SlashCommandBuilder } from '@discordjs/builders';
import { isNullish } from '@sapphire/utilities';
import { RegisterCommand } from '@skyra/http-framework';
import { applyLocalizedBuilder } from '@skyra/http-framework-i18n';

export function createCommand(options: createCommand.Options): typeof WeebCommand {
	const name = new URL(options.path).searchParams.get('name');
	if (isNullish(name)) throw new TypeError('The provided path lacks of a "name" querystring parameter.');

	const builder = applyLocalizedBuilder(
		new SlashCommandBuilder(),
		LanguageKeys.Commands.Anime.CommandName(name),
		LanguageKeys.Commands.Anime.CommandDescription(name)
	);

	if (options.user) {
		builder.addUserOption((builder) =>
			applyLocalizedBuilder(builder, LanguageKeys.Commands.Anime.UserOptionName, LanguageKeys.Commands.Anime.OptionDescription(name)) //
				.setRequired(options.userRequired ?? false)
		);
	}

	const type = options.type ?? name;

	@RegisterCommand(builder)
	class UserAnimeCommand extends WeebCommand {
		public constructor(context: WeebCommand.LoaderContext) {
			super(context, { type });
		}
	}

	return UserAnimeCommand;
}

export namespace createCommand {
	export interface Options {
		path: string;
		type?: string;
		user?: boolean;
		userRequired?: boolean;
	}
}
