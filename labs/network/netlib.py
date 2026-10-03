"""Tiny TCP server helper for the network dungeon rooms. No dependencies.
A room's server.py imports this (same dir) and registers responders."""
import socket, threading, time, sys

def serve(ip, port, responder, read_first=True):
    """Bind ip:port and, for each connection, call responder(data)->str/bytes.
    responder gets whatever the client sent first (or b'' if nothing)."""
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    try:
        s.bind((ip, port))
    except OSError as e:
        print(f'[netlib] bind {ip}:{port} failed: {e}', file=sys.stderr)
        return
    s.listen(32)

    def handle(c):
        data = b''
        if read_first:
            c.settimeout(0.5)
            try: data = c.recv(512)
            except OSError: pass
        try:
            out = responder(data)
            if out:
                c.sendall(out if isinstance(out, bytes) else out.encode())
        except OSError:
            pass
        finally:
            try: c.close()
            except OSError: pass

    while True:
        try: c, _ = s.accept()
        except OSError: break
        threading.Thread(target=handle, args=(c,), daemon=True).start()

def start(ip, port, responder, read_first=True):
    threading.Thread(target=serve, args=(ip, port, responder, read_first), daemon=True).start()

def hold():
    while True:
        time.sleep(3600)
