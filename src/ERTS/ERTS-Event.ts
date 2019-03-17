type ERTSEventListener<T> = (data: T) => void

export class ERTSEvent<T> {
    private listeners_: (ERTSEventListener<T>)[] = []

    trigger(data: T): void {
        this.listeners_.forEach((listener) => listener(data))
    }

    addListener(listener: ERTSEventListener<T>): () => void {
        this.listeners_ = this.listeners_.concat([listener])

        const listenerRemover = () => this.removeListener(listener)
        return listenerRemover
    }

    private removeListener(listener: ERTSEventListener<T>): void {
        this.listeners_ = this.listeners_.filter((l) => l !== listener)
    }
}
