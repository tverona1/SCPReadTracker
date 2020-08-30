class BitArray {
    static BIT_ON = 0b1;
    static BIT_OFF = 0b0;
    static _BYTE_LENGTH = 8;

    /**
     * Constructs a new instance of BitArray
     * @param {number} bitLength - Size of the array
     */
    constructor(bitLength) {
        this._length = bitLength;
        var byteLength = Math.ceil(bitLength / BitArray._BYTE_LENGTH);

        try {
            this._byteArray = new Uint8Array(byteLength)
        } catch (e) {
            throw new Error(`Failed to allocate array of length ${byteLength}`, e);
        }
    }

    /**
     * Validates that given index is within array bounds
     * @param {number} index - Index to validate
     */
    _validateIndex(index) {
        if (!Number.isInteger(index)) {
            throw new TypeError("bit array index must be integer");
        } else if (index < 0) {
            throw new RangeError("bit array index must >= 0");
        } else if (index >= this._length) {
            throw new RangeError("bit array index out of length range");
        }
    }

    /**
     * Retrieves element at given index
     * @param {number} index - Index to retrieve
     */
    get(index) {
        this._validateIndex(index);

        let offset = Math.floor(index / BitArray._BYTE_LENGTH);
        let byteIndex = index % BitArray._BYTE_LENGTH;

        let bit = (this._byteArray[offset] >> byteIndex) & BitArray.BIT_ON
        return bit;
    }

    /**
     * Sets values at given index
     * @param {number} index - Index to set
     * @param {bit} value - Either 0 or 1
     */
    set(index, value) {
        this._validateIndex(index);

        let offset = Math.floor(index / BitArray._BYTE_LENGTH);
        let byteIndex = index % BitArray._BYTE_LENGTH;

        if (value === BitArray.BIT_ON) {
            this._byteArray[offset] |= (BitArray.BIT_ON << byteIndex);
        } else if (value === BitArray.BIT_OFF) {
            this._byteArray[offset] &= (~(BitArray.BIT_ON << byteIndex));
        } else {
            throw new RangeError('bit array set value must be number 0 or 1')
        }
    }

    /**
     * Encodes array to base 64 string
     */
    toBase64() {
        return btoa(String.fromCharCode.apply(null, this._byteArray));
    }

    /**
     * Decodes array from base 64 string. Clears any existing values first.
     * @param {string} base64Str - Base 64 string to decode
     */
    fromBase64(base64Str) {
        var array = atob(base64Str).split('');
        this._validateIndex(array.length);
        this._byteArray.fill(0);
        this._byteArray.set(array.map(c => { return c.charCodeAt(0); }));
    }

    /**
     * Returns array of indexes that match given callback filter
     * @param {function} callback - Callback that takes (element, index) as parameters
     * @param {object} thisArg - (Optional) thing argument to bing to callback
     */
    filter(callback, thisArg = undefined) {
        var ret = [];
        if (thisArg) {
            callback = callback.bind(thisArg);
        }

        for (var i = 0; i < this._length; i++) {
            var elem = this.get(i);
            if (callback(elem, i)) {
                ret.push(i);
            }
        }

        return ret;
    }
}
