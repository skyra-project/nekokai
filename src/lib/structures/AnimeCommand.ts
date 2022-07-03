import { BrandingColors } from '#lib/common/constants';
import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { UnsafeEmbedBuilder, userMention } from '@discordjs/builders';
import { Result } from '@sapphire/result';
import { envParseString } from '@skyra/env-utilities';
import { Command, TransformedArguments } from '@skyra/http-framework';
import { resolveKey, resolveUserKey, type TypedT } from '@skyra/http-framework-i18n';
import { APIApplicationCommandInteraction, MessageFlags } from 'discord-api-types/v10';
import { elementAt } from 'ix/iterable/elementat.js';
import { platform, release } from 'node:os';
import { setTimeout } from 'node:timers';

export class AnimeCommand extends Command {
	private readonly type: string;
	private readonly cache = new Set<string>();

	public constructor(context: Command.Context, options: AnimeCommand.Options) {
		super(context, options);
		this.type = options.type;
	}

	protected override async chatInputRun(interaction: Command.Interaction, args: AnimeCommandArgs): Promise<Command.MessageResponseResult> {
		const query = new URL('https://api.weeb.sh/images/random');
		query.searchParams.append('type', this.type);
		query.searchParams.append('nsfw', 'false');

		const result = await this.get(query);
		return result.match({
			ok: (value) => this.handleSuccess(interaction, value, args),
			err: (error) => this.handleError(interaction, error)
		});
	}

	private handleSuccess(interaction: Command.Interaction, url: string, args: AnimeCommandArgs) {
		const content = args.user ? userMention(args.user.user.id) : undefined;
		const embed = new UnsafeEmbedBuilder()
			.setTitle('→')
			.setURL(url)
			.setColor(BrandingColors.Primary)
			.setImage(url)
			.setFooter({ text: resolveKey(interaction, LanguageKeys.Commands.Anime.PoweredByWeebSh) });
		return this.message({ content, embeds: [embed.toJSON()] });
	}

	private handleError(interaction: APIApplicationCommandInteraction, error: TypedT) {
		const content = resolveUserKey(interaction, error);
		return this.message({ content, flags: MessageFlags.Ephemeral });
	}

	private async get(url: URL): Promise<Result<string, TypedT>> {
		// We will abort requests that take longer than 2 seconds, to be safe with the 3 second limit:
		const abort = new AbortController();
		const timer = setTimeout(() => abort.abort('TimeoutError'), 2000);

		const result = await Result.fromAsync(fetch(url.href, { headers: AnimeCommand.headers, signal: abort.signal }));
		clearTimeout(timer);

		// Handle cases in which we have a Response:
		if (result.isOk()) {
			const response = result.unwrap();

			// If 2XX, deserialize the data, cache the URL, and return it:
			if (response.ok) {
				const data = (await response.json()) as AnimeCommandFetchResult;
				this.cache.add(data.url);
				return Result.ok(data.url);
			}

			// If we got an 4XX error code, warn the error:
			if (response.status < 500) {
				console.error(`Unexpected error in ${this.name}: [${response.status}] ${await response.text()}`);
			}
		}

		if (this.cache.size === 0) {
			const key = result.isOkAnd((value) => value.status >= 500)
				? LanguageKeys.Commands.Anime.UnavailableError
				: LanguageKeys.Commands.Anime.UnexpectedError;
			return Result.err(key);
		}

		return Result.ok(elementAt(this.cache.values(), Math.floor(Math.random() * this.cache.size))!);
	}

	private static readonly headers = {
		Authorization: `Wolke ${envParseString('WEEB_SH_TOKEN')}`,
		'User-Agent': `Skyra/${envParseString('CLIENT_VERSION')} (fetch) ${platform()}/${release()} (https://github.com/skyra-project/nekokai)`
	} as const;
}

export namespace AnimeCommand {
	export type Context = Command.Context;
	export interface Options extends Command.Options {
		type: string;
	}
}

interface AnimeCommandArgs {
	user?: TransformedArguments.User;
}

interface AnimeCommandFetchResult {
	url: string;
}
