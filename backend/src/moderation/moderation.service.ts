import { Injectable, Logger } from '@nestjs/common';
import {
  DataSet,
  englishDataset,
  englishRecommendedTransformers,
  pattern,
  RegExpMatcher,
  TextCensor,
} from 'obscenity';
import { EXTRA_BANNED_PATTERNS } from './banned-words';
import { ModerationResult } from './moderation.types';

@Injectable()
export class ModerationService {
  private readonly logger = new Logger(ModerationService.name);
  private readonly matcher: RegExpMatcher;
  private readonly censor = new TextCensor();

  private readonly remoteApiKey = process.env.OPENAI_API_KEY;
  private readonly remoteEndpoint = 'https://api.openai.com/v1/moderations';
  private readonly remoteModel = 'omni-moderation-latest';
  private readonly remoteTimeoutMs = 4000;
  private readonly failOpen = true;

  constructor() {
    const dataset = new DataSet<{ originalWord: string }>().addAll(
      englishDataset,
    );

    for (const phrase of EXTRA_BANNED_PATTERNS)
      dataset.addPhrase((p) =>
        p.setMetadata({ originalWord: phrase }).addPattern(pattern`${phrase}`),
      );
    this.matcher = new RegExpMatcher({
      ...dataset.build(),
      ...englishRecommendedTransformers,
    });
  }

  async check(text: string): Promise<ModerationResult> {
    const matches = this.matcher.getAllMatches(text);

    if (matches.length > 0)
      return { ok: false, flaggedBy: 'local', matchCount: matches.length };
    const remote = await this.checkRemote(text);

    return remote ?? { ok: true, flaggedBy: null, matchCount: 0 };
  }

  censorText(text: string): string {
    const matches = this.matcher.getAllMatches(text);

    return this.censor.applyTo(text, matches);
  }

  private async checkRemote(text: string): Promise<ModerationResult | null> {
    if (!this.remoteApiKey)
      return null;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.remoteTimeoutMs);

    try {
      const res = await fetch(this.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.remoteApiKey}`,
        },
        body: JSON.stringify({ model: this.remoteModel, input: text }),
        signal: controller.signal,
      });

      if (!res.ok) {
        this.logger.warn(
          `Remote moderation HTTP ${res.status} — ${
            this.failOpen ? 'failing open' : 'blocking'
          }`,
        );
        return this.onRemoteUnavailable();
      }
      const data = await res.json();
      const flagged = data?.results?.[0]?.flagged === true;

      return flagged
        ? { ok: false, flaggedBy: 'remote', matchCount: 0 }
        : { ok: true, flaggedBy: null, matchCount: 0 };
    } catch (err) {
      this.logger.warn(
        `Remote moderation unavailable (${String(err)}) — ${
          this.failOpen ? 'failing open' : 'blocking'
        }`,
      );
      return this.onRemoteUnavailable();
    } finally {
      clearTimeout(timer);
    }
  }

  private onRemoteUnavailable(): ModerationResult | null {
    return this.failOpen
      ? null
      : { ok: false, flaggedBy: 'remote', matchCount: 0 };
  }
}
