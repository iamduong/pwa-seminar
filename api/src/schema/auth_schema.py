from pydantic import BaseModel


class RegisterUser(BaseModel):
    full_name: str
    email: str
    password: str
    phone: str

class Login(BaseModel):
    identifier: str
    password: str


class ChangePassword(BaseModel):
    current_password: str
    new_password: str
