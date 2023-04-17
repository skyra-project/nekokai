export type KitsuResult = AlgoliaResult<KitsuHit>;

export interface KitsuHit {
	abbreviatedTitles: string[];
	ageRating: AgeRating;
	averageRating: number;
	canonicalTitle: string;
	description?: Description;
	endDate: number;
	episodeCount?: number;
	episodeLength?: number;
	chapterCount?: number;
	volumeCount?: number;
	favoritesCount: number;
	id: number;
	kind: 'anime' | 'manga';
	objectID: string;
	season: 'spring' | 'summer' | 'autumn' | 'winter';
	seasonYear: number;
	slug: string;
	startDate: number;
	subtype: AnimeType;
	synopsis?: string;
	totalLength: number;
	userCount: number;
	year: number;
	posterImage: PosterImage;
	titles: Titles;
	_tags: string[];
}

interface KitsuTrendingAnime {
	data: AnimeDatum[];
}

interface KitsuTrendingManga {
	data: MangaDatum[];
}

interface BaseDatum {
	id: string;
	links: DatumLinks;
	relationships: { [key: string]: Relationship };
}

interface AnimeDatum extends BaseDatum {
	type: 'anime';
	attributes: AnimeAttributes;
}

interface MangaDatum extends BaseDatum {
	type: 'manga';
	attributes: MangaAttributes;
}

interface BaseAttributes {
	createdAt: DateString;
	updatedAt: DateString;
	slug: string;
	synopsis: string;
	description: string;
	coverImageTopOffset: number;
	titles: Titles;
	canonicalTitle: string;
	abbreviatedTitles: string[];
	averageRating: string;
	ratingFrequencies: { [key: string]: string };
	userCount: number;
	favoritesCount: number;
	startDate: string;
	endDate: string | null;
	nextRelease: number | null;
	popularityRank: number;
	ratingRank: number | null;
	ageRating: AgeRating | null;
	ageRatingGuide: null | string;
	subtype: AnimeType | MangaType;
	status: Status;
	tba: null | string;
	posterImage: PosterImage;
	coverImage: CoverImage | null;
}

interface AnimeAttributes extends BaseAttributes {
	episodeCount: number | null;
	episodeLength: number | null;
	totalLength: number | null;
	youtubeVideoId: string;
	showType: AnimeType;
	nsfw: boolean;
}

interface MangaAttributes extends BaseAttributes {
	chapterCount: number | null;
	volumeCount: number | null;
	serialization: null | string;
	mangaType: MangaType;
}

type AgeRating = 'PG' | 'G' | 'R';

type AnimeType = 'TV' | 'movie' | 'special';
type MangaType = 'manga' | 'manhua' | 'manhwa';

interface ImageDimensions {
	width: number | null;
	height: number | null;
}

interface PosterImage {
	tiny: string;
	large: string;
	small: string;
	medium: string;
	original: string;
	meta: PosterImageMeta;
}

interface PosterImageMeta {
	dimensions: PosterImageDimensions;
}

interface PosterImageDimensions {
	large: ImageDimensions;
	medium: ImageDimensions;
	small: ImageDimensions;
	tiny: ImageDimensions;
}

interface CoverImage {
	tiny: string;
	large: string;
	small: string;
	original: string;
	meta: CoverImageMeta;
	tiny_webp?: string;
	large_webp?: string;
	small_webp?: string;
}

interface CoverImageMeta {
	dimensions: CoverImageDimensions;
}

interface CoverImageDimensions {
	tiny: ImageDimensions;
	large: ImageDimensions;
	small: ImageDimensions;
	tiny_webp?: ImageDimensions;
	large_webp?: ImageDimensions;
	small_webp?: ImageDimensions;
}

interface Titles {
	canonical: string;
	[key: string]: string;
}

interface Description {
	[key: string]: string;
}

declare enum Status {
	Current = 'current',
	Finished = 'finished'
}

interface DatumLinks {
	self: string;
}

interface Relationship {
	links: RelationshipLinks;
}

interface RelationshipLinks {
	self: string;
	related: string;
}

interface AlgoliaResult<T> {
	exhaustiveNbHits: boolean;
	exhaustiveTypo: boolean;
	hits: T[];
	hitsPerPage: number;
	nbHits: number;
	nbPages: number;
	page: number;
	params: string;
	processingTimeMS: number;
	query: string;
	queryAfterRemoval: string;
}

type DateString = Date & { __TYPE__: 'DateString' };
