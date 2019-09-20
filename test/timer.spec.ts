import { Timer } from '../src';
describe('Timer test unit', () => {
  test('Add a timer', done => {
    Timer.startTimeout(() => {}, 1000);
    expect(Timer.timers.size).toEqual(1);
    Timer.startInterval(() => {}, 1000);
    expect(Timer.timers.size).toEqual(2);
    Timer.destroy();
    expect(Timer.timers.size).toEqual(0);
    done();
  });

  test('Stop timer', done => {
    const t1 = Timer.startTimeout(() => {}, 1000);
    expect(Timer.timers.size).toEqual(1);
    const t2 = Timer.startInterval(() => {}, 1000);
    expect(Timer.timers.size).toEqual(2);
    Timer.stopTimeout(t1);
    expect(Timer.timers.size).toEqual(1);
    Timer.stopInterval(t2);
    expect(Timer.timers.size).toEqual(0);
    Timer.destroy();
    done();
  })
})