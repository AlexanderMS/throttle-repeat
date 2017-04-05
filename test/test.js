'use strict';

const
  assert = require('chai').assert,
  throttleRepeat = require('../index.js');

describe('throttle-repeat', function() {
  it('runs at least once', function() {
    return throttleRepeat({
      waitTime: () => 10000,
      action: () => Promise.resolve(),
      whileCondition: () => false
    }).then(result => {
      assert.deepEqual(result, 1);
    })
  });

  it('honors whileCondition (acc and lastResult)', function() {
    return throttleRepeat({
      waitTime: () => 100,
      action: () => Promise.resolve(1),
      whileCondition: (acc, lastResult) => (acc < 10 && lastResult > 0)
    }).then(result => {
      assert.deepEqual(result, 10);
    })
  });

  it('starts next execution immediately if rate is lower than duration', function() {
    return throttleRepeat({
      waitTime: () => 1,
      action: () => new Promise(resolve => setTimeout(resolve, 10)),
      whileCondition: (acc) => (acc < 10)
    }).then(result => {
      assert.deepEqual(result, 10);
    })
  });

  it('honors reducer (acc and lastResult) and initialValue', function() {
    return throttleRepeat({
      waitTime: () => 100,
      action: () => Promise.resolve(2),
      whileCondition: (acc) => (acc.total < 10),
      initialValue: {
        total: 0
      },
      reducer: (acc, lastResult) => {
        acc.total += lastResult;
        return acc;
      }
    }).then(result => {
      assert.deepEqual(result, {
        total: 10
      });
    })
  });

  it('supports variable wait time', function() {
    return throttleRepeat({
      waitTime: (acc, lastResult, timeRun) => {
        assert.isOk(timeRun >= 10);
        return 0;
      },
      action: () => new Promise(resolve => setTimeout(resolve, 10)),
      whileCondition: (acc) => (acc < 10),
      initialValue: 0,
      reducer: (acc) => {
        return acc + 1;
      }
    }).then(result => {
      assert.deepEqual(result, 10);
    })
  });

  it('rejects if action rejects', function() {
    const exception = {
      cause: 'unknown'
    };

    return throttleRepeat({
      waitTime: () => 100,
      action: () => Promise.reject(exception),
      whileCondition: (acc) => (acc.total < 10),
      initialValue: {
        total: 0
      },
      reducer: (acc, lastResult) => {
        acc.total += lastResult;
        return acc;
      }
    }).then(() => {
      throw new Error('Supposed to reject');
    }).catch(err => {
      assert.deepEqual(err, exception);
    });
  });
});
