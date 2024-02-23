
export class TextRange {
    public _start: number;
    public _end: number;
    public extraRowsBeforeStart: number;
    public extraRowsAfterEnd: number;

    constructor(start: number, end: number) {
        this._start = start;
        this._end = end;
        this.extraRowsAfterEnd = 0;
        this.extraRowsBeforeStart = 0;
    }

    public set start(value: number) {
        this._start = value;
    }

    public set end(value: number) {
        this._end = value;
    }

    public get start(): number {
        return this._start - this.extraRowsBeforeStart;
    }

    public get end(): number {
        return this._end + this.extraRowsAfterEnd;
    }

    public get hasExtraRowsBeforeStart(): boolean {
        return this.extraRowsBeforeStart > 0;
    }

    public get hasExtraRowsAfterEnd(): boolean {
        return this.extraRowsAfterEnd > 0;
    }

    public resetExtraRowsSpace() {
        this.extraRowsAfterEnd = 0;
        this.extraRowsBeforeStart = 0;
    }

    public clone() {
        let clone = new TextRange(this._start, this.end);
        clone.extraRowsAfterEnd = this.extraRowsAfterEnd;
        clone.extraRowsBeforeStart = this.extraRowsBeforeStart;

        return clone;
    }
}