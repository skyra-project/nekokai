import { anilistAnimeGet, anilistAnimeSearch } from '#lib/apis/anilist/anilist-utilities';
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
		.addBooleanOption((option) => applyLocalizedBuilder(option, Root.OptionsHide))
)
export class UserCommand extends AnimeCommand<'anime'> {
	public override async chatInputRun(interaction: Command.ChatInputInteraction, { anime, hide }: AnimeCommand.Arguments<'anime'>) {
		return this.handleResult(interaction, await anilistAnimeGet(anime), 'anime', hide);
	}

	protected override autocompleteFetch(options: AnimeCommand.AutocompleteArguments<'anime'>) {
		return anilistAnimeSearch(options.anime);
	}
}
