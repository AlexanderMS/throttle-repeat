'use strict';

const
  co = require('co'),
  assert = require('assert');

function throttleRepeat(options) {
  const rateMs = +options.rateMs;
  const whileCondition = options.whileCondition;
  const action = options.action;
  assert(rateMs > 0, '"options.rateMs" must be a positive integer');
  assert(typeof whileCondition === 'function', '"options.whileCondition" must be a function');
  assert(typeof action === 'function', '"options.action" must be a yieldable function');

  const reducer = options.reducer || ((acc) => ++acc);
  const initialValue = options.initialValue || 0;

  return co(function*() {
    let acc = initialValue;
    let lastResult = null;
    let nextStartMs = Date.now();
    do {
      const nowMs = Date.now();
      if (nextStartMs > nowMs) {
        yield new Promise(resolve => setTimeout(resolve, nextStartMs - nowMs));
      }
      nextStartMs = Date.now() + rateMs;
      lastResult = yield action();
      acc = reducer(acc, lastResult);
    } while (whileCondition(acc, lastResult));

    return acc;
  });
}

module.exports = throttleRepeat;
