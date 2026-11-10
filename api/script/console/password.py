import bcrypt

password = b"12345678"

print(bcrypt.hashpw(password, bcrypt.gensalt()))
