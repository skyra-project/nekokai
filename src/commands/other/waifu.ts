import { BrandingColors } from '#lib/common/constants';
import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { EmbedBuilder } from '@discordjs/builders';
import { parseURL } from '@sapphire/utilities';
import { Command, RegisterCommand } from '@skyra/http-framework';
import { applyLocalizedBuilder, resolveKey } from '@skyra/http-framework-i18n';

@RegisterCommand((builder) => applyLocalizedBuilder(builder, LanguageKeys.Commands.Waifu.RootName, LanguageKeys.Commands.Waifu.RootDescription))
export class UserCommand extends Command {
	private readonly IMAGE_EXTENSION = /\.(bmp|jpe?g|png|gif|webp)$/i;

	/**
	 * Faces were generated with
	 * - `𝜓 = 0.8` for images `#0–50,000` (medium quality/medium diversity).
	 * - `𝜓 = 0.6` for images `#50,001–75,000` (high quality, low diversity).
	 * - `𝜓 = 1.1` for images `#75,001–100,000` (low quality, high diversity) for a mix of good & interesting faces.
	 */
	private readonly maximum = 100000;

	public override chatInputRun(interaction: Command.Interaction) {
		const url = `https://thiswaifudoesnotexist.net/example-${Math.floor(Math.random() * this.maximum)}.jpg`;

		const embed = new EmbedBuilder()
			.setTitle('→')
			.setURL(url)
			.setColor(BrandingColors.Primary)
			.setImage(this.getImageUrl(url) ?? 'https://i.imgur.com/vKUeMoH.png')
			.setFooter({ text: resolveKey(interaction, LanguageKeys.Commands.Waifu.Footer) })
			.setTimestamp()
			.toJSON();

		return this.message({ embeds: [embed] });
	}

	/**
	 * Parses an URL and checks if the extension is valid.
	 * @param url The url to check
	 */
	private getImageUrl(url: string): string | undefined {
		const parsed = parseURL(url);
		return parsed && this.IMAGE_EXTENSION.test(parsed.pathname) ? parsed.href : undefined;
	}
}
