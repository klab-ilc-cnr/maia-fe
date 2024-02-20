export class SynchRequest<T> {
    content: T;
    requestTime: number;
    debug: string;

    constructor(content: T, debug: string) {
        this.content = content;
        this.requestTime = Date.now();
        this.debug = debug;
    }
}