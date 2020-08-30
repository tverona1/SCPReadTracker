'use strict'

/**
 * StateManager
 * 
 * Manages page read state. Utilizes storage.sync to synchronize
 * state between devices. State is represented in a bit array to minimize
 * size, since storage.sync has strict limits on data size.
 * 
 */
class StateManager {
  // Key to use
  static _Key = 'scp1';

  // Size to initialize bit array.
  // Storage.sync limits total data size to ~100KB and per request size to 8KB.
  // We utilize a bit array to minimize size. 20000 entries stored in Base64 is ~3.3KB. 
  static _DataSize = 20000;

  static _getValue(url) {
    // Match url on /scp-XXXX.
    const RegExpVal = new RegExp('/scp-(\\d+)(?:$|/)', '');
    var match = url.match(RegExpVal);
    if (match.length >= 2) {
      return parseInt(match[1]);
    }
    return undefined;
  }

  constructor() {
    this.bitArray = new BitArray(StateManager._DataSize);
  }

  /**
   * Initialize by loading current state.
   * 
   * @param {*} onSuccess - Callback on success
   * @param {*} onError - Callback on error
   * @param {*} onUpdate - Callback on data updates
   */
  initialize(onSuccess, onError, onUpdate) {
    this._loadData(onSuccess, onError);
    this._listenForUpdates(onUpdate);
  }

  /**
   * Returns read state of the given page (true === read, false === unread).
   * @param {string} url - Page URL. Must match /scp-XXXX format.
   */
  getState(url) {
    var value = StateManager._getValue(url);
    if (value === undefined) {
      throw new Error(`Unsupported url: ${url}`);
    }
    return this.bitArray.get(value) === 0 ? false : true;
  }

  /**
   * Toggle page read state for given url.
   * @param {string} url - Page URL. Must match /scp-XXXX format.
   * @param {function} onSuccess - Callback on success.
   * @param {function} onError - Callback on error.
   */
  toggleState(url, onSuccess, onError) {
    var value = StateManager._getValue(url);
    if (value === undefined) {
      throw new Error(`Unsupported url: ${url}`);
    }

    // Flip the state
    var state = this.bitArray.get(value) === 0 ? 1 : 0;
    this.bitArray.set(value, state);

    // Persist the data
    this._saveData(function () {
      if (onSuccess) {
        onSuccess(state)
      }
    }, onError);
  }

  /**
   * Returns all read / unread states
   * @param {bool} isRead - whether to get read or unread states.
   */
  getStates(isRead = true) {
    var states = this.bitArray.filter(function (elem) {
      return (elem === (isRead ? 1 : 0));
    });
    return states;
  }

  /**
   * Internal method to load data from storage.sync
   * @param {*} onSuccess - Callback on success
   * @param {*} onError  - Callback on error
   */
  _loadData(onSuccess, onError) {
    var that = this;
    chrome.storage.sync.get(StateManager._Key, function (result) {
      if (chrome.runtime.lastError) {
        console.error(`Failed to read data: ${chrome.runtime.lastError}`);
        if (onError) {
          onError(chrome.runtime.lastError);
        }
      } else {
        if (result && result[StateManager._Key]) {
          console.debug(`Loaded data with key '${StateManager._Key}'`);
          that.bitArray.fromBase64(result[StateManager._Key]);
        }
        if (onSuccess) {
          onSuccess();
        }
      }
    });
  }

  /**
   * Internal method to save data to storage.sync
   * @param {*} onSuccess - Callback on success
   * @param {*} onError - Callback on error
   */
  _saveData(onSuccess, onError) {
    var data = {};
    data[StateManager._Key] = this.bitArray.toBase64();

    chrome.storage.sync.set(data, function () {
      if (chrome.runtime.lastError) {
        console.error('Failed to save page read data: ' + chrome.runtime.lastError);
        if (onError) {
          onError(chrome.runtime.lastError);
        }
      } else {
        console.debug(`Saved data with key '${StateManager._Key}'`);
        if (onSuccess) {
          onSuccess();
        }
      }
    });
  }

  /**
   * Listens for data updates. On update, re-loads data.
   * @param {*} callback - Callback on data change
   */
  _listenForUpdates(callback) {
    var that = this;
    chrome.storage.onChanged.addListener(function (changes, namespace) {
      for (var key in changes) {
        var storageChange = changes[key];
        console.info(`Storage key '${key}' in namespace '${namespace}' changed.`);
        if (key === StateManager._Key) {
          that.bitArray.fromBase64(storageChange.newValue);
          if (callback) {
            callback();
          }
        }
      }
    });
  }
}
