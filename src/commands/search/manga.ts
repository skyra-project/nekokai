import { anilistMangaGet, anilistMangaSearch } from '#lib/apis/anilist/anilist-utilities';
import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { AnimeCommand } from '#lib/structures/AnimeCommand';
import { Command, RegisterCommand } from '@skyra/http-framework';
import { applyLocalizedBuilder } from '@skyra/http-framework-i18n';

const Root = LanguageKeys.Commands.AniList.Manga;

@RegisterCommand((builder) =>
	applyLocalizedBuilder(builder, Root.RootName, Root.RootDescription) //
		.addStringOption((option) => applyLocalizedBuilder(option, Root.OptionsManga).setRequired(true).setAutocomplete(true))
)
export class UserCommand extends AnimeCommand<'manga'> {
	public override async chatInputRun(interaction: Command.ChatInputInteraction, { manga }: AnimeCommand.Arguments<'manga'>) {
		return this.handleResult(interaction, await anilistMangaGet(manga), 'manga');
	}

	protected override autocompleteFetch(options: AnimeCommand.AutocompleteArguments<'manga'>) {
		return anilistMangaSearch(options.manga);
	}
}
