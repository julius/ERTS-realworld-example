/**
 * Shared Data
 *
 * Multiple components can subscribe to changes or change the data.
 */
export class ERTSContainer<S> {
    state: S
    private _listeners: (() => void)[] = []

    constructor(initialState: S) {
        this.state = initialState
    }

    setState(s: S): void {
        this.state = s
        this._notifyListeners()
    }

    addListener(listener: () => void): () => void {
        this._listeners = this._listeners.concat([listener])
        return () => this.removeListener(listener)
    }

    private _notifyListeners(): void {
        this._listeners.forEach((l) => l())
    }

    private removeListener(listener: () => void): void {
        this._listeners = this._listeners.filter((l) => l !== listener)
    }
}
