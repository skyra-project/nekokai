import { AnimeCommand } from '#lib/structures';
import { SlashCommandBuilder, SlashCommandUserOption } from '@discordjs/builders';
import { Collection } from '@discordjs/collection';
import { cutText } from '@sapphire/utilities';
import { RegisterCommand } from '@skyra/http-framework';
import { getT, loadedLocales, type TypedT } from '@skyra/http-framework-i18n';

export function createCommand(options: createCommand.Options): typeof AnimeCommand {
	const name = options.name ?? options.type;
	const locales = new Collection([...loadedLocales].map((locale) => [locale, getT(locale)]));

	const defaultT = locales.get('en-US');
	if (!defaultT) throw new TypeError('Could not find en-US locales');

	const localeCommandName = `commands/anime:${name}Name` as TypedT;
	const localeCommandDescription = `commands/anime:${name}Description` as TypedT;
	const builder = new SlashCommandBuilder()
		.setName(defaultT(localeCommandName))
		.setNameLocalizations(Object.fromEntries(locales.map((t, locale) => [locale, t(localeCommandName)])))
		.setDescription(defaultT(localeCommandDescription))
		.setDescriptionLocalizations(Object.fromEntries(locales.map((t, locale) => [locale, t(localeCommandDescription)])));

	if (options.user) {
		const userNameNamespaceOverride = options.userNameNamespaceOverride ?? 'common';
		const localeOptionNamespace = `${userNameNamespaceOverride}:${userNameNamespaceOverride === 'anime' ? name : 'user'}`;
		const localeOptionName = `commands/${localeOptionNamespace}OptionName` as TypedT;
		const localeOptionDescription = `commands/anime:${name}OptionDescription` as TypedT;
		const option = new SlashCommandUserOption()
			.setName(defaultT(localeOptionName))
			.setNameLocalizations(
				Object.fromEntries(
					locales.map(
						(
							t,
							locale //
						) => [locale, t(localeOptionName)]
					)
				)
			)
			.setDescription(cutText(defaultT(localeOptionDescription), 100))
			.setDescriptionLocalizations(
				Object.fromEntries(
					locales.map(
						(
							t,
							locale //
						) => [locale, cutText(t(localeOptionDescription), 100)]
					)
				)
			)
			.setRequired(options.userRequired ?? false);

		builder.addUserOption(option);
	}

	@RegisterCommand(builder)
	class UserAnimeCommand extends AnimeCommand {
		public constructor(context: AnimeCommand.Context) {
			super(context, { type: options.type });
		}
	}

	return UserAnimeCommand;
}

export namespace createCommand {
	export interface Options {
		name?: string;
		type: string;
		user?: boolean;
		userRequired?: boolean;
		userNameNamespaceOverride?: 'anime' | 'common';
	}
}
