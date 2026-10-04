import crypto from 'crypto'

export const ROOM_SLUGS = {
  // Terminal 1
  'terminal-1-first-steps': 'cd_ls_c4t_b4s1cs',
  'terminal-1-reading': 'sp3c1f1c_l1n3_r34d3r',
  'terminal-1-hidden': 'd0t_f1l3s_unv31l3d',
  'terminal-1-finding': 'f1nd_10k_d4t_sp3c14l1st',
  'terminal-1-grep': 'g0ld3n_t1ck3t_c4s3_1gn0r3d',
  'terminal-1-pipes': 'p1p3_fr3qu3ncy_pr0',
  'terminal-1-archives': 'p33l_th3_c0mpr3ss10n',
  'terminal-1-strings': 'str1ngs_b1n4ry_extr4ct',
  'terminal-1-log-detective': '34rl13st_4tt4ck3r_l0g',
  'terminal-1-needle': 'm3t4d4t4_4ud1t_n33dl3',

  // Terminal 2
  'terminal-2-perms': 'p3rm1ss10n_m4st3r',
  'terminal-2-groups': 'gr0up_m3mb3rsh1p',
  'terminal-2-env': '3nv_v4r_s3cr3ts',
  'terminal-2-scripts': 'sh3ll_scr1pt_4ud1t',
  'terminal-2-escalation': 'sud0_pr1v_3sc',
  'terminal-2-cron-watch': 'cr0n_j0b_t4mp3r',
  'terminal-2-path-order': 'p4th_h1j4ck_pr0',
  'terminal-2-suid-audit': 'su1d_b1n4ry_hunt',
  'terminal-2-misconfig-chain': 'm1sc0nf1g_ch41n_r00t',
  'terminal-2-audit-report': 'sys_4ud1t_cl34r',

  // Network
  'network-ports': 'p0rt_sc4nn3r_n00b',
  'network-scan': 'nm4p_sw33p_m4st3r',
  'network-banner': 'b4nn3r_gr4bb1ng',
  'network-capture': 'p4ck3t_sn1ff3r',
  'network-dns': 'dns_z0n3_tr4nsf3r',
  'network-http': 'h34d3rs_4nd_m3th0ds',
  'network-protocol-id': 'pr0t0c0l_4n4lys1s',
  'network-firewall': 'f1r3w4ll_byp4ss_r0cks',
  'network-pcap-forensics': 'w1r3sh4rk_pcap_d1gg3r',
  'network-pivot': 'subn3t_p1v0t_4ch13v3d',

  // Web
  'web-recon': 'd1r_bust3r_3num',
  'web-devtools': 'c0ns0l3_h4ck3r',
  'web-cookie-trust': 'c00k13_m0d1f13r',
  'web-client-trust': 'cl13nt_s1d3_byp4ss',
  'web-idor': '1d0r_p4r4m_t4mp3r',
  'web-sqli': 'un10n_s3l3ct_byp4ss',
  'web-reflected-xss': 'xss_scr1pt_4l3rt',
  'web-headers': 'c0rs_h34d3r_sp00f',
  'web-stored-xss': 'p3rs1st3nt_p4yl04d',
  'web-chain': 'full_ch41n_3xpl01t',

  // Secure Coding
  'secure-sqli': 'pr3p4r3d_st4t3m3nts_w1n',
  'secure-xss': 's4n1t1z3_y0ur_1nputs',
  'secure-idor': 's3ss10n_b4s3d_4uth',
  'secure-client': 's3rv3r_v4l1d4t10n_ru13s',
  'secure-headers': 'csp_str1ct_h34d3rs',
  'secure-rate-limit': 't0k3n_buck3t_l1m1t',
  'secure-hide-secret': 'k33p_3nv_s3cr3t',
  'secure-full-review': 'c0d3_4ud1t_ch4mp10n',

  // Introduction scenes
  'build-tool': 'bld_t00l_f0und',
  'hidden-page': 'h1dd3n_p4g3_sp0tt3d',
  'guestbook': 'gu3stb00k_xss',
  'coffee-shop-wifi': 'w1f1_p4ck3t_sn1ff',
  'encoded-memo': 'b4s364_d3c0d3d',
  'support-form': 'f0rm_1nj3ct10n',
  'somebodys-invoice': '1nv01c3_1d0r',
  'dotdotdot-folder': 'd1r_tr4v3rs4l',
  'phone-call': 's0c14l_3ng1n33r1ng',
}

// Per-student unforgeable flag (picoCTF style).
// Format: BK{<room_leetspeak_prefix>_<16_hex_hmac>}
export function flagFor(userId, roomId) {
  const slug = ROOM_SLUGS[roomId] || String(roomId || 'room').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
  const mac = crypto
    .createHmac('sha256', process.env.FLAG_HMAC_SECRET)
    .update(`${userId}:${roomId}`)
    .digest('hex')
    .slice(0, 16)
  return `BK{${slug}_${mac}}`
}

export function checkFlag(userId, roomId, submitted) {
  const sub = String(submitted || '').trim()
  if (!sub) return false

  const expected = flagFor(userId, roomId)
  const a = Buffer.from(expected)
  const b = Buffer.from(sub)
  if (a.length === b.length && crypto.timingSafeEqual(a, b)) return true

  // Legacy fallback: BK{24-hex-mac}
  const legacyMac = crypto
    .createHmac('sha256', process.env.FLAG_HMAC_SECRET)
    .update(`${userId}:${roomId}`)
    .digest('hex')
    .slice(0, 24)
  const legacyExpected = `BK{${legacyMac}}`
  const la = Buffer.from(legacyExpected)
  if (la.length === b.length && crypto.timingSafeEqual(la, b)) return true

  return false
}

// Identifies decoy flags submitted by students blind-grepping
export function isDecoyFlag(submitted, roomId) {
  const s = String(submitted || '').trim()
  if (!s.startsWith('BK{') || !s.endsWith('}')) return false
  const inner = s.slice(3, -1).toLowerCase()
  const decoyKeywords = [
    'decoy', 'fake', 'trap', 'wrong', 'expired', 'stale', 'backup',
    'silver', 'bronze', 'copper', 'platinum', 'too_small', 'not_the',
    'nice_try', 'wont_save_you', 'must_use', 'did_you_check', 'glitters',
    'only_a_backup', 'rotated_out', 'check_the_owner', 'check_the_perms'
  ]
  if (decoyKeywords.some((kw) => inner.includes(kw))) return true
  // If the submitted flag matches the room's prefix (e.g. BK{g0ld3n_t1ck3t_c4s3_1gn0r3d_...}),
  // but was already rejected by checkFlag, it was one of the decoy flags planted in that room!
  if (roomId && ROOM_SLUGS[roomId] && inner.startsWith(ROOM_SLUGS[roomId])) {
    return true
  }
  return false
}

export function randomAlphanumeric(n = 8) {
  // Unambiguous set: no 0/O, 1/I/L
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  const bytes = crypto.randomBytes(n)
  let out = ''
  for (let i = 0; i < n; i++) out += alphabet[bytes[i] % alphabet.length]
  return out
}

// constant-time string compare for access codes
export function safeEqual(a, b) {
  const ba = Buffer.from(String(a || ''))
  const bb = Buffer.from(String(b || ''))
  if (ba.length !== bb.length) return false
  return crypto.timingSafeEqual(ba, bb)
}
