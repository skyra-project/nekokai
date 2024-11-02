import { anilistAnimeGet, anilistAnimeSearch, handleAniListResult } from '#lib/anilist';
import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { AnimeCommand } from '#lib/structures/AnimeCommand';
import { Command, RegisterCommand } from '@skyra/http-framework';
import { applyLocalizedBuilder } from '@skyra/http-framework-i18n';
import { ApplicationIntegrationType, InteractionContextType } from 'discord-api-types/v10';

const Root = LanguageKeys.Commands.AniList;

@RegisterCommand((builder) =>
	applyLocalizedBuilder(builder, Root.Anime.RootName, Root.Anime.RootDescription)
		.setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
		.setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
		.addIntegerOption((option) => applyLocalizedBuilder(option, Root.Anime.OptionsAnime).setRequired(true).setAutocomplete(true))
		.addBooleanOption((option) => applyLocalizedBuilder(option, Root.OptionsHideDescription))
		.addBooleanOption((option) => applyLocalizedBuilder(option, Root.OptionsHide))
)
export class UserCommand extends AnimeCommand<'anime'> {
	public override async chatInputRun(interaction: Command.ChatInputInteraction, options: AnimeCommand.Arguments<'anime'>) {
		const response = handleAniListResult({
			interaction,
			result: await anilistAnimeGet(options.anime),
			kind: 'anime',
			hideDescription: options['hide-description'],
			hide: options.hide
		});

		return interaction.reply(response);
	}

	protected override autocompleteFetch(options: AnimeCommand.AutocompleteArguments<'anime'>) {
		return anilistAnimeSearch(options.anime);
	}
}
