import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { AnimeCommand } from '#lib/structures';
import { SlashCommandBuilder, SlashCommandUserOption } from '@discordjs/builders';
import { Collection } from '@discordjs/collection';
import { RegisterCommand } from '@skyra/http-framework';
import { getT, loadedLocales } from '@skyra/http-framework-i18n';

export function createCommand(options: createCommand.Options): typeof AnimeCommand {
	const name = options.name ?? options.type;
	const locales = new Collection([...loadedLocales].map((locale) => [locale, getT(locale)]));

	const defaultT = locales.get('en-US');
	if (!defaultT) throw new TypeError('Could not find en-US locales');

	const localeCommandName = LanguageKeys.Commands.Anime.CommandName(name);
	const localeCommandDescription = LanguageKeys.Commands.Anime.CommandDescription(name);
	const builder = new SlashCommandBuilder()
		.setName(defaultT(localeCommandName))
		.setNameLocalizations(Object.fromEntries(locales.map((t, locale) => [locale, t(localeCommandName)])))
		.setDescription(defaultT(localeCommandDescription))
		.setDescriptionLocalizations(Object.fromEntries(locales.map((t, locale) => [locale, t(localeCommandDescription)])));

	if (options.user) {
		const localeOptionName = LanguageKeys.Common.UserOptionName;
		const localeOptionDescription = LanguageKeys.Commands.Anime.OptionDescription(name);

		const option = new SlashCommandUserOption()
			.setName(defaultT(localeOptionName))
			.setNameLocalizations(Object.fromEntries(locales.map((t, locale) => [locale, t(localeOptionName)])))
			.setDescription(defaultT(localeOptionDescription))
			.setDescriptionLocalizations(Object.fromEntries(locales.map((t, locale) => [locale, t(localeOptionDescription)])))
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
	}
}
