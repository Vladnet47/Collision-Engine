class NarrowCollisionEngine {
    constructor() {
        this._indeces = [];
        this._collisions = [];
    }

    // empties collisions and indeces
    reset() {
        this._indeces = [];
        this._collisions = [];
    }

    // returns true if current and other intersect, and updates collisions and indeces.
    // by default, tests for circle-circle intersection
    record(current, i, other, j) {
        if (distance(current.x, current.y, other.x, other.y) <= current.rad + other.rad) {
            let last = this._indeces.length - 1;
            let indexI = this._getIndex(i, 0, last);
            let indexJ = this._getIndex(j, 0, last);

            // update current
            if (indexI > last) {                            // if current doesn't exist belongs at the end
                this._indeces.push(i);
                this._collisions.push([j]);
            } else if (this._indeces[indexI] == i) {        // if current exists
                this._collisions[indexI].push(j);
            } else {                                        // if current doesn't exist and belongs somewhere in the middle
                this._indeces.splice(indexI, 0, i);
                this._collisions.splice(indexI, 0, [j]);
            }

            // update other
            if (indexJ > last) {
                this._indeces.push(j);
                this._collisions.push([i]);
            } else if (this._indeces[indexJ] == j) {
                this._collisions[indexJ].push(i);
            } else {
                this._indeces.splice(indexJ, 0, j);
                this._collisions.splice(indexJ, 0, [i]);
            }

            return true;
        }
        return false;
    }

    // returns index of this._indeces if i exists
    // otherwise, returns index of this._indeces where it should be to keep it sorted
    _getIndex(i, low, high) {
        if (low >= high) {
            return (i > this._indeces[low]) ? low + 1 : low;
        } else {
            let mid = Math.round((high - low) / 2);
            let current = this._indeces[mid];

            if (i == current) {
                return mid;
            } else {
                return (i > current) ? this._getIndex(i, mid + 1, high) : this._getIndex(i, low, mid - 1);
            }
        }
    }

    // returns a list of changes for all objects that underwent collisions
    getChanges() {
        let listChanges = [];
        for (let i = 0; i < this._collisions.length; i++) {
            listChanges.push({index: this._indeces[i], changes: this.calculate(i)});
        }
        return listChanges;
    }

    calculate(index) {
        return new ChangesPosVel();
    }
}