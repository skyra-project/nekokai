import { anilistMangaGet, anilistMangaSearch } from '#lib/apis/anilist/anilist-utilities';
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
		.addBooleanOption((option) => applyLocalizedBuilder(option, Root.OptionsHide))
)
export class UserCommand extends AnimeCommand<'manga'> {
	public override async chatInputRun(interaction: Command.ChatInputInteraction, { manga, hide }: AnimeCommand.Arguments<'manga'>) {
		return this.handleResult(interaction, await anilistMangaGet(manga), 'manga', hide);
	}

	protected override autocompleteFetch(options: AnimeCommand.AutocompleteArguments<'manga'>) {
		return anilistMangaSearch(options.manga);
	}
}
