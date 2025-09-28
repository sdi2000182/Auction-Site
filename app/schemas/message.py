from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class MessageBase(BaseModel):
    subject: str
    content: str


class MessageCreate(MessageBase):
    receiver_id: int
    item_id: Optional[int] = None

class MessageUpdate(BaseModel):
    pass
    

class MessageInDBBase(MessageBase):
    id: int
    is_read: bool
    sender_id: int
    receiver_id: int
    item_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class Message(MessageInDBBase):
    sender_username: str
    receiver_username: str
    item_name: Optional[str] = None


class MessageSummary(BaseModel):
    id: int
    subject: str
    sender_username: str
    receiver_username: str
    is_read: bool
    created_at: datetime
    item_name: Optional[str] = None

    class Config:
        from_attributes = True


class MessageMarkRead(BaseModel):
    message_ids: list[int]