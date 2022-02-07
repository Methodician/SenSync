export interface ModuleI {
  id?: string;
  lastInit: {
    ip: string;
    spoutVersion: string;
    timestamp: number;
  };
  lastReadout: {
    bme: {
      gas: number;
      humidity: number;
      pressure: number;
      temperature: number;
    };
    moduleId: string;
    timestamp: number;
  };
  name: string;
  permanentNumber: number;
  readoutIds: KeyMapI<boolean>;
}

export interface ReadoutI {
  bme: {
    gas: number;
    humidity: number;
    pressure: number;
    temperature: number;
  };
  timestamp: number;
  moduleId: string;
}

export interface KeyMapI<T> {
  [key: string]: T;
}
