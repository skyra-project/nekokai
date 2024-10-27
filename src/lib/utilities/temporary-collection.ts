import { Collection } from '@discordjs/collection';
import { isNullish } from '@sapphire/utilities';

export class TemporaryCollection<Key, Value> {
	public readonly lifetime: number;
	public readonly sweepInterval: number;
	readonly #data = new Collection<Key, TemporaryCollectionEntry<Value>>();
	readonly #sweepFn: () => void;
	#interval: NodeJS.Timeout | null = null;

	public constructor(options: TemporaryCollectionOptions) {
		this.lifetime = options.lifetime;
		this.sweepInterval = options.sweepInterval;
		this.#sweepFn = () => {
			const now = Date.now();
			for (const [key, value] of this.#data.entries()) {
				// If the current value doesn't expire yet, the next won't,
				// since the entries are stored in ascending order of `expires`:
				if (value.expires > now) break;

				// Otherwise if it's expiring now, we delete it:
				this.#data.delete(key);
			}

			this.#updateInternalInterval();
		};
	}

	public get(key: Key): Value | undefined {
		const entry = this.#data.get(key);
		return entry && entry.expires > Date.now() ? entry.value : undefined;
	}

	public add(key: Key, value: Value): this {
		this.#data.delete(key);
		this.#data.set(key, { expires: Date.now() + this.lifetime, value });
		this.#updateInternalInterval();

		return this;
	}

	public delete(key: Key) {
		const success = this.#data.delete(key);
		this.#updateInternalInterval();

		return success;
	}

	#updateInternalInterval() {
		if (this.#data.size === 0) {
			if (isNullish(this.#interval)) return;

			clearTimeout(this.#interval);
			this.#interval = null;
		} else {
			if (!isNullish(this.#interval)) return;

			this.#interval = setTimeout(this.#sweepFn, this.sweepInterval);
			this.#interval.unref();
		}
	}
}

export interface TemporaryCollectionOptions {
	lifetime: number;
	sweepInterval: number;
}

export interface TemporaryCollectionEntry<Value> {
	expires: number;
	value: Value;
}
