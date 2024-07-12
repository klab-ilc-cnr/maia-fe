import { ReplaceLineFeedPipe } from './replace-line-feed.pipe';

describe('ReplaceEscapesPipe', () => {
  it('create an instance', () => {
    const pipe = new ReplaceLineFeedPipe();
    expect(pipe).toBeTruthy();
  });
});
