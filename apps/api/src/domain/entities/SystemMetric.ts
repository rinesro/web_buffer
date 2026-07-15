export interface SystemMetric {
  id: string;
  serverId: string;
  cpuUsagePercent: number;
  ramUsagePercent: number;
  ramUsedMb: number;
  ramTotalMb: number;
  diskUsagePercent: number;
  diskUsedGb: number;
  diskTotalGb: number;
  bufferUsagePercent: number;
  bufferUsedMb: number;
  bufferTotalMb: number;
  recordedAt: Date;
  createdAt: Date;
}

/** A single sample before it is persisted and assigned an id/serverId/timestamps. */
export interface SystemMetricSample {
  cpuUsagePercent: number;
  ramUsagePercent: number;
  ramUsedMb: number;
  ramTotalMb: number;
  diskUsagePercent: number;
  diskUsedGb: number;
  diskTotalGb: number;
  bufferUsagePercent: number;
  bufferUsedMb: number;
  bufferTotalMb: number;
}
