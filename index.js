'use strict';

const
  co = require('co'),
  assert = require('assert');

function throttleRepeat(options) {
  const rate = options.rate;
  const until = options.until;
  const task = options.task;
  assert(typeof rate === 'function', '"options.rate" must be a function');
  assert(typeof until === 'function', '"options.until" must be a function');
  assert(typeof task === 'function', '"options.task" must be a yieldable function');

  const reducer = options.reducer || (acc => acc + 1);
  const initialValue = (options.initialValue === undefined) ? 0 : options.initialValue;

  return co(function*() {
    let acc = initialValue;
    let lastResult = null;
    let calculatedWaitTime = 0;
    let index = 0;
    do {
      if (calculatedWaitTime > 0) {
        yield new Promise(resolve => setTimeout(resolve, calculatedWaitTime));
      }
      const startTime = Date.now();
      lastResult = yield task(index);
      const timeElapsed = Date.now() - startTime;
      calculatedWaitTime = rate(lastResult) - timeElapsed;
      acc = reducer(acc, lastResult);
    } while (!until(++index, lastResult));

    return acc;
  });
}

module.exports = throttleRepeat;
