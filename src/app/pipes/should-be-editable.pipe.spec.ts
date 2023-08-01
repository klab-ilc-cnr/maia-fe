import { ShouldBeEditablePipe } from './should-be-editable.pipe';

describe('ShouldBeEditablePipe', () => {
  it('create an instance', () => {
    const pipe = new ShouldBeEditablePipe();
    expect(pipe).toBeTruthy();
  });
});
