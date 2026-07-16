import si from 'systeminformation';
import type { SystemMetricSample } from '../../domain/entities/SystemMetric';

/**
 * Collects real resource usage from the machine running this Node.js process.
 *
 * "Buffer" usage maps to `mem().buffcache` from the `systeminformation` package, which on
 * Linux reports the kernel's page cache + buffer memory. On Windows/macOS this value is
 * frequently reported as 0 by the OS itself (those platforms don't expose an equivalent
 * buffer/cache figure the same way) — this is a platform limitation of the underlying OS
 * counters, not a bug in this collector.
 *
 * This collector only has visibility into the host it runs on. A registered Server record
 * that represents a *different* physical machine will not receive real samples from this
 * collector; wiring up a remote agent (e.g. a lightweight process on that machine posting to
 * an ingest endpoint) is the natural extension point — SystemMetricService.record() already
 * accepts an arbitrary serverId and is not tied to this collector's host.
 */
export class SystemMetricsCollector {
  async sample(): Promise<SystemMetricSample> {
    const [cpu, mem, disks] = await Promise.all([si.currentLoad(), si.mem(), si.fsSize()]);

    const primaryDisk = disks[0];
    const diskTotalBytes = primaryDisk?.size ?? 0;
    const diskUsedBytes = primaryDisk?.used ?? 0;
    const diskUsagePercent = diskTotalBytes > 0 ? (diskUsedBytes / diskTotalBytes) * 100 : 0;

    const ramUsagePercent = mem.total > 0 ? (mem.active / mem.total) * 100 : 0;
    const bufferUsagePercent = mem.total > 0 ? (mem.buffcache / mem.total) * 100 : 0;

    return {
      cpuUsagePercent: round2(cpu.currentLoad),
      ramUsagePercent: round2(ramUsagePercent),
      ramUsedMb: round2(mem.active / (1024 * 1024)),
      ramTotalMb: round2(mem.total / (1024 * 1024)),
      diskUsagePercent: round2(diskUsagePercent),
      diskUsedGb: round2(diskUsedBytes / (1024 * 1024 * 1024)),
      diskTotalGb: round2(diskTotalBytes / (1024 * 1024 * 1024)),
      bufferUsagePercent: round2(bufferUsagePercent),
      bufferUsedMb: round2(mem.buffcache / (1024 * 1024)),
      bufferTotalMb: round2(mem.total / (1024 * 1024)),
    };
  }
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
