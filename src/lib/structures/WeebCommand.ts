import { BrandingColors } from '#lib/common/constants';
import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { isNsfwChannel } from '#lib/utilities/discord-utilities';
import { EmbedBuilder, userMention } from '@discordjs/builders';
import { Result } from '@sapphire/result';
import { envParseString } from '@skyra/env-utilities';
import { Command, type TransformedArguments } from '@skyra/http-framework';
import { resolveKey, resolveUserKey, type TypedT } from '@skyra/http-framework-i18n';
import { MessageFlags } from 'discord-api-types/v10';
import { elementAt } from 'ix/iterable/elementat.js';
import { platform, release } from 'node:os';
import { setTimeout } from 'node:timers';

export class WeebCommand extends Command {
	private readonly type: string;
	private readonly cache = new Set<string>();

	public constructor(context: Command.Context, options: WeebCommand.Options) {
		super(context, options);
		this.type = options.type;
	}

	public override async chatInputRun(interaction: Command.ChatInputInteraction, args: WeebCommandArgs) {
		const query = new URL('https://api.weeb.sh/images/random');
		query.searchParams.append('type', this.type);
		query.searchParams.append('nsfw', isNsfwChannel(interaction.channel).toString());

		const result = await this.get(query);
		return result.match({
			ok: (value) => this.handleSuccess(interaction, value, args),
			err: (error) => this.handleError(interaction, error)
		});
	}

	private handleSuccess(interaction: Command.ChatInputInteraction, url: string, args: WeebCommandArgs) {
		const content = args.user ? userMention(args.user.user.id) : undefined;
		const embed = new EmbedBuilder()
			.setTitle('→')
			.setURL(url)
			.setColor(BrandingColors.Primary)
			.setImage(url)
			.setFooter({ text: resolveKey(interaction, LanguageKeys.Commands.Anime.PoweredByWeebSh) });
		return interaction.reply({ content, embeds: [embed.toJSON()] });
	}

	private handleError(interaction: Command.ChatInputInteraction, error: TypedT) {
		const content = resolveUserKey(interaction, error);
		return interaction.reply({ content, flags: MessageFlags.Ephemeral });
	}

	private async get(url: URL): Promise<Result<string, TypedT>> {
		// We will abort requests that take longer than 2 seconds, to be safe with the 3 second limit:
		const abort = new AbortController();
		const timer = setTimeout(() => abort.abort('TimeoutError'), 2000);

		const result = await Result.fromAsync(fetch(url.href, { headers: WeebCommand.headers, signal: abort.signal }));
		clearTimeout(timer);

		// Handle cases in which we have a Response:
		if (result.isOk()) {
			const response = result.unwrap();

			// If 2XX, deserialize the data, cache the URL, and return it:
			if (response.ok) {
				const data = (await response.json()) as WeebCommandFetchResult;
				this.cache.add(data.url);
				return Result.ok(data.url);
			}

			// If we got an 4XX error code, warn the error:
			if (response.status < 500) {
				this.container.logger.error(`Unexpected error in ${this.name}: [${response.status}] ${await response.text()}`);
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

export namespace WeebCommand {
	export type Context = Command.Context;
	export interface Options extends Command.Options {
		type: string;
	}
}

interface WeebCommandArgs {
	user?: TransformedArguments.User;
}

interface WeebCommandFetchResult {
	url: string;
}
