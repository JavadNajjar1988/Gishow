from typing import Literal
from pydantic import BaseModel, ConfigDict, Field, field_validator
from .security import normalize_mobile

class Input(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=False)

class MobileInput(Input):
    mobile: str = Field(min_length=10, max_length=16)
    @field_validator('mobile')
    @classmethod
    def mobile_valid(cls, value):
        return normalize_mobile(value)

class PasswordInput(Input):
    password: str = Field(min_length=12, max_length=128)

class Register(MobileInput, PasswordInput):
    full_name: str = Field(min_length=2, max_length=150)
    national_code: str | None = Field(default=None, pattern=r'^[0-9]{10}$')
    @field_validator('full_name')
    @classmethod
    def name_valid(cls, value):
        value = value.strip()
        if len(value) < 2:
            raise ValueError('نام معتبر نیست.')
        return value

class Login(MobileInput):
    password: str = Field(min_length=1, max_length=128)

class Profile(Input):
    full_name: str = Field(min_length=2, max_length=150)
    national_code: str | None = Field(default=None, pattern=r'^[0-9]{10}$')
    current_password: str = Field(min_length=1, max_length=128)
    _name_valid = field_validator('full_name')(Register.name_valid.__func__)

class PasswordChange(PasswordInput):
    current_password: str = Field(min_length=1, max_length=128)

class CurrentPassword(Input):
    current_password: str = Field(min_length=1, max_length=128)

class PasswordRecovery(MobileInput, PasswordInput):
    recovery_code: str = Field(pattern=r'^[a-f0-9]{32}$')

class RoleInput(Input):
    code: str = Field(pattern=r'^[a-z][a-z0-9_]{2,49}$')
    name: str = Field(min_length=2, max_length=150)
    scope: Literal['global', 'event']
    permissions: list[str] = Field(default_factory=list, max_length=30)

class AssignRole(Input):
    role_id: int = Field(gt=0)
    event_id: int | None = Field(default=None, gt=0)

class Override(Input):
    permission_code: str
    allowed: bool

class UserState(Input):
    is_active: bool
