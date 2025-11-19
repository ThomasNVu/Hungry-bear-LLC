from backend.encryption import encrypt_title, decrypt_title

original = 'Demo Title'
encrypted = encrypt_title(original)
decrypted = decrypt_title(encrypted)

print('Original:', original)
print('Encrypted:', encrypted)
print('Decrypted:', decrypted)
