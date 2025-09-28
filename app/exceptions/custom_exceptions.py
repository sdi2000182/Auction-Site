from fastapi import HTTPException, status


class AuctionException(HTTPException):
    """Base auction system exception"""
    pass


class UserNotApprovedException(AuctionException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is not approved yet"
        )


class AuctionNotActiveException(AuctionException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Auction is not currently active"
        )


class InvalidBidException(AuctionException):
    def __init__(self, message: str):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid bid: {message}"
        )


class PermissionDeniedException(AuctionException):
    def __init__(self, message: str = "Permission denied"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=message
        )


class ResourceNotFoundException(AuctionException):
    def __init__(self, resource_type: str):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{resource_type} not found"
        )


class DuplicateResourceException(AuctionException):
    def __init__(self, resource_type: str, field: str):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{resource_type} with this {field} already exists"
        )