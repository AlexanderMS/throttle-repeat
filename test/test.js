'use strict';

const
  assert = require('chai').assert,
  throttleRepeat = require('../index.js');

describe('throttle-repeat', function() {
  it('runs once if until() is true', function() {
    return throttleRepeat({
      rate: () => 100000,
      task: () => Promise.resolve(),
      until: () => true
    }).then(result => {
      assert.deepEqual(result, 1);
    })
  });

  it('honors until(count, lastResult)', function() {
    return throttleRepeat({
      rate: () => 100,
      task: () => Promise.resolve(1),
      until: (count, lastResult) => (count === 10 || lastResult === 0)
    }).then(result => {
      assert.deepEqual(result, 10);
    })
  });

  it('next task executes immediately if last duration is greater than rate', function() {
    return throttleRepeat({
      rate: () => 9,
      task: () => new Promise(resolve => setTimeout(resolve, 10)),
      until: (count) => (count === 10)
    }).then(result => {
      assert.deepEqual(result, 10);
    })
  });

  it('honors reducer(acc, lastResult) and initialValue', function() {
    return throttleRepeat({
      rate: () => 100,
      task: () => Promise.resolve(2),
      until: (count) => (count === 10),
      initialValue: {
        total: 0
      },
      reducer: (acc, lastResult) => {
        acc.total += lastResult;
        return acc;
      }
    }).then(result => {
      assert.deepEqual(result, {
        total: 20
      });
    })
  });

  it('honors rate(lastResult)', function() {
    return throttleRepeat({
      rate: (lastResult) => {
        assert.deepEqual(lastResult, 2);
        return 10;
      },
      task: () => Promise.resolve(2),
      until: (count) => (count === 10),
      initialValue: {
        total: 0
      },
      reducer: (acc, lastResult) => {
        acc.total += lastResult;
        return acc;
      }
    }).then(result => {
      assert.deepEqual(result, {
        total: 20
      });
    })
  });

  it('rejects whenever task rejects', function() {
    const exception = {
      cause: 'unknown'
    };

    return throttleRepeat({
      rate: () => 100,
      task: () => Promise.reject(exception),
      until: (acc) => (acc.total === 10),
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
