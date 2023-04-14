/** Anime or Manga */
export interface AnilistEntry {
	/** The id of the media */
	readonly id: number;
	/** The official titles of the media in various languages */
	readonly title: MediaTitle;
	/** Short description of the media's story and characters */
	readonly description?: string | null;
	/** The amount of episodes the anime has when complete */
	readonly episodes?: number | null;
	/** The general length of each anime episode in minutes */
	readonly duration?: number | null;
	/** The amount of chapters the manga has when complete */
	readonly chapters?: number | null;
	/** The amount of volumes the manga has when complete */
	readonly volumes?: number | null;
	/** Where the media was created. (ISO 3166-1 alpha-2) */
	readonly countryOfOrigin?: string | null;
	/** External links to another site related to the media */
	readonly externalLinks?: readonly (MediaExternalLink | null)[] | null;
	/** The url for the media page on the AniList website */
	readonly siteUrl?: string | null;
}

/** An external link to another site related to the media */
interface MediaExternalLink {
	/** The url of the external link */
	readonly url: string;
	/** The site location of the external link */
	readonly site: string;
}

/** The official titles of the media in various languages */
interface MediaTitle {
	/** The romanization of the native language title */
	readonly romaji?: string | null;
	/** The official english title */
	readonly english?: string | null;
	/** Official title in it's native language */
	readonly native?: string | null;
}
