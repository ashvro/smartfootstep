export {};

declare global {
  interface SerialOptions {
    baudRate: number;
    dataBits?: 7 | 8;
    stopBits?: 1 | 2;
    parity?: 'none' | 'even' | 'odd';
    bufferSize?: number;
    flowControl?: 'none' | 'hardware';
  }

  interface SerialPort {
    open(options: SerialOptions): Promise<void>;
    close(): Promise<void>;
    readonly readable: ReadableStream<Uint8Array> | null;
    readonly writable: WritableStream<Uint8Array> | null;
    getInfo(): { usbVendorId?: number; usbProductId?: number };
    addEventListener(type: 'connect' | 'disconnect', listener: (ev: Event) => void): void;
    removeEventListener(type: 'connect' | 'disconnect', listener: (ev: Event) => void): void;
  }

  interface Serial extends EventTarget {
    requestPort(options?: {
      filters?: Array<{ usbVendorId?: number; usbProductId?: number }>;
    }): Promise<SerialPort>;
    getPorts(): Promise<SerialPort[]>;
  }

  interface Navigator {
    readonly serial?: Serial;
  }
}
