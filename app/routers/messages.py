from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from schemas.message import Message, MessageCreate, MessageSummary, MessageMarkRead
from repositories.message import MessageRepository
from repositories.user import UserRepository
from repositories.item import ItemRepository
from models.user import User as UserModel
from auth.dependencies import get_approved_user

router = APIRouter(prefix="/messages", tags=["messages"])


@router.post("/", response_model=Message)
async def send_message(
    message_create: MessageCreate,
    current_user: UserModel = Depends(get_approved_user),
    db: Session = Depends(get_db)
):
    message_repo = MessageRepository(db)
    user_repo = UserRepository(db)
    item_repo = ItemRepository(db)
    
    # Validate receiver exists
    receiver = user_repo.get(message_create.receiver_id)
    if not receiver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Receiver not found"
        )
    
    # Validate item exists if provided
    if message_create.item_id:
        item = item_repo.get(message_create.item_id)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Item not found"
            )
    
    # Create message
    message = message_repo.create_message(message_create, current_user.id)
    
    # Return message with additional details
    message_with_details = message_repo.get(message.id)
    return Message(
        id=message_with_details.id,
        subject=message_with_details.subject,
        content=message_with_details.content,
        is_read=message_with_details.is_read,
        sender_id=message_with_details.sender_id,
        receiver_id=message_with_details.receiver_id,
        item_id=message_with_details.item_id,
        created_at=message_with_details.created_at,
        sender_username=current_user.username,
        receiver_username=receiver.username,
        item_name=item.name if message_create.item_id else None
    )


@router.get("/", response_model=List[MessageSummary])
async def get_messages(
    folder: str = Query("inbox", regex="^(inbox|sent|all)$"),
    skip: int = 0,
    limit: int = 100,
    current_user: UserModel = Depends(get_approved_user),
    db: Session = Depends(get_db)
):
    message_repo = MessageRepository(db)
    messages = message_repo.get_user_messages(
        current_user.id, 
        folder=folder, 
        skip=skip, 
        limit=limit
    )
    
    # Convert to MessageSummary format
    message_summaries = []
    for msg in messages:
        message_summaries.append(MessageSummary(
            id=msg.id,
            subject=msg.subject,
            sender_username=msg.sender.username,
            receiver_username=msg.receiver.username,
            is_read=msg.is_read,
            created_at=msg.created_at,
            item_name=msg.item.name if msg.item else None
        ))
    
    return message_summaries


@router.get("/unread-count", response_model=dict)
async def get_unread_count(
    current_user: UserModel = Depends(get_approved_user),
    db: Session = Depends(get_db)
):
    message_repo = MessageRepository(db)
    count = message_repo.get_unread_count(current_user.id)
    return {"unread_count": count}


@router.get("/conversation/{other_user_id}", response_model=List[Message])
async def get_conversation(
    other_user_id: int,
    item_id: Optional[int] = None,
    current_user: UserModel = Depends(get_approved_user),
    db: Session = Depends(get_db)
):
    message_repo = MessageRepository(db)
    user_repo = UserRepository(db)
    
    # Validate other user exists
    other_user = user_repo.get(other_user_id)
    if not other_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    messages = message_repo.get_conversation(
        current_user.id, 
        other_user_id, 
        item_id
    )
    
    # Convert to Message format with usernames
    conversation = []
    for msg in messages:
        conversation.append(Message(
            id=msg.id,
            subject=msg.subject,
            content=msg.content,
            is_read=msg.is_read,
            sender_id=msg.sender_id,
            receiver_id=msg.receiver_id,
            item_id=msg.item_id,
            created_at=msg.created_at,
            sender_username=msg.sender.username,
            receiver_username=msg.receiver.username,
            item_name=msg.item.name if msg.item else None
        ))
    
    return conversation


@router.put("/mark-read", response_model=dict)
async def mark_messages_as_read(
    mark_read: MessageMarkRead,
    current_user: UserModel = Depends(get_approved_user),
    db: Session = Depends(get_db)
):
    message_repo = MessageRepository(db)
    updated_count = message_repo.mark_as_read(mark_read.message_ids, current_user.id)
    return {"message": f"Marked {updated_count} messages as read"}


@router.get("/{message_id}", response_model=Message)
async def get_message(
    message_id: int,
    current_user: UserModel = Depends(get_approved_user),
    db: Session = Depends(get_db)
):
    message_repo = MessageRepository(db)
    message = message_repo.get(message_id)
    
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    # Check if user is sender or receiver
    if message.sender_id != current_user.id and message.receiver_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this message"
        )
    
    # Mark as read if user is the receiver
    if message.receiver_id == current_user.id and not message.is_read:
        message_repo.mark_as_read([message.id], current_user.id)
        message.is_read = True
    
    return Message(
        id=message.id,
        subject=message.subject,
        content=message.content,
        is_read=message.is_read,
        sender_id=message.sender_id,
        receiver_id=message.receiver_id,
        item_id=message.item_id,
        created_at=message.created_at,
        sender_username=message.sender.username,
        receiver_username=message.receiver.username,
        item_name=message.item.name if message.item else None
    )


@router.delete("/{message_id}", response_model=dict)
async def delete_message(
    message_id: int,
    current_user: UserModel = Depends(get_approved_user),
    db: Session = Depends(get_db)
):
    message_repo = MessageRepository(db)
    
    success = message_repo.delete_message(message_id, current_user.id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found or not authorized to delete"
        )
    
    return {"message": "Message deleted successfully"}