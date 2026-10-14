import base64
import os

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from app.core.config import get_settings


def _get_key() -> bytes:
    raw = get_settings().ENCRYPTION_KEY
    key = base64.b64decode(raw)
    if len(key) not in (16, 24, 32):
        raise ValueError("ENCRYPTION_KEY must decode to 16, 24, or 32 bytes")
    return key


def encrypt(plaintext: str) -> str:
    key = _get_key()
    nonce = os.urandom(12)
    aesgcm = AESGCM(key)
    ciphertext = aesgcm.encrypt(nonce, plaintext.encode(), None)
    return base64.b64encode(nonce + ciphertext).decode()


def decrypt(ciphertext_b64: str) -> str:
    key = _get_key()
    data = base64.b64decode(ciphertext_b64)
    nonce, ciphertext = data[:12], data[12:]
    aesgcm = AESGCM(key)
    return aesgcm.decrypt(nonce, ciphertext, None).decode()
