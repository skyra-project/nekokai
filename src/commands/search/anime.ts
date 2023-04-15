import { anilistAnimeGet, anilistAnimeSearch } from '#lib/apis/anilist/anilist-utilities';
import { kitsuAnimeGet, kitsuAnimeSearch } from '#lib/apis/kitsu/kitsu-utilities';
import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { AnimeCommand } from '#lib/structures/AnimeCommand';
import { buildAnimeSubcommand, checkIsKitsuSubcommand } from '#lib/utilities/search-command-helpers';
import { isNullishOrEmpty } from '@sapphire/utilities';
import { Command, RegisterCommand, RegisterSubCommand } from '@skyra/http-framework';
import { applyLocalizedBuilder, getSupportedLanguageT } from '@skyra/http-framework-i18n';

@RegisterCommand((builder) => applyLocalizedBuilder(builder, LanguageKeys.Common.AnimeName, LanguageKeys.Common.AnimeDescription))
export class UserCommand extends AnimeCommand<'anime'> {
	@RegisterSubCommand(buildAnimeSubcommand('kitsu'))
	@RegisterSubCommand(buildAnimeSubcommand('anilist'))
	public async sharedRun(interaction: Command.ChatInputInteraction, { subCommand, anime }: AnimeCommand.Arguments<'anime'>) {
		const isKitsuSubcommand = checkIsKitsuSubcommand(subCommand);

		const result = isKitsuSubcommand ? await kitsuAnimeGet(anime) : await anilistAnimeGet(anime);
		const response = result.match({
			ok: (value) =>
				isNullishOrEmpty(value) //
					? this.createErrorResponse(interaction)
					: checkIsKitsuSubcommand(subCommand, value!)
					? this.createKitsuResponse(value, 'anime', getSupportedLanguageT(interaction))
					: this.createAnilistResponse(value, getSupportedLanguageT(interaction)),
			err: () => this.createErrorResponse(interaction)
		});
		return interaction.reply(response);
	}

	protected override anilistAutocompleteFetch(options: AnimeCommand.AutocompleteArguments<'anime'>) {
		return anilistAnimeSearch(options.anime);
	}

	protected override kitsuAutocompleteFetch(options: AnimeCommand.AutocompleteArguments<'anime'>) {
		return kitsuAnimeSearch(options.anime);
	}
}
