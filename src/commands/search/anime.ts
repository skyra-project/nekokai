import { fetchAniListApi, getAnime, parseAniListDescription } from '#lib/apis/anilist/anilist-constants';
import type { Media } from '#lib/apis/anilist/Anlist';
import type { Kitsu } from '#lib/apis/kitsu/Kitsu';
import { fetchKitsuApi } from '#lib/apis/kitsu/kitsu-constants';
import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { RedisKeys } from '#lib/redis-cache/RedisCacheClient';
import { apply } from '#lib/utilities/add-builder-localizations';
import { durationFormatter } from '#lib/utilities/duration-formatter';
import { buildAnimeSubcommand, checkIsKitsuSubcommand } from '#lib/utilities/search-command-helpers';
import { minutes } from '#lib/utilities/time-utilities';
import { bold, EmbedBuilder, hideLinkEmbed, hyperlink, time, TimestampStyles } from '@discordjs/builders';
import { cutText, filterNullish, isNullish, isNullishOrEmpty } from '@sapphire/utilities';
import { AutocompleteInteractionArguments, Command, InteractionArguments, RegisterCommand, RegisterSubCommand } from '@skyra/http-framework';
import { getSupportedLanguageT, resolveKey } from '@skyra/http-framework-i18n';
import type { APIApplicationCommandOptionChoice } from 'discord-api-types/v10';

@RegisterCommand((builder) => apply(builder, LanguageKeys.Common.AnimeName, LanguageKeys.Common.AnimeDescription))
export class UserCommand extends Command {
	public override async autocompleteRun(
		autocompleteInteraction: Command.AutocompleteInteraction,
		options: AutocompleteInteractionArguments<Options>
	) {
		if (!options.subCommand || options.focused !== 'anime' || isNullishOrEmpty(options.anime)) {
			return this.autocompleteNoResults();
		}

		switch (options.subCommand as 'kitsu' | 'anilist') {
			case 'kitsu':
				return this.kitsuAutocompleteRun(autocompleteInteraction, options);
			case 'anilist':
				return this.aniListAutocompleteRun(autocompleteInteraction, options);
		}
	}

	@RegisterSubCommand(buildAnimeSubcommand('kitsu'))
	@RegisterSubCommand(buildAnimeSubcommand('anilist'))
	public async *sharedRun(interaction: Command.Interaction, { subCommand, anime }: InteractionArguments<Options>): Command.AsyncGeneratorResponse {
		const isKitsuSubcommand = checkIsKitsuSubcommand(subCommand);

		const [, packageFromAutocomplete, nthResult] = anime.split(':');
		const hitFromRedisCache = await this.container.redisCache.fetch<Kitsu.KitsuHit | Media>(
			isKitsuSubcommand ? RedisKeys.KitsuAnime : RedisKeys.AnilistAnime,
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
			? await fetchKitsuApi('anime', packageFromAutocomplete ?? anime, 1)
			: await fetchAniListApi(getAnime, { search: anime });

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

	private buildKitsuResponse(entry: Kitsu.KitsuHit, interaction: Command.Interaction): Command.MessageResponseOptions {
		const t = getSupportedLanguageT(interaction);

		const description =
			// Prefer the synopsis
			entry.synopsis ||
			// Then prefer the English description
			entry.description?.en ||
			// Then prefer the English-us description
			entry.description?.en_us ||
			// Then prefer the latinized Japanese description
			entry.description?.en_jp ||
			// Then the description in kanji / hiragana / katakana
			entry.description?.ja_jp ||
			// If all fails just get the first key of the description
			entry.description?.[Object.keys(entry.description!)[0]];
		const synopsis = description ? cutText(description.replace(/(.+)[\r\n\t](.+)/gim, '$1 $2').split('\r\n')[0], 750) : null;
		const score = `${entry.averageRating}%`;
		const animeURL = `https://kitsu.io/anime/${entry.id}`;
		const type = entry.subtype;
		const title = entry.titles.en || entry.titles.en_jp || entry.canonicalTitle || '--';

		const englishTitle = entry.titles.en || entry.titles.en_us || t(LanguageKeys.Common.None);
		const japaneseTitle = entry.titles.ja_jp || t(LanguageKeys.Common.None);
		const canonicalTitle = entry.canonicalTitle || t(LanguageKeys.Common.None);

		const embedData = t(LanguageKeys.Commands.Kitsu.Anime.EmbedData);

		const embed = new EmbedBuilder()
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
			.setThumbnail(entry.posterImage?.original || '')
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
					value: entry.episodeCount ? t(LanguageKeys.Common.FormatNumber, { value: entry.episodeCount }) : embedData.stillAiring,
					inline: true
				},
				{
					name: embedData.episodeLength,
					value: durationFormatter.format(entry.episodeLength * 60 * 1000),
					inline: true
				},
				{
					name: embedData.ageRating,
					value: entry.ageRating ? entry.ageRating : t(LanguageKeys.Common.None),
					inline: true
				},
				{
					name: embedData.firstAirDate,
					value: time(entry.startDate, TimestampStyles.ShortDate),
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

		if (media.episodes) {
			description.push(`${bold(anilistTitles.episodes)}: ${t(LanguageKeys.Common.FormatNumber, { value: media.episodes })}`);
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
		const result = await fetchKitsuApi('anime', options.anime);
		return result.match({
			ok: async (value) => {
				const redisInsertPromises: Promise<'OK'>[] = [];
				const results: APIApplicationCommandOptionChoice[] = [];

				for (const [index, hit] of value.hits?.entries() ?? []) {
					redisInsertPromises.push(
						this.container.redisCache.insertFor60Seconds<Kitsu.KitsuHit>(
							RedisKeys.KitsuAnime,
							autocompleteInteraction.user?.id,
							options.anime,
							index.toString(),
							hit
						)
					);

					results.push({
						name: cutText(hit.titles.en || hit.titles.en_jp || hit.canonicalTitle || hit.slug, 100),
						value: `${RedisKeys.KitsuAnime}:${options.anime}:${index}`
					});
				}

				if (redisInsertPromises.length) {
					await Promise.all(redisInsertPromises);
				}

				return this.autocomplete({
					choices: results.slice(0, 19)
				});
			},
			err: () => this.autocompleteNoResults()
		});
	}

	private async aniListAutocompleteRun(
		autocompleteInteraction: Command.AutocompleteInteraction,
		options: AutocompleteInteractionArguments<Options>
	): Command.AsyncAutocompleteResponse {
		const result = await fetchAniListApi(getAnime, { search: options.anime });

		return result.match({
			ok: async (value) => {
				const redisInsertPromises: Promise<'OK'>[] = [];
				const results: APIApplicationCommandOptionChoice[] = [];

				for (const [index, hit] of value.data.Page.media?.entries() ?? []) {
					if (isNullish(hit)) continue;

					redisInsertPromises.push(
						this.container.redisCache.insertFor60Seconds<Media>(
							RedisKeys.AnilistAnime,
							autocompleteInteraction.user?.id,
							options.anime,
							index.toString(),
							hit
						)
					);

					results.push({
						name: cutText(hit.title?.english || hit.title?.romaji || hit.title?.native || hit.id.toString(), 100),
						value: `${RedisKeys.AnilistAnime}:${options.anime}:${index}`
					});
				}

				if (redisInsertPromises.length) {
					await Promise.all(redisInsertPromises);
				}

				return this.autocomplete({
					choices: results.slice(0, 19)
				});
			},
			err: () => this.autocompleteNoResults()
		});
	}

	private handleError(interaction: Command.Interaction): Command.MessageResponseOptions {
		return { content: resolveKey(interaction, LanguageKeys.Common.AnimeError) };
	}
}

interface Options {
	anime: string;
}
