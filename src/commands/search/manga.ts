import { fetchAniListApi, getManga, parseAniListDescription } from '#lib/apis/anilist/anilist-constants';
import type { Media } from '#lib/apis/anilist/anilist-types';
import type { Kitsu } from '#lib/apis/kitsu/kitsu-types';
import { fetchKitsuApi } from '#lib/apis/kitsu/kitsu-constants';
import { BrandingColors } from '#lib/common/constants';
import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { RedisKeys } from '#lib/redis-cache/RedisCacheClient';
import { durationFormatter } from '#lib/utilities/duration-formatter';
import { buildMangaSubcommand, checkIsKitsuSubcommand } from '#lib/utilities/search-command-helpers';
import { minutes } from '#lib/utilities/time-utilities';
import { bold, EmbedBuilder, hideLinkEmbed, hyperlink, time, TimestampStyles } from '@discordjs/builders';
import { cutText, filterNullish, isNullish, isNullishOrEmpty } from '@sapphire/utilities';
import { AutocompleteInteractionArguments, Command, InteractionArguments, RegisterCommand, RegisterSubCommand } from '@skyra/http-framework';
import { applyLocalizedBuilder, getSupportedLanguageT, resolveKey } from '@skyra/http-framework-i18n';
import type { APIApplicationCommandOptionChoice } from 'discord-api-types/v10';

@RegisterCommand((builder) => applyLocalizedBuilder(builder, LanguageKeys.Common.MangaName, LanguageKeys.Common.MangaDescription))
export class UserCommand extends Command {
	public override autocompleteRun(autocompleteInteraction: Command.AutocompleteInteraction, options: AutocompleteInteractionArguments<Options>) {
		if (!options.subCommand || options.focused !== 'manga' || isNullishOrEmpty(options.manga)) {
			return this.autocompleteNoResults();
		}

		switch (options.subCommand as 'kitsu' | 'anilist') {
			case 'kitsu':
				return this.kitsuAutocompleteRun(autocompleteInteraction, options);
			case 'anilist':
				return this.aniListAutocompleteRun(autocompleteInteraction, options);
		}
	}

	@RegisterSubCommand(buildMangaSubcommand('kitsu'))
	@RegisterSubCommand(buildMangaSubcommand('anilist'))
	public async *sharedRun(interaction: Command.Interaction, { manga, subCommand }: InteractionArguments<Options>): Command.AsyncGeneratorResponse {
		const isKitsuSubcommand = checkIsKitsuSubcommand(subCommand);

		const [, packageFromAutocomplete, nthResult] = manga.split(':');
		const hitFromRedisCache = await this.container.redisCache.fetch<Kitsu.KitsuHit | Media>(
			isKitsuSubcommand ? RedisKeys.KitsuManga : RedisKeys.AnilistManga,
			interaction.user?.id,
			packageFromAutocomplete,
			nthResult
		);

		if (hitFromRedisCache) {
			return this.message(
				isKitsuSubcommand
					? this.buildKitsuResponse(hitFromRedisCache as Kitsu.KitsuHit, interaction)
					: this.buildAnilistResponse(hitFromRedisCache as Media, interaction)
			);
		}

		yield this.defer();
		const result = isKitsuSubcommand
			? await fetchKitsuApi('manga', packageFromAutocomplete ?? manga, 1)
			: await fetchAniListApi(getManga, { search: manga });

		const response = result.match({
			ok: (value) => {
				if (checkIsKitsuSubcommand(subCommand, value)) {
					return isNullishOrEmpty(value.hits) //
						? this.handleError(interaction)
						: this.buildKitsuResponse(value.hits[0], interaction);
				}

				return isNullishOrEmpty(value.data.Page.media) //
					? this.handleError(interaction)
					: this.buildAnilistResponse(value.data.Page.media[0]!, interaction);
			},
			err: () => this.handleError(interaction)
		});

		return this.updateResponse(response);
	}

	private buildKitsuResponse(kitsuHit: Kitsu.KitsuHit, interaction: Command.Interaction): Command.MessageResponseOptions {
		const t = getSupportedLanguageT(interaction);

		const description =
			// Prefer the synopsis
			kitsuHit.synopsis ||
			// Then prefer the English description
			kitsuHit.description?.en ||
			// Then prefer the English-us description
			kitsuHit.description?.en_us ||
			// Then prefer the latinized Japanese description
			kitsuHit.description?.en_jp ||
			// Then the description in kanji / hiragana / katakana
			kitsuHit.description?.ja_jp ||
			// If all fails just get the first key of the description
			kitsuHit.description?.[Object.keys(kitsuHit.description!)[0]];
		const synopsis = description ? cutText(description.replace(/(.+)[\r\n\t](.+)/gim, '$1 $2').split('\r\n')[0], 750) : null;
		const score = `${kitsuHit.averageRating}%`;
		const mangaURL = `https://kitsu.io/manga/${kitsuHit.id}`;
		const type = kitsuHit.subtype;
		const title = kitsuHit.titles.en || kitsuHit.titles.en_jp || kitsuHit.canonicalTitle || '--';

		const englishTitle = kitsuHit.titles.en || kitsuHit.titles.en_us || t(LanguageKeys.Common.None);
		const japaneseTitle = kitsuHit.titles.ja_jp || t(LanguageKeys.Common.None);
		const canonicalTitle = kitsuHit.canonicalTitle || t(LanguageKeys.Common.None);

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
			.setThumbnail(kitsuHit.posterImage?.original || '')
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
					value: kitsuHit.ageRating ? kitsuHit.ageRating : t(LanguageKeys.Common.None),
					inline: true
				},
				{
					name: embedData.firstPublishDate,
					value: time(kitsuHit.startDate, TimestampStyles.ShortDate),
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

	private buildAnilistResponse(media: Media, interaction: Command.Interaction): Command.MessageResponseOptions {
		const embed = new EmbedBuilder();

		const t = getSupportedLanguageT(interaction);

		const anilistTitles = t(LanguageKeys.Commands.AniList.EmbedTitles);

		const englishTitle = media.title?.english || t(LanguageKeys.Common.None);
		const nativeTitle = media.title?.native || t(LanguageKeys.Common.None);
		const romajiTitle = media.title?.romaji || t(LanguageKeys.Common.None);

		const description = [
			`**${anilistTitles.romajiName}**: ${romajiTitle}`,
			`**${anilistTitles.englishName}**: ${englishTitle}`,
			`**${anilistTitles.nativeName}**: ${nativeTitle}`
		];

		if (media.countryOfOrigin) {
			description.push(`${bold(anilistTitles.countryOfOrigin)}: ${media.countryOfOrigin}`);
		}

		if (media.chapters) {
			description.push(`${bold(anilistTitles.chapters)}: ${t(LanguageKeys.Common.FormatNumber, { value: media.chapters })}`);
		}

		if (media.volumes) {
			description.push(`${bold(anilistTitles.volumes)}: ${t(LanguageKeys.Common.FormatNumber, { value: media.volumes })}`);
		}

		if (media.duration) {
			description.push(`${bold(anilistTitles.episodeLength)}: ${durationFormatter.format(minutes(media.duration), 1)}`);
		}

		if (media.externalLinks?.length) {
			const externalLinks = media.externalLinks
				.map((link) => {
					if (link?.url && link.site) {
						return hyperlink(link.site, hideLinkEmbed(link.url));
					}

					return undefined;
				})
				.filter(filterNullish);

			description.push(`${bold(anilistTitles.externalLinks)}: ${t(LanguageKeys.Common.FormatList, { value: externalLinks })}`);
		}

		if (media.description) {
			description.push('', parseAniListDescription(media.description));
		}

		if (media.siteUrl) {
			embed.setURL(media.siteUrl);
		}

		return {
			embeds: [
				embed
					.setColor(BrandingColors.Primary)
					.setTitle(media.title?.english ?? media.title?.romaji ?? media.title?.native ?? '') //
					.setDescription(description.join('\n'))
					.setImage(`https://img.anili.st/media/${media.id}`)
					.toJSON()
			]
		};
	}

	private async kitsuAutocompleteRun(
		autocompleteInteraction: Command.AutocompleteInteraction,
		options: AutocompleteInteractionArguments<Options>
	): Command.AsyncAutocompleteResponse {
		const result = await fetchKitsuApi('manga', options.manga);
		return result.match({
			ok: async (value) => {
				const redisInsertPromises: Promise<'OK'>[] = [];
				const results: APIApplicationCommandOptionChoice[] = [];

				for (const [index, hit] of value.hits?.entries() ?? []) {
					redisInsertPromises.push(
						this.container.redisCache.insertFor60Seconds<Kitsu.KitsuHit>(
							RedisKeys.KitsuManga,
							autocompleteInteraction.user?.id,
							options.manga,
							index.toString(),
							hit
						)
					);

					results.push({
						name: cutText(hit.titles.en || hit.titles.en_jp || hit.canonicalTitle || hit.slug, 100),
						value: `${RedisKeys.KitsuManga}:${options.manga}:${index}`
					});
				}

				if (redisInsertPromises.length) {
					await Promise.all(redisInsertPromises);
				}

				return this.autocomplete({
					choices: results.slice(0, 24)
				});
			},
			err: () => this.autocompleteNoResults()
		});
	}

	private async aniListAutocompleteRun(
		autocompleteInteraction: Command.AutocompleteInteraction,
		options: AutocompleteInteractionArguments<Options>
	): Command.AsyncAutocompleteResponse {
		const result = await fetchAniListApi(getManga, { search: options.manga });

		return result.match({
			ok: async (value) => {
				const redisInsertPromises: Promise<'OK'>[] = [];
				const results: APIApplicationCommandOptionChoice[] = [];

				for (const [index, hit] of value.data.Page.media?.entries() ?? []) {
					if (isNullish(hit)) continue;

					redisInsertPromises.push(
						this.container.redisCache.insertFor60Seconds<Media>(
							RedisKeys.AnilistManga,
							autocompleteInteraction.user?.id,
							options.manga,
							index.toString(),
							hit
						)
					);

					results.push({
						name: cutText(hit.title?.english || hit.title?.romaji || hit.title?.native || hit.id.toString(), 100),
						value: `${RedisKeys.AnilistManga}:${options.manga}:${index}`
					});
				}

				if (redisInsertPromises.length) {
					await Promise.all(redisInsertPromises);
				}

				return this.autocomplete({
					choices: results.slice(0, 24)
				});
			},
			err: () => this.autocompleteNoResults()
		});
	}

	private handleError(interaction: Command.Interaction): Command.MessageResponseOptions {
		return { content: resolveKey(interaction, LanguageKeys.Common.MangaError) };
	}
}

interface Options {
	manga: string;
}
