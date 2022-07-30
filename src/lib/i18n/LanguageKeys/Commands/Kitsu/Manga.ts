import { T } from '@skyra/http-framework-i18n';

export const RootName = T('commands/kitsu:mangaName');
export const RootDescription = T('commands/kitsu:mangaDescription');
export const EmbedData = T<{ type: string; score: string; ageRating: string; firstPublishDate: string; readIt: string }>(
	'commands/kitsu:mangaEmbedData'
);
export const OutputDescription = T('commands/kitsu:mangaOutputDescription');
export const Types = T<{ manga: string; novel: string; manhwa: string; oneShot: string; special: string; [index: string]: string }>(
	'commands/kitsu:mangaTypes'
);
