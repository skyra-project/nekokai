import { anilistMangaGet, anilistMangaSearch, handleAniListResult } from '#lib/anilist';
import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { AnimeCommand } from '#lib/structures/AnimeCommand';
import { Command, RegisterCommand } from '@skyra/http-framework';
import { applyLocalizedBuilder } from '@skyra/http-framework-i18n';
import { ApplicationIntegrationType, InteractionContextType } from 'discord-api-types/v10';

const Root = LanguageKeys.Commands.AniList;

@RegisterCommand((builder) =>
	applyLocalizedBuilder(builder, Root.Manga.RootName, Root.Manga.RootDescription)
		.setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
		.setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
		.addIntegerOption((option) => applyLocalizedBuilder(option, Root.Manga.OptionsManga).setRequired(true).setAutocomplete(true))
		.addBooleanOption((option) => applyLocalizedBuilder(option, Root.OptionsHideDescription))
		.addBooleanOption((option) => applyLocalizedBuilder(option, Root.OptionsHide))
)
export class UserCommand extends AnimeCommand<'manga'> {
	public override async chatInputRun(interaction: Command.ChatInputInteraction, options: AnimeCommand.Arguments<'manga'>) {
		const response = handleAniListResult({
			interaction,
			result: await anilistMangaGet(options.manga),
			kind: 'manga',
			hideDescription: options['hide-description'],
			hide: options.hide
		});

		return interaction.reply(response);
	}

	protected override autocompleteFetch(options: AnimeCommand.AutocompleteArguments<'manga'>) {
		return anilistMangaSearch(options.manga);
	}
}
