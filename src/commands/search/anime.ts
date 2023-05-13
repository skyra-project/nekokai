import { anilistAnimeGet, anilistAnimeSearch } from '#lib/apis/anilist/anilist-utilities';
import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { AnimeCommand } from '#lib/structures/AnimeCommand';
import { Command, RegisterCommand } from '@skyra/http-framework';
import { applyLocalizedBuilder } from '@skyra/http-framework-i18n';

const Root = LanguageKeys.Commands.AniList.Anime;

@RegisterCommand((builder) =>
	applyLocalizedBuilder(builder, Root.RootName, Root.RootDescription) //
		.addStringOption((option) => applyLocalizedBuilder(option, Root.OptionsAnime).setRequired(true).setAutocomplete(true))
)
export class UserCommand extends AnimeCommand<'anime'> {
	public override async chatInputRun(interaction: Command.ChatInputInteraction, { anime }: AnimeCommand.Arguments<'anime'>) {
		return this.handleResult(interaction, await anilistAnimeGet(anime), 'anime');
	}

	protected override autocompleteFetch(options: AnimeCommand.AutocompleteArguments<'anime'>) {
		return anilistAnimeSearch(options.anime);
	}
}
