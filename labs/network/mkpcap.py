#!/usr/bin/env python3
"""Minimal, dependency-free pcap writer for the network dungeon.

Writes a classic pcap (Ethernet/IPv4/TCP) from a list of packets so the lab
images don't need scapy. Checksums are left zero — tshark still dissects the
payload (it only warns), which is all these rooms need. Each packet:
    (src_ip, dst_ip, sport, dport, payload_bytes, [flags])
Usage as a library: build_pcap(path, packets). Payloads may be bytes or str.
"""
import struct, sys, time

def _ip_to_bytes(ip):
    return bytes(int(o) for o in ip.split('.'))

def _eth(dst=b'\x02\x00\x00\x00\x00\x02', src=b'\x02\x00\x00\x00\x00\x01'):
    return dst + src + b'\x08\x00'  # IPv4

def _ipv4(src, dst, payload_len, proto=6):
    ver_ihl = 0x45
    tos = 0
    total = 20 + payload_len
    ident = 0
    flags_frag = 0
    ttl = 64
    chksum = 0
    hdr = struct.pack('!BBHHHBBH4s4s', ver_ihl, tos, total, ident, flags_frag,
                      ttl, proto, chksum, _ip_to_bytes(src), _ip_to_bytes(dst))
    return hdr

def _tcp(sport, dport, payload_len, flags=0x18, seq=1, ack=1):
    # 0x18 = PSH+ACK (looks like a data segment to dissectors)
    data_off = (5 << 4)
    win = 65535
    chksum = 0
    urg = 0
    return struct.pack('!HHIIBBHHH', sport, dport, seq, ack, data_off, flags,
                       win, chksum, urg)

def build_pcap(path, packets):
    out = bytearray()
    # global header: magic, v2.4, tz0, sig0, snaplen, linktype=1 (Ethernet)
    out += struct.pack('!IHHiIII', 0xa1b2c3d4, 2, 4, 0, 0, 65535, 1)
    t = int(time.time())
    for i, pkt in enumerate(packets):
        src, dst, sport, dport, payload = pkt[0], pkt[1], pkt[2], pkt[3], pkt[4]
        flags = pkt[5] if len(pkt) > 5 else 0x18
        if isinstance(payload, str):
            payload = payload.encode()
        frame = _eth() + _ipv4(src, dst, 20 + len(payload)) + \
                _tcp(sport, dport, len(payload), flags=flags, seq=1 + i, ack=1) + payload
        out += struct.pack('!IIII', t + i, 0, len(frame), len(frame)) + frame
    with open(path, 'wb') as f:
        f.write(out)

if __name__ == '__main__':
    # self-test: an HTTP POST login with a password
    build_pcap(sys.argv[1] if len(sys.argv) > 1 else '/tmp/t.pcap', [
        ('10.0.0.5', '10.0.0.9', 49152, 80,
         'POST /login HTTP/1.1\r\nHost: keep\r\nContent-Type: application/x-www-form-urlencoded\r\n\r\nuser=admin&pass=HELLO123\r\n'),
    ])
    print('wrote')
