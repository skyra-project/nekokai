/** Anime or Manga */
interface AnilistEntryBase {
	/** The id of the media */
	readonly id: number;
	/** The official titles of the media in various languages */
	readonly title: MediaTitle;
	/** Short description of the media's story and characters */
	readonly description?: string | null;
	/** The format the media was released in */
	readonly format?: MediaFormat | null;
	/** The first official release date of the media */
	readonly startDate?: {
		/** Numeric Year (2017) */
		readonly year?: number | null;
	};
	/** The season year the media was initially released in */
	readonly seasonYear?: number | null;
	/** Where the media was created. (ISO 3166-1 alpha-2) */
	readonly countryOfOrigin?: 'JP' | 'KR' | 'CN' | 'TW' | null;
	/** External links to another site related to the media */
	readonly externalLinks?: readonly (MediaExternalLink | null)[] | null;
	/** The url for the media page on the AniList website */
	readonly siteUrl?: string | null;
}

export interface AnilistEntryAnime extends AnilistEntryBase {
	/** The amount of episodes the anime has when complete */
	readonly episodes?: number | null;
	/** The general length of each anime episode in minutes */
	readonly duration?: number | null;
}

export interface AnilistEntryManga extends AnilistEntryBase {
	/** The amount of chapters the manga has when complete */
	readonly chapters?: number | null;
	/** The amount of volumes the manga has when complete */
	readonly volumes?: number | null;
}

/** An external link to another site related to the media */
export interface MediaExternalLink {
	/** The url of the external link */
	readonly url: string;
	/** The site location of the external link */
	readonly site: string;
}

/** The official titles of the media in various languages */
export interface MediaTitle {
	/** The romanization of the native language title */
	readonly romaji?: string | null;
	/** The official english title */
	readonly english?: string | null;
	/** Official title in it's native language */
	readonly native?: string | null;
}

export enum MediaFormat {
	/** Professionally published manga with more than one chapter */
	Manga = 'MANGA',
	/** Anime movies with a theatrical release */
	Movie = 'MOVIE',
	/** Short anime released as a music video */
	Music = 'MUSIC',
	/** Written books released as a series of light novels */
	Novel = 'NOVEL',
	/** Anime that have been originally released online or are only available through streaming services. */
	OriginalNetAnimation = 'ONA',
	/** Manga with just one chapter */
	OneShot = 'ONE_SHOT',
	/** Anime that have been released directly on DVD/Blu-ray without originally going through a theatrical release or television broadcast */
	OriginalVideoAnimation = 'OVA',
	/** Special episodes that have been included in DVD/Blu-ray releases, picture dramas, pilots, etc */
	Special = 'SPECIAL',
	/** Anime broadcast on television */
	TV = 'TV',
	/** Anime which are under 15 minutes in length and broadcast on television */
	TVShort = 'TV_SHORT'
}
