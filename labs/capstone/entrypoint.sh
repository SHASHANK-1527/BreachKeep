#!/bin/bash
# Capstone target "Keep Admin Portal" — ONE shared, rootable box the class
# attacks from their own Kali VMs. Multiple recon paths lead to the same SSH
# creds (Goosebumps-style: many ways in), each path salted with a DECOY flag
# that doubles as a path-aware hint when submitted. Real flag = root.txt.
#
# Vulnerabilities are configuration/recon, not exploit code: leaked creds in the
# webroot + a sudo misconfig for privilege escalation. Deliberately vulnerable
# and exposed — run only on an isolated host.
set -e
FLAG="${CAPSTONE_FLAG:-BK{dev-capstone-root-flag}}"
U=gale
P=autumn2024

# --- the real prize: root flag ---
printf '%s\n' "$FLAG" > /root/root.txt
chmod 600 /root/root.txt; chown root:root /root/root.txt

# --- low-priv user whose creds are leaked by the web paths ---
id "$U" >/dev/null 2>&1 || useradd -m -s /bin/bash "$U"
echo "$U:$P" | chpasswd
printf 'BK{user_flag_on_the_box}\n' > /home/$U/user.txt
chown $U:$U /home/$U/user.txt; chmod 644 /home/$U/user.txt
mkdir -p /opt/notes
cat > /opt/notes/todo.txt <<'TXT'
TODO (gale):
 - rotate that old backup in the webroot, it still has my creds
 - why can I run `less` as root now? ask ops (hint to self: sudo -l)
 - leaving this note: BK{almost_there_check_sudo}
TXT
chmod 644 /opt/notes/todo.txt

# --- the privilege-escalation misconfig: gale may run less as root ---
# `sudo less /root/root.txt` reads it directly (and less is a known GTFOBins
# shell vector too). This is the intended root path.
echo "$U ALL=(root) NOPASSWD: /usr/bin/less" > /etc/sudoers.d/gale
chmod 440 /etc/sudoers.d/gale

# --- web content: several recon paths to the same creds, each with a decoy ---
mkdir -p /var/www/backup /var/www/internal
cat > /var/www/index.html <<'HTML'
<!doctype html><html><head><title>Keep Admin Portal</title></head>
<body><h1>Keep Admin Portal</h1><p>Authorised wardens only. Nothing to see here.</p>
<!-- dev note: health check moved to /internal/status -->
</body></html>
HTML
cat > /var/www/robots.txt <<'TXT'
User-agent: *
Disallow: /backup/
Disallow: /internal/
# nothing to see here, mover along  BK{robots_said_no}
TXT
cat > /var/www/backup/app.conf.bak <<TXT
# old keepd config backup — DELETE ME before go-live
ssh_host=localhost
ssh_user=$U
ssh_pass=$P
# BK{backup_left_in_webroot}
TXT
cat > /var/www/.env <<TXT
APP_ENV=prod
DB_HOST=127.0.0.1
SSH_USER=$U
SSH_PASS=$P
# BK{env_file_exposed}
TXT
cat > /var/www/internal/status <<TXT
service: keepd
state: ok
operator: $U
# BK{html_source_comment}
TXT
chmod -R 755 /var/www

# --- services: sshd (foothold) + web (recon) ---
ssh-keygen -A >/dev/null 2>&1 || true
mkdir -p /run/sshd /etc/ssh/sshd_config.d
cat > /etc/ssh/sshd_config.d/keep.conf <<'CONF'
PermitRootLogin no
PasswordAuthentication yes
UsePAM yes
CONF
/usr/sbin/sshd -D &
echo "[capstone] sshd up on 22, web up on 80 (user $U)"
exec python3 -m http.server 80 --directory /var/www
