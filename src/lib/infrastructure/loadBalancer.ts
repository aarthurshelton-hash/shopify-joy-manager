/**
 * Load Balancer for 55-Adapter Network
 * Distributes requests across adapter pool
 * 
 * For Alec Arthur Shelton - The Artist
 */

interface AdapterNode {
  id: string;
  domain: string;
  load: number;
  healthy: boolean;
  lastPing: number;
}

class AdapterLoadBalancer {
  private nodes: AdapterNode[] = [];
  private maxLoadPerNode = 100;

  registerNode(id: string, domain: string): void {
    this.nodes.push({
      id,
      domain,
      load: 0,
      healthy: true,
      lastPing: Date.now()
    });
  }

  getNode(domain?: string): AdapterNode | null {
    const available = this.nodes.filter(n => 
      n.healthy && 
      n.load < this.maxLoadPerNode &&
      (!domain || n.domain === domain)
    );

    if (available.length === 0) return null;

    // Least connections algorithm
    return available.reduce((min, node) => 
      node.load < min.load ? node : min
    );
  }

  incrementLoad(nodeId: string): void {
    const node = this.nodes.find(n => n.id === nodeId);
    if (node) node.load++;
  }

  decrementLoad(nodeId: string): void {
    const node = this.nodes.find(n => n.id === nodeId);
    if (node && node.load > 0) node.load--;
  }

  healthCheck(): void {
    const now = Date.now();
    this.nodes.forEach(node => {
      node.healthy = now - node.lastPing < 30000; // 30s timeout
    });
  }
}

export const adapterBalancer = new AdapterLoadBalancer();
