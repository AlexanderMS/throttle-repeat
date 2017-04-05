'use strict';

const
  co = require('co'),
  assert = require('assert');

function throttleRepeat(options) {
  const waitTime = options.waitTime;
  const whileCondition = options.whileCondition;
  const action = options.action;
  assert(typeof waitTime === 'function', '"options.waitTime" must be a function');
  assert(typeof whileCondition === 'function', '"options.whileCondition" must be a function');
  assert(typeof action === 'function', '"options.action" must be a yieldable function');

  const reducer = options.reducer || ((acc) => ++acc);
  const initialValue = options.initialValue || 0;

  return co(function*() {
    let acc = initialValue;
    let lastResult = null;
    let calculatedWaitTime = 0;
    do {
      if (calculatedWaitTime > 0) {
        yield new Promise(resolve => setTimeout(resolve, calculatedWaitTime));
      }
      const startTime = Date.now();
      lastResult = yield action();
      calculatedWaitTime = waitTime(acc, lastResult, (Date.now() - startTime));
      acc = reducer(acc, lastResult);
    } while (whileCondition(acc, lastResult));

    return acc;
  });
}

module.exports = throttleRepeat;
