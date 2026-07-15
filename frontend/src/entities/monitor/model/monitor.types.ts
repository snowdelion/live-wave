export enum MonitorType {
  HTTP = 'HTTP',
  TCP = 'TCP',
  ICMP = 'ICMP',
  DNS = 'DNS',
}

export enum DnsRecordType {
  A = 'A',
  AAAA = 'AAAA',
  CNAME = 'CNAME',
  TXT = 'TXT',
  MX = 'MX',
}

export enum MonitorStatus {
  up = 'up',
  down = 'down',
}
