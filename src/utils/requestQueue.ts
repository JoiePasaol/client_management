// src/utils/requestQueue.ts
class RequestQueue {
    private queue: Array<{request: () => Promise<any>, resolve: (value: any) => void, reject: (error: any) => void}> = [];
    private isProcessing = false;
    private concurrentLimit = 2;
    private activeRequests = 0;
  
    async add<T>(request: () => Promise<T>): Promise<T> {
      return new Promise((resolve, reject) => {
        this.queue.push({ request, resolve, reject });
        this.processQueue();
      });
    }
  
    private async processQueue() {
      if (this.isProcessing || this.queue.length === 0 || this.activeRequests >= this.concurrentLimit) return;
      
      this.isProcessing = true;
      this.activeRequests++;
      
      const item = this.queue.shift();
      if (!item) {
        this.isProcessing = false;
        this.activeRequests--;
        return;
      }
  
      try {
        const result = await item.request();
        item.resolve(result);
      } catch (error) {
        item.reject(error);
      } finally {
        this.activeRequests--;
        this.isProcessing = false;
        setTimeout(() => this.processQueue(), 100); // Small delay between requests
      }
    }
  }
  
  export const requestQueue = new RequestQueue();