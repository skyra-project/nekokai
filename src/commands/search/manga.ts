import { anilistMangaGet, anilistMangaSearch } from '#lib/apis/anilist/anilist-utilities';
import { kitsuMangaGet, kitsuMangaSearch } from '#lib/apis/kitsu/kitsu-utilities';
import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { AnimeCommand } from '#lib/structures/AnimeCommand';
import { buildMangaSubcommand, checkIsKitsuSubcommand } from '#lib/utilities/search-command-helpers';
import { isNullishOrEmpty } from '@sapphire/utilities';
import { Command, RegisterCommand, RegisterSubCommand } from '@skyra/http-framework';
import { applyLocalizedBuilder, getSupportedLanguageT } from '@skyra/http-framework-i18n';

@RegisterCommand((builder) => applyLocalizedBuilder(builder, LanguageKeys.Common.MangaName, LanguageKeys.Common.MangaDescription))
export class UserCommand extends AnimeCommand<'manga'> {
	@RegisterSubCommand(buildMangaSubcommand('kitsu'))
	@RegisterSubCommand(buildMangaSubcommand('anilist'))
	public async sharedRun(interaction: Command.ChatInputInteraction, { manga, subCommand }: AnimeCommand.Arguments<'manga'>) {
		const isKitsuSubcommand = checkIsKitsuSubcommand(subCommand);

		const result = isKitsuSubcommand ? await kitsuMangaGet(manga) : await anilistMangaGet(manga);
		const response = result.match({
			ok: (value) =>
				isNullishOrEmpty(value) //
					? this.createErrorResponse(interaction)
					: checkIsKitsuSubcommand(subCommand, value!)
					? this.createKitsuResponse(value, 'manga', getSupportedLanguageT(interaction))
					: this.createAnilistResponse(value, getSupportedLanguageT(interaction)),
			err: () => this.createErrorResponse(interaction)
		});
		return interaction.reply(response);
	}

	protected override anilistAutocompleteFetch(options: AnimeCommand.AutocompleteArguments<'manga'>) {
		return anilistMangaSearch(options.manga);
	}

	protected override kitsuAutocompleteFetch(options: AnimeCommand.AutocompleteArguments<'manga'>) {
		return kitsuMangaSearch(options.manga);
	}
}
