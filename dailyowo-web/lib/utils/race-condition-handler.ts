/**
 * Race Condition Handler
 * Prevents race conditions in async operations like data fetching and updates
 */

export interface AsyncOperation<T> {
  id: string;
  promise: Promise<T>;
  timestamp: number;
  cancelled: boolean;
}

export class RaceConditionHandler {
  private operations: Map<string, AsyncOperation<any>> = new Map();
  private locks: Map<string, boolean> = new Map();

  /**
   * Execute an async operation with race condition protection
   */
  async execute<T>(
    key: string,
    operation: () => Promise<T>,
    options: {
      timeout?: number;
      debounce?: number;
      cancelPrevious?: boolean;
    } = {}
  ): Promise<T> {
    const { timeout = 30000, debounce = 0, cancelPrevious = true } = options;

    // Cancel previous operation if requested
    if (cancelPrevious) {
      this.cancel(key);
    }

    // Check if operation is locked
    if (this.locks.get(key)) {
      throw new Error(`Operation ${key} is locked`);
    }

    // Debounce if specified
    if (debounce > 0) {
      await new Promise(resolve => setTimeout(resolve, debounce));
      
      // Check if cancelled during debounce
      const current = this.operations.get(key);
      if (current?.cancelled) {
        throw new Error(`Operation ${key} was cancelled`);
      }
    }

    // Create operation record
    const operationRecord: AsyncOperation<T> = {
      id: `${key}-${Date.now()}`,
      promise: null as any,
      timestamp: Date.now(),
      cancelled: false,
    };

    // Store operation
    this.operations.set(key, operationRecord);

    try {
      // Lock the operation
      this.locks.set(key, true);

      // Execute with timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Operation ${key} timed out`)), timeout);
      });

      const operationPromise = operation();
      operationRecord.promise = operationPromise;

      const result = await Promise.race([operationPromise, timeoutPromise]);

      // Check if cancelled
      if (operationRecord.cancelled) {
        throw new Error(`Operation ${key} was cancelled`);
      }

      return result;
    } finally {
      // Clean up
      this.locks.delete(key);
      if (this.operations.get(key)?.id === operationRecord.id) {
        this.operations.delete(key);
      }
    }
  }

  /**
   * Cancel an ongoing operation
   */
  cancel(key: string): void {
    const operation = this.operations.get(key);
    if (operation) {
      operation.cancelled = true;
      this.operations.delete(key);
    }
    this.locks.delete(key);
  }

  /**
   * Check if an operation is in progress
   */
  isInProgress(key: string): boolean {
    return this.operations.has(key) || this.locks.has(key);
  }

  /**
   * Clear all operations
   */
  clear(): void {
    this.operations.forEach(op => {
      op.cancelled = true;
    });
    this.operations.clear();
    this.locks.clear();
  }
}

// Singleton instance
export const raceConditionHandler = new RaceConditionHandler();

/**
 * Mutex for critical sections
 */
export class Mutex {
  private locked = false;
  private queue: (() => void)[] = [];

  async acquire(): Promise<() => void> {
    while (this.locked) {
      await new Promise<void>(resolve => this.queue.push(resolve));
    }
    
    this.locked = true;
    
    return () => {
      this.locked = false;
      const next = this.queue.shift();
      if (next) {
        next();
      }
    };
  }

  async runExclusive<T>(callback: () => Promise<T>): Promise<T> {
    const release = await this.acquire();
    try {
      return await callback();
    } finally {
      release();
    }
  }
}

/**
 * Semaphore for limiting concurrent operations
 */
export class Semaphore {
  private current = 0;
  private queue: (() => void)[] = [];

  constructor(private max: number) {}

  async acquire(): Promise<() => void> {
    while (this.current >= this.max) {
      await new Promise<void>(resolve => this.queue.push(resolve));
    }
    
    this.current++;
    
    return () => {
      this.current--;
      const next = this.queue.shift();
      if (next) {
        next();
      }
    };
  }

  async runWithLimit<T>(callback: () => Promise<T>): Promise<T> {
    const release = await this.acquire();
    try {
      return await callback();
    } finally {
      release();
    }
  }
}

/**
 * Debounced queue for batching operations
 */
export class DebouncedQueue<T> {
  private items: T[] = [];
  private timer: NodeJS.Timeout | null = null;
  private processing = false;

  constructor(
    private processor: (items: T[]) => Promise<void>,
    private delay: number = 500,
    private maxBatchSize: number = 100
  ) {}

  add(item: T): void {
    this.items.push(item);

    // Process immediately if batch is full
    if (this.items.length >= this.maxBatchSize) {
      this.process();
      return;
    }

    // Reset timer
    if (this.timer) {
      clearTimeout(this.timer);
    }

    // Set new timer
    this.timer = setTimeout(() => this.process(), this.delay);
  }

  private async process(): Promise<void> {
    if (this.processing || this.items.length === 0) {
      return;
    }

    // Clear timer
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    // Get items to process
    const batch = this.items.splice(0, this.maxBatchSize);
    this.processing = true;

    try {
      await this.processor(batch);
    } catch (error) {
      console.error('Error processing batch:', error);
      // Re-add items to queue on error
      this.items.unshift(...batch);
    } finally {
      this.processing = false;
      
      // Process remaining items if any
      if (this.items.length > 0) {
        this.timer = setTimeout(() => this.process(), this.delay);
      }
    }
  }

  clear(): void {
    this.items = [];
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}

/**
 * Request deduplication
 */
export class RequestDeduplicator {
  private cache: Map<string, Promise<any>> = new Map();
  private timestamps: Map<string, number> = new Map();

  async deduplicate<T>(
    key: string,
    factory: () => Promise<T>,
    ttl: number = 5000
  ): Promise<T> {
    // Check cache
    const cached = this.cache.get(key);
    const timestamp = this.timestamps.get(key);
    
    if (cached && timestamp && Date.now() - timestamp < ttl) {
      return cached;
    }

    // Create new request
    const promise = factory().finally(() => {
      // Clean up after TTL
      setTimeout(() => {
        if (this.cache.get(key) === promise) {
          this.cache.delete(key);
          this.timestamps.delete(key);
        }
      }, ttl);
    });

    this.cache.set(key, promise);
    this.timestamps.set(key, Date.now());

    return promise;
  }

  clear(): void {
    this.cache.clear();
    this.timestamps.clear();
  }
} 