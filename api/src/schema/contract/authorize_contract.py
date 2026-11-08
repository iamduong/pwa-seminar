from pydantic import BaseModel, Field


class RegisterUser(BaseModel):
    full_name: str = Field(min_length=2, max_length=150)
    email: str = Field(min_length=5, max_length=255)
    password: str = Field(min_length=8, max_length=128)
    phone: str = Field(min_length=10, max_length=30)


class LoginUser(BaseModel):
    identifier: str
    password: str


class ChangePassword(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)
