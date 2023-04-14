import { parseAniListDescription } from '#lib/apis/anilist/anilist-constants';
import type { AnilistEntry } from '#lib/apis/anilist/anilist-types';
import { anilistMangaGet, anilistMangaSearch } from '#lib/apis/anilist/anilist-utilities';
import { kitsuMangaGet, kitsuMangaSearch, type KitsuManga } from '#lib/apis/kitsu/kitsu-utilities';
import { BrandingColors } from '#lib/common/constants';
import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { durationFormatter } from '#lib/utilities/duration-formatter';
import { buildMangaSubcommand, checkIsKitsuSubcommand } from '#lib/utilities/search-command-helpers';
import { minutes } from '#lib/utilities/time-utilities';
import { EmbedBuilder, TimestampStyles, bold, hideLinkEmbed, hyperlink, time } from '@discordjs/builders';
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

@RegisterCommand((builder) => applyLocalizedBuilder(builder, LanguageKeys.Common.MangaName, LanguageKeys.Common.MangaDescription))
export class UserCommand extends Command {
	public override autocompleteRun(interaction: Command.AutocompleteInteraction, options: AutocompleteInteractionArguments<Options>) {
		switch (options.subCommand as 'kitsu' | 'anilist') {
			case 'kitsu':
				return this.kitsuAutocompleteRun(interaction, options);
			case 'anilist':
				return this.aniListAutocompleteRun(interaction, options);
		}
	}

	@RegisterSubCommand(buildMangaSubcommand('kitsu'))
	@RegisterSubCommand(buildMangaSubcommand('anilist'))
	public async sharedRun(interaction: Command.ChatInputInteraction, { manga, subCommand }: InteractionArguments<Options>) {
		const isKitsuSubcommand = checkIsKitsuSubcommand(subCommand);

		const result = isKitsuSubcommand ? await kitsuMangaGet(manga) : await anilistMangaGet(manga);
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

	private buildKitsuResponse(kitsuManga: KitsuManga, interaction: Command.ChatInputInteraction) {
		const t = getSupportedLanguageT(interaction);

		const description =
			// Prefer the synopsis
			kitsuManga.synopsis ||
			// Then prefer the English description
			kitsuManga.description?.en ||
			// Then prefer the English-us description
			kitsuManga.description?.en_us ||
			// Then prefer the latinized Japanese description
			kitsuManga.description?.en_jp ||
			// Then the description in kanji / hiragana / katakana
			kitsuManga.description?.ja_jp ||
			// If all fails just get the first key of the description
			kitsuManga.description?.[Object.keys(kitsuManga.description!)[0]];
		const synopsis = description ? cutText(description.replace(/(.+)[\r\n\t](.+)/gim, '$1 $2').split('\r\n')[0], 750) : null;
		const score = `${kitsuManga.averageRating}%`;
		const mangaURL = `https://kitsu.io/manga/${kitsuManga.id}`;
		const type = kitsuManga.subtype;
		const title = kitsuManga.titles.en || kitsuManga.titles.en_jp || kitsuManga.titles.canonical;

		const englishTitle = kitsuManga.titles.en || kitsuManga.titles.en_us || t(LanguageKeys.Common.None);
		const japaneseTitle = kitsuManga.titles.ja_jp || t(LanguageKeys.Common.None);
		const canonicalTitle = kitsuManga.titles.canonical || t(LanguageKeys.Common.None);

		const embedData = t(LanguageKeys.Commands.Kitsu.Manga.EmbedData);

		const embed = new EmbedBuilder()
			.setTitle(title)
			.setURL(mangaURL)
			.setColor(BrandingColors.Primary)
			.setDescription(
				t(LanguageKeys.Commands.Kitsu.Manga.OutputDescription, {
					englishTitle,
					japaneseTitle,
					canonicalTitle,
					synopsis: synopsis ?? t(LanguageKeys.Common.NoSynopsis)
				})
			)
			.setThumbnail(kitsuManga.poster || '')
			.addFields(
				{
					name: embedData.type,
					value: t(LanguageKeys.Commands.Kitsu.Manga.Types)[type.toLowerCase()] || type,
					inline: true
				},
				{
					name: embedData.score,
					value: score,
					inline: true
				},
				{
					name: embedData.ageRating,
					value: kitsuManga.ageRating ? kitsuManga.ageRating : t(LanguageKeys.Common.None),
					inline: true
				},
				{
					name: embedData.firstPublishDate,
					value: time(kitsuManga.startDate, TimestampStyles.ShortDate),
					inline: true
				},
				{
					name: embedData.readIt,
					value: bold(hyperlink(title, hideLinkEmbed(mangaURL))),
					inline: true
				}
			)
			.setFooter({ text: '© kitsu.io' })
			.toJSON();

		return { embeds: [embed] };
	}

	private buildAnilistResponse(value: AnilistEntry, interaction: Command.ChatInputInteraction) {
		const embed = new EmbedBuilder();

		const t = getSupportedLanguageT(interaction);

		const anilistTitles = t(LanguageKeys.Commands.AniList.EmbedTitles);
		const description = [
			`**${anilistTitles.romajiName}**: ${value.title?.romaji || t(LanguageKeys.Common.None)}`,
			`**${anilistTitles.englishName}**: ${value.title?.english || t(LanguageKeys.Common.None)}`,
			`**${anilistTitles.nativeName}**: ${value.title?.native || t(LanguageKeys.Common.None)}`
		];

		if (value.countryOfOrigin) {
			description.push(`${bold(anilistTitles.countryOfOrigin)}: ${value.countryOfOrigin}`);
		}

		if (value.chapters) {
			description.push(`${bold(anilistTitles.chapters)}: ${t(LanguageKeys.Common.FormatNumber, { value: value.chapters })}`);
		}

		if (value.volumes) {
			description.push(`${bold(anilistTitles.volumes)}: ${t(LanguageKeys.Common.FormatNumber, { value: value.volumes })}`);
		}

		if (value.duration) {
			description.push(`${bold(anilistTitles.episodeLength)}: ${durationFormatter.format(minutes(value.duration), 1)}`);
		}

		if (value.externalLinks?.length) {
			const externalLinks = value.externalLinks
				.map((link) => (link?.url && link.site ? hyperlink(link.site, hideLinkEmbed(link.url)) : undefined))
				.filter(filterNullish);

			description.push(`${bold(anilistTitles.externalLinks)}: ${t(LanguageKeys.Common.FormatList, { value: externalLinks })}`);
		}

		if (value.description) {
			description.push('', parseAniListDescription(value.description));
		}

		if (value.siteUrl) {
			embed.setURL(value.siteUrl);
		}

		return {
			embeds: [
				embed
					.setColor(BrandingColors.Primary)
					.setTitle(value.title?.english ?? value.title?.romaji ?? value.title?.native ?? '') //
					.setDescription(description.join('\n'))
					.setImage(`https://img.anili.st/media/${value.id}`)
					.toJSON()
			]
		};
	}

	private async kitsuAutocompleteRun(interaction: Command.AutocompleteInteraction, options: AutocompleteInteractionArguments<Options>) {
		const result = await kitsuMangaSearch(options.manga);
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
		const result = await anilistMangaSearch(options.manga);
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
		return { content: resolveKey(interaction, LanguageKeys.Common.MangaError), flags: MessageFlags.Ephemeral };
	}
}

interface Options {
	manga: string;
}
