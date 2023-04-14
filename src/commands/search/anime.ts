import { parseAniListDescription } from '#lib/apis/anilist/anilist-constants';
import type { AnilistEntry } from '#lib/apis/anilist/anilist-types';
import { anilistAnimeGet, anilistAnimeSearch } from '#lib/apis/anilist/anilist-utilities';
import { kitsuAnimeGet, kitsuAnimeSearch, type KitsuAnime } from '#lib/apis/kitsu/kitsu-utilities';
import { BrandingColors } from '#lib/common/constants';
import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { durationFormatter } from '#lib/utilities/duration-formatter';
import { buildAnimeSubcommand, checkIsKitsuSubcommand } from '#lib/utilities/search-command-helpers';
import { minutes } from '#lib/utilities/time-utilities';
import { EmbedBuilder, TimestampStyles, bold, hideLinkEmbed, hyperlink, time } from '@discordjs/builders';
import { Time } from '@sapphire/time-utilities';
import { cutText, filterNullish, isNullishOrEmpty } from '@sapphire/utilities';
import {
	Command,
	RegisterCommand,
	RegisterSubCommand,
	type AutocompleteInteractionArguments,
	type InteractionArguments
} from '@skyra/http-framework';
import { applyLocalizedBuilder, getSupportedLanguageT, resolveKey } from '@skyra/http-framework-i18n';
import { MessageFlags } from 'discord-api-types/v10';

@RegisterCommand((builder) => applyLocalizedBuilder(builder, LanguageKeys.Common.AnimeName, LanguageKeys.Common.AnimeDescription))
export class UserCommand extends Command {
	public override async autocompleteRun(interaction: Command.AutocompleteInteraction, options: AutocompleteInteractionArguments<Options>) {
		switch (options.subCommand as 'kitsu' | 'anilist') {
			case 'kitsu':
				return this.kitsuAutocompleteRun(interaction, options);
			case 'anilist':
				return this.aniListAutocompleteRun(interaction, options);
		}
	}

	@RegisterSubCommand(buildAnimeSubcommand('kitsu'))
	@RegisterSubCommand(buildAnimeSubcommand('anilist'))
	public async sharedRun(interaction: Command.ChatInputInteraction, { subCommand, anime }: InteractionArguments<Options>) {
		const isKitsuSubcommand = checkIsKitsuSubcommand(subCommand);

		const result = isKitsuSubcommand ? await kitsuAnimeGet(anime) : await anilistAnimeGet(anime);
		const response = result.match({
			ok: (value) =>
				isNullishOrEmpty(value) //
					? this.handleError(interaction)
					: checkIsKitsuSubcommand(subCommand, value!)
					? this.buildKitsuResponse(value, interaction)
					: this.buildAnilistResponse(value, interaction),
			err: () => this.handleError(interaction)
		});
		return interaction.reply(response);
	}

	private buildKitsuResponse(kitsuAnime: KitsuAnime, interaction: Command.ChatInputInteraction) {
		const t = getSupportedLanguageT(interaction);

		const description =
			// Prefer the synopsis
			kitsuAnime.synopsis ||
			// Then prefer the English description
			kitsuAnime.description?.en ||
			// Then prefer the English-us description
			kitsuAnime.description?.en_us ||
			// Then prefer the latinized Japanese description
			kitsuAnime.description?.en_jp ||
			// Then the description in kanji / hiragana / katakana
			kitsuAnime.description?.ja_jp ||
			// If all fails just get the first key of the description
			kitsuAnime.description?.[Object.keys(kitsuAnime.description!)[0]];
		const synopsis = description ? cutText(description.replace(/(.+)[\r\n\t](.+)/gim, '$1 $2').split('\r\n')[0], 750) : null;
		const score = `${kitsuAnime.averageRating}%`;
		const animeURL = `https://kitsu.io/anime/${kitsuAnime.id}`;
		const type = kitsuAnime.subtype;
		const title = kitsuAnime.titles.en || kitsuAnime.titles.en_jp || kitsuAnime.titles.canonical;

		const englishTitle = kitsuAnime.titles.en || kitsuAnime.titles.en_us || t(LanguageKeys.Common.None);
		const japaneseTitle = kitsuAnime.titles.ja_jp || t(LanguageKeys.Common.None);
		const canonicalTitle = kitsuAnime.titles.canonical || t(LanguageKeys.Common.None);

		const embedData = t(LanguageKeys.Commands.Kitsu.Anime.EmbedData);

		const embed = new EmbedBuilder()
			.setColor(BrandingColors.Primary)
			.setTitle(title)
			.setURL(animeURL)
			.setDescription(
				t(LanguageKeys.Commands.Kitsu.Anime.OutputDescription, {
					englishTitle,
					japaneseTitle,
					canonicalTitle,
					synopsis: synopsis ?? t(LanguageKeys.Common.NoSynopsis)
				})
			)
			.setThumbnail(kitsuAnime.poster || '')
			.addFields(
				{
					name: embedData.type,
					value: t(LanguageKeys.Commands.Kitsu.Anime.Types)[type.toLowerCase()] || type,
					inline: true
				},
				{
					name: embedData.score,
					value: score,
					inline: true
				},
				{
					name: embedData.episodes,
					value: kitsuAnime.episodeCount ? t(LanguageKeys.Common.FormatNumber, { value: kitsuAnime.episodeCount }) : embedData.stillAiring,
					inline: true
				},
				{
					name: embedData.episodeLength,
					value: kitsuAnime.episodeLength ? durationFormatter.format(kitsuAnime.episodeLength * Time.Minute) : t(LanguageKeys.Common.None),
					inline: true
				},
				{
					name: embedData.ageRating,
					value: kitsuAnime.ageRating ? kitsuAnime.ageRating : t(LanguageKeys.Common.None),
					inline: true
				},
				{
					name: embedData.firstAirDate,
					value: time(new Date(kitsuAnime.startDate), TimestampStyles.ShortDate),
					inline: true
				},
				{
					name: embedData.watchIt,
					value: bold(hyperlink(title, hideLinkEmbed(animeURL))),
					inline: true
				}
			)
			.setFooter({ text: '© kitsu.io' })
			.toJSON();

		return { embeds: [embed] };
	}

	private buildAnilistResponse(anilistAnime: AnilistEntry, interaction: Command.ChatInputInteraction) {
		const embed = new EmbedBuilder();

		const t = getSupportedLanguageT(interaction);

		const anilistTitles = t(LanguageKeys.Commands.AniList.EmbedTitles);

		const englishTitle = anilistAnime.title?.english || t(LanguageKeys.Common.None);
		const nativeTitle = anilistAnime.title?.native || t(LanguageKeys.Common.None);
		const romajiTitle = anilistAnime.title?.romaji || t(LanguageKeys.Common.None);

		const description = [
			`**${anilistTitles.romajiName}**: ${romajiTitle}`,
			`**${anilistTitles.englishName}**: ${englishTitle}`,
			`**${anilistTitles.nativeName}**: ${nativeTitle}`
		];

		if (anilistAnime.countryOfOrigin) {
			description.push(`${bold(anilistTitles.countryOfOrigin)}: ${anilistAnime.countryOfOrigin}`);
		}

		if (anilistAnime.episodes) {
			description.push(`${bold(anilistTitles.episodes)}: ${t(LanguageKeys.Common.FormatNumber, { value: anilistAnime.episodes })}`);
		}

		if (anilistAnime.duration) {
			description.push(`${bold(anilistTitles.episodeLength)}: ${durationFormatter.format(minutes(anilistAnime.duration), 1)}`);
		}

		if (anilistAnime.externalLinks?.length) {
			const externalLinks = anilistAnime.externalLinks
				.map((link) => {
					if (link?.url && link.site) {
						return hyperlink(link.site, hideLinkEmbed(link.url));
					}

					return undefined;
				})
				.filter(filterNullish);

			description.push(`${bold(anilistTitles.externalLinks)}: ${t(LanguageKeys.Common.FormatList, { value: externalLinks })}`);
		}

		if (anilistAnime.description) {
			description.push('', parseAniListDescription(anilistAnime.description));
		}

		if (anilistAnime.siteUrl) {
			embed.setURL(anilistAnime.siteUrl);
		}

		return {
			embeds: [
				embed
					.setColor(BrandingColors.Primary)
					.setTitle(anilistAnime.title?.english ?? anilistAnime.title?.romaji ?? anilistAnime.title?.native ?? '') //
					.setDescription(description.join('\n'))
					.setImage(`https://img.anili.st/media/${anilistAnime.id}`)
					.toJSON()
			]
		};
	}

	private async kitsuAutocompleteRun(interaction: Command.AutocompleteInteraction, options: AutocompleteInteractionArguments<Options>) {
		const result = await kitsuAnimeSearch(options.anime);
		const entries = result.match({
			ok: (values) => {
				return values.map((value) => {
					const name = cutText(value.titles.en || value.titles.en_us || value.titles.en_jp || value.titles.canonical, 100);
					return { name, value: name };
				});
			},
			err: () => []
		});

		return interaction.reply({ choices: entries });
	}

	private async aniListAutocompleteRun(interaction: Command.AutocompleteInteraction, options: AutocompleteInteractionArguments<Options>) {
		const result = await anilistAnimeSearch(options.anime);
		const entries = result.match({
			ok: (values) => {
				return values.map((value) => {
					const name = cutText(value.title.english || value.title.romaji || value.title.native || value.id.toString(), 100);
					return { name, value: name };
				});
			},
			err: () => []
		});

		return interaction.reply({ choices: entries });
	}

	private handleError(interaction: Command.ChatInputInteraction) {
		return { content: resolveKey(interaction, LanguageKeys.Common.AnimeError), flags: MessageFlags.Ephemeral };
	}
}

interface Options {
	anime: string;
}
