from typing import Optional, List
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_, desc
from repositories.base import BaseRepository
from models.message import Message
from schemas.message import MessageCreate, MessageUpdate


class MessageRepository(BaseRepository[Message, MessageCreate, MessageUpdate]):
    def __init__(self, db: Session):
        super().__init__(Message, db)

    def create_message(self, message_create: MessageCreate, sender_id: int) -> Message:
        message_data = message_create.dict()
        message_data["sender_id"] = sender_id
        
        db_message = Message(**message_data)
        self.db.add(db_message)
        self.db.commit()
        self.db.refresh(db_message)
        return db_message

    def get_user_messages(self, user_id: int, folder: str = "all", skip: int = 0, limit: int = 100) -> List[Message]:
        query = self.db.query(Message).options(
            joinedload(Message.sender),
            joinedload(Message.receiver),
            joinedload(Message.item)
        )

        if folder == "inbox":
            query = query.filter(Message.receiver_id == user_id)
        elif folder == "sent":
            query = query.filter(Message.sender_id == user_id)
        else:  # all
            query = query.filter(
                or_(
                    Message.sender_id == user_id,
                    Message.receiver_id == user_id
                )
            )

        return query.order_by(desc(Message.created_at)).offset(skip).limit(limit).all()

    def get_conversation(self, user1_id: int, user2_id: int, item_id: Optional[int] = None) -> List[Message]:
        query = self.db.query(Message).options(
            joinedload(Message.sender),
            joinedload(Message.receiver)
        ).filter(
            or_(
                and_(Message.sender_id == user1_id, Message.receiver_id == user2_id),
                and_(Message.sender_id == user2_id, Message.receiver_id == user1_id)
            )
        )

        if item_id:
            query = query.filter(Message.item_id == item_id)

        return query.order_by(Message.created_at).all()

    def mark_as_read(self, message_ids: List[int], user_id: int) -> int:
        """Mark messages as read, return number of updated messages"""
        updated = self.db.query(Message).filter(
            Message.id.in_(message_ids),
            Message.receiver_id == user_id,
            Message.is_read == False
        ).update({Message.is_read: True}, synchronize_session=False)
        
        self.db.commit()
        return updated

    def get_unread_count(self, user_id: int) -> int:
        return self.db.query(Message).filter(
            Message.receiver_id == user_id,
            Message.is_read == False
        ).count()

    def delete_message(self, message_id: int, user_id: int) -> bool:
        """Delete message if user is sender or receiver"""
        message = self.db.query(Message).filter(
            Message.id == message_id,
            or_(
                Message.sender_id == user_id,
                Message.receiver_id == user_id
            )
        ).first()

        if message:
            self.db.delete(message)
            self.db.commit()
            return True
        return False