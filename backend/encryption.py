from __future__ import annotations  # backend/encryption.py

from pathlib import Pat
from dotenv import load_dotenv
import os
from cryptography.fernet import Fernet

# Load .env from project root (one level above backend/)
ROOT_DIR = Path(__file__).resolve().parents[1]
load_dotenv(ROOT_DIR / ".env")

ENV_VAR_NAME = "EVENT_TITLE_KEY"


def generate_key() -> str:
    """
    Helper to generate a new key once.
    Run this *locally* and paste the value into your .env.
    """
    return Fernet.generate_key().decode("utf-8")


def _get_fernet() -> Fernet:
    key = os.environ.get(ENV_VAR_NAME)
    if not key:
        raise RuntimeError(
            f"{ENV_VAR_NAME} is not set. Generate one with "
            "`from backend.encryption import generate_key; print(generate_key())` "
            "and put it in your .env / env vars."
        )
    return Fernet(key.encode("utf-8"))


def encrypt_title(plain_title: str) -> str:
    """
    Encrypts the event title.
    Returns a base64-encoded string safe to store in the DB.
    """
    f = _get_fernet()
    token = f.encrypt(plain_title.encode("utf-8"))
    return token.decode("utf-8")


def decrypt_title(encrypted_title: str) -> str:
    """
    Decrypts an encrypted event title from the DB.
    """
    f = _get_fernet()
    plain = f.decrypt(encrypted_title.encode("utf-8"))
    return plain.decode("utf-8")
