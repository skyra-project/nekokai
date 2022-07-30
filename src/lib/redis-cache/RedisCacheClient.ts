import { Result } from '@sapphire/result';
import { isNullish } from '@sapphire/utilities';
import { envParseInteger, envParseString } from '@skyra/env-utilities';
import { container } from '@skyra/http-framework';
import Redis from 'ioredis';

export const enum RedisKeys {
	KitsuManga = 'kManga',
	KitsuAnime = 'kAnime',
	AnilistManga = 'aManga',
	AnilistAnime = 'aAnime'
}

export class RedisCacheClient extends Redis {
	public constructor() {
		super({
			port: envParseInteger('REDIS_PORT'),
			password: envParseString('REDIS_PASSWORD'),
			host: envParseString('REDIS_HOST'),
			db: envParseInteger('REDIS_CACHE_DB')
		});

		container.redisCache = this;
	}

	public async fetch<T>(key: RedisKeys, query: string, nthResult: string): Promise<T | null> {
		const result = await Result.fromAsync<T | null>(async () => {
			const raw = await this.get(`${key}:${query}:${nthResult}`);
			return isNullish(raw) ? raw : JSON.parse(raw);
		});

		return result.unwrapOr(null);
	}

	public insertFor60Seconds<T>(key: RedisKeys, query: string, nthResult: string, data: T) {
		return this.setex(`${key}:${query}:${nthResult}`, 60, JSON.stringify(data));
	}
}

declare module '@sapphire/pieces' {
	interface Container {
		redisCache: RedisCacheClient;
	}
}
