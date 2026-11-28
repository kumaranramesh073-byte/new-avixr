/* ═══════════════════════════════════════════════════════════════════════════
   Q-Simutron — Connector & OAuth Credential Vault (AES-256-GCM)
   Encrypts external connector & OAuth credentials at rest using AES-256-GCM.
   Requires CONNECTOR_ENCRYPTION_KEY (min 32 chars) — NEVER falls back to
   SUPABASE_SERVICE_ROLE_KEY or any weak/default key.
   Supports decrypting legacy v1 envelopes and writes hardened v2 envelopes
   with per-record random 16-byte scrypt salts and 12-byte random IVs.
   ═══════════════════════════════════════════════════════════════════════════ */

import crypto from 'node:crypto';

export interface EncryptedEnvelopeV1 {
    v: 1;
    alg: 'aes-256-gcm';
    iv: string;
    tag: string;
    ciphertext: string;
}

export interface EncryptedEnvelopeV2 {
    v: 2;
    alg: 'aes-256-gcm';
    salt: string;
    iv: string;
    tag: string;
    ciphertext: string;
}

export type EncryptedEnvelope = EncryptedEnvelopeV1 | EncryptedEnvelopeV2;

const LEGACY_V1_SALT = 'qsimutron-connector-vault-v1';
const MIN_KEY_LENGTH = 32;

function getMasterSecret(): string {
    const rawSecret = (process.env.CONNECTOR_ENCRYPTION_KEY || '').trim();
    if (!rawSecret || rawSecret.length < MIN_KEY_LENGTH) {
        throw new Error(
            `Connector vault key unavailable or too weak: set CONNECTOR_ENCRYPTION_KEY (minimum ${MIN_KEY_LENGTH} characters) on backend`
        );
    }
    return rawSecret;
}

function deriveKey(salt: string | Buffer): Buffer {
    return crypto.scryptSync(getMasterSecret(), salt, 32);
}

export function encryptCredentials(credentials: Record<string, unknown>): EncryptedEnvelopeV2 {
    const salt = crypto.randomBytes(16);
    const key = deriveKey(salt);
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const plaintext = JSON.stringify(credentials ?? {});
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    return {
        v: 2,
        alg: 'aes-256-gcm',
        salt: salt.toString('hex'),
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
        ciphertext: encrypted.toString('hex'),
    };
}

export function decryptCredentials(envelope: unknown): Record<string, string> {
    if (!envelope || typeof envelope !== 'object') {
        return {};
    }
    const env = envelope as Record<string, unknown>;
    if (
        env.alg !== 'aes-256-gcm' ||
        typeof env.iv !== 'string' ||
        typeof env.tag !== 'string' ||
        typeof env.ciphertext !== 'string'
    ) {
        return {};
    }

    let key: Buffer;
    if (env.v === 2) {
        if (typeof env.salt !== 'string' || !env.salt) return {};
        key = deriveKey(Buffer.from(env.salt, 'hex'));
    } else if (env.v === 1) {
        // Legacy v1 compatibility for existing enterprise connector records
        key = deriveKey(LEGACY_V1_SALT);
    } else {
        return {};
    }

    const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        key,
        Buffer.from(env.iv, 'hex')
    );
    decipher.setAuthTag(Buffer.from(env.tag, 'hex'));

    const decrypted = Buffer.concat([
        decipher.update(Buffer.from(env.ciphertext, 'hex')),
        decipher.final(),
    ]);

    const parsed = JSON.parse(decrypted.toString('utf8')) as Record<string, unknown>;
    const normalized: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed)) {
        if (v !== undefined && v !== null && String(v).trim() !== '') {
            normalized[k] = String(v);
        }
    }
    return normalized;
}

/**
 * Removes embedded credentials (e.g., URI passwords, Bearer tokens, private keys)
 * before logging or returning an error string to the frontend.
 */
export function sanitizeErrorMessage(err: unknown): string {
    const raw = err instanceof Error ? err.message : String(err ?? 'Unknown connector error');
    return raw
        .replace(/:\/\/([^:/\s]+):([^@/\s]+)@/g, '://$1:***@')
        .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer ***')
        .replace(/-----BEGIN [A-Z ]+PRIVATE KEY-----[\s\S]*?-----END [A-Z ]+PRIVATE KEY-----/g, '[REDACTED_PRIVATE_KEY]')
        .replace(/(password|secret|token|apikey|api_key|private_key|refresh_token|access_token)=([^&\s]+)/gi, '$1=***')
        .slice(0, 600);
}
