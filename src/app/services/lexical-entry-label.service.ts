import { Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { LexiconService } from './lexicon.service';

@Injectable({
  providedIn: 'root'
})
export class LexicalEntryLabelService {
  private readonly cache = new Map<string, string>();

  constructor(private lexiconService: LexiconService) {}

  isLexicalEntryCode(value: string | undefined | null): boolean {
    if (value == null || typeof value !== 'string' || value.trim() === '') {
      return false;
    }
    const v = value.trim();
    return v.includes('@') || v.startsWith('http://') || v.startsWith('https://') || v.startsWith('urn:');
  }

  getLabel(lexicalEntryId: string): Observable<string> {
    const cached = this.cache.get(lexicalEntryId);
    if (cached !== undefined) {
      return of(cached);
    }
    return this.lexiconService.getLexicalEntry(lexicalEntryId).pipe(
      map(entry => entry?.label ?? lexicalEntryId),
      tap(label => this.cache.set(lexicalEntryId, label)),
      catchError(() => {
        this.cache.set(lexicalEntryId, lexicalEntryId);
        return of(lexicalEntryId);
      })
    );
  }

  getLabels(ids: string[]): Observable<Map<string, string>> {
    const unique = [...new Set(ids.filter(id => id && this.isLexicalEntryCode(id)))];
    if (unique.length === 0) {
      return of(new Map());
    }
    const results = new Map<string, string>();
    const pending = unique.filter(id => !this.cache.has(id));
    if (pending.length === 0) {
      unique.forEach(id => results.set(id, this.cache.get(id)!));
      return of(results);
    }
    return forkJoin(
      pending.map(id =>
        this.getLabel(id).pipe(
          map(label => ({ id, label }))
        )
      )
    ).pipe(
      map(pairs => {
        pairs.forEach(({ id, label }) => results.set(id, label));
        unique.forEach(id => {
          if (!results.has(id)) results.set(id, this.cache.get(id) ?? id);
        });
        return results;
      }),
      catchError(() => {
        unique.forEach(id => results.set(id, this.cache.get(id) ?? id));
        return of(results);
      })
    );
  }
}
