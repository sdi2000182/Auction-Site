import numpy as np
from typing import List, Dict, Tuple
from sqlalchemy.orm import Session
from models.user import User
from models.item import Item, AuctionStatus
from models.bid import Bid
from models.category import Category


class MatrixFactorization:
    def __init__(self, n_factors: int = 10, learning_rate: float = 0.01, n_epochs: int = 100):
        self.n_factors = n_factors
        self.learning_rate = learning_rate
        self.n_epochs = n_epochs
        self.user_factors = None
        self.item_factors = None
        self.user_bias = None
        self.item_bias = None
        self.global_mean = None

    def fit(self, user_item_matrix: np.ndarray, user_ids: List[int], item_ids: List[int]):
        """Fit the matrix factorization model"""
        n_users, n_items = user_item_matrix.shape
        
        # Initialize factors and biases
        self.user_factors = np.random.normal(0, 0.1, (n_users, self.n_factors))
        self.item_factors = np.random.normal(0, 0.1, (n_items, self.n_factors))
        self.user_bias = np.zeros(n_users)
        self.item_bias = np.zeros(n_items)
        
        # Calculate global mean of non-zero ratings
        non_zero_mask = user_item_matrix > 0
        self.global_mean = np.mean(user_item_matrix[non_zero_mask]) if non_zero_mask.any() else 0
        
        # Training loop
        for epoch in range(self.n_epochs):
            for i in range(n_users):
                for j in range(n_items):
                    if user_item_matrix[i, j] > 0:  # Only train on observed ratings
                        # Prediction
                        prediction = (self.global_mean + 
                                    self.user_bias[i] + 
                                    self.item_bias[j] + 
                                    np.dot(self.user_factors[i], self.item_factors[j]))
                        
                        # Error
                        error = user_item_matrix[i, j] - prediction
                        
                        # Update biases
                        self.user_bias[i] += self.learning_rate * error
                        self.item_bias[j] += self.learning_rate * error
                        
                        # Update factors
                        user_factors_old = self.user_factors[i].copy()
                        self.user_factors[i] += self.learning_rate * error * self.item_factors[j]
                        self.item_factors[j] += self.learning_rate * error * user_factors_old

    def predict(self, user_idx: int, item_idx: int) -> float:
        """Predict rating for user-item pair"""
        if (self.user_factors is None or user_idx >= len(self.user_factors) or 
            item_idx >= len(self.item_factors)):
            return self.global_mean if self.global_mean is not None else 3.0
        
        prediction = (self.global_mean + 
                     self.user_bias[user_idx] + 
                     self.item_bias[item_idx] + 
                     np.dot(self.user_factors[user_idx], self.item_factors[item_idx]))
        
        return max(1, min(5, prediction))  # Clamp to rating scale

    def get_recommendations(self, user_idx: int, n_recommendations: int = 10) -> List[int]:
        """Get top N item recommendations for a user"""
        if self.user_factors is None or user_idx >= len(self.user_factors):
            return []
        
        n_items = len(self.item_factors)
        predictions = []
        
        for item_idx in range(n_items):
            pred_rating = self.predict(user_idx, item_idx)
            predictions.append((item_idx, pred_rating))
        
        # Sort by predicted rating and return top N item indices
        predictions.sort(key=lambda x: x[1], reverse=True)
        return [item_idx for item_idx, _ in predictions[:n_recommendations]]


class RecommendationEngine:
    def __init__(self, db: Session):
        self.db = db
        self.model = MatrixFactorization()

    def build_user_item_matrix(self) -> Tuple[np.ndarray, Dict[int, int], Dict[int, int], List[int], List[int]]:
        """Build user-item interaction matrix from bid data"""
        # Get all users and items
        users = self.db.query(User.id).all()
        items = self.db.query(Item.id).filter(Item.status == AuctionStatus.ACTIVE).all()
        
        user_ids = [u.id for u in users]
        item_ids = [i.id for i in items]
        
        user_id_to_idx = {user_id: idx for idx, user_id in enumerate(user_ids)}
        item_id_to_idx = {item_id: idx for idx, item_id in enumerate(item_ids)}
        
        # Initialize matrix
        matrix = np.zeros((len(user_ids), len(item_ids)))
        
        # Fill matrix with bid data (implicit feedback)
        bids = self.db.query(Bid).join(Item).filter(
            Item.status == AuctionStatus.ACTIVE
        ).all()
        
        for bid in bids:
            if bid.bidder_id in user_id_to_idx and bid.item_id in item_id_to_idx:
                user_idx = user_id_to_idx[bid.bidder_id]
                item_idx = item_id_to_idx[bid.item_id]
                # Use normalized bid amount as rating (1-5 scale)
                item = self.db.query(Item).filter(Item.id == bid.item_id).first()
                if item:
                    rating = min(5, max(1, (bid.amount / item.currently) * 3 + 1))
                    matrix[user_idx, item_idx] = max(matrix[user_idx, item_idx], rating)
        
        return matrix, user_id_to_idx, item_id_to_idx, user_ids, item_ids

    def train_model(self):
        """Train the recommendation model"""
        matrix, user_mapping, item_mapping, user_ids, item_ids = self.build_user_item_matrix()
        self.model.fit(matrix, user_ids, item_ids)
        self.user_mapping = user_mapping
        self.item_mapping = item_mapping
        self.user_ids = user_ids
        self.item_ids = item_ids
        return True

    def get_recommendations_for_user(self, user_id: int, n_recommendations: int = 10) -> List[Dict]:
        """Get item recommendations for a specific user"""
        if not hasattr(self, 'user_mapping') or user_id not in self.user_mapping:
            # Fallback: return popular items
            return self._get_popular_items_fallback(n_recommendations)
        
        user_idx = self.user_mapping[user_id]
        recommended_item_indices = self.model.get_recommendations(user_idx, n_recommendations * 2)
        
        # Convert indices back to item IDs and get item details
        recommended_items = []
        for item_idx in recommended_item_indices:
            if item_idx < len(self.item_ids):
                item_id = self.item_ids[item_idx]
                
                # Check if user hasn't already bid on this item
                has_bid = self.db.query(Bid).filter(
                    Bid.bidder_id == user_id,
                    Bid.item_id == item_id
                ).first()
                
                if not has_bid:
                    item = self.db.query(Item).filter(Item.id == item_id).first()
                    if item and item.status == AuctionStatus.ACTIVE:
                        recommended_items.append({
                            "id": item.id,
                            "name": item.name,
                            "currently": item.currently,
                            "number_of_bids": item.number_of_bids,
                            "ends": item.ends,
                            "images": item.images,
                            "predicted_rating": self.model.predict(user_idx, item_idx)
                        })
                
                if len(recommended_items) >= n_recommendations:
                    break
        
        # If we don't have enough recommendations, fill with popular items
        if len(recommended_items) < n_recommendations:
            popular_items = self._get_popular_items_fallback(
                n_recommendations - len(recommended_items), 
                exclude_ids=[item["id"] for item in recommended_items]
            )
            recommended_items.extend(popular_items)
        
        return recommended_items[:n_recommendations]

    def get_recommendations_by_category(self, user_id: int, n_recommendations: int = 5) -> List[Dict]:
        """Get recommendations based on user's category preferences"""
        # Get categories user has bid on
        user_categories = self.db.query(Category.id, Category.name).join(
            Item.categories
        ).join(Bid, Item.id == Bid.item_id).filter(
            Bid.bidder_id == user_id
        ).distinct().all()
        
        if not user_categories:
            return self._get_popular_items_fallback(n_recommendations)
        
        category_recommendations = []
        
        for category in user_categories:
            # Get items in this category that user hasn't bid on
            category_items = self.db.query(Item).join(Item.categories).filter(
                Category.id == category.id,
                Item.status == AuctionStatus.ACTIVE,
                Item.seller_id != user_id,  # Don't recommend own items
                ~Item.id.in_(  # Items user hasn't bid on
                    self.db.query(Bid.item_id).filter(Bid.bidder_id == user_id)
                )
            ).order_by(Item.number_of_bids.desc()).limit(2).all()
            
            for item in category_items:
                category_recommendations.append({
                    "id": item.id,
                    "name": item.name,
                    "currently": item.currently,
                    "number_of_bids": item.number_of_bids,
                    "ends": item.ends,
                    "images": item.images,
                    "category": category.name
                })
        
        return category_recommendations[:n_recommendations]

    def _get_popular_items_fallback(self, n_items: int, exclude_ids: List[int] = None) -> List[Dict]:
        """Fallback method to get popular items when no personalized recommendations available"""
        exclude_ids = exclude_ids or []
        
        query = self.db.query(Item).filter(
            Item.status == AuctionStatus.ACTIVE
        )
        
        if exclude_ids:
            query = query.filter(~Item.id.in_(exclude_ids))
        
        popular_items = query.order_by(Item.number_of_bids.desc()).limit(n_items).all()
        
        return [
            {
                "id": item.id,
                "name": item.name,
                "currently": item.currently,
                "number_of_bids": item.number_of_bids,
                "ends": item.ends,
                "images": item.images
            }
            for item in popular_items
        ]

    def update_user_preferences(self, user_id: int, item_id: int, interaction_type: str = "bid"):
        """Update user preferences based on new interactions"""
        # This would typically trigger a model retrain or incremental update
        # For now, we'll just log the interaction
        # In production, you might want to retrain periodically or use online learning
        pass

    def get_similar_items(self, item_id: int, n_similar: int = 5) -> List[Dict]:
        """Get items similar to a given item"""
        target_item = self.db.query(Item).filter(Item.id == item_id).first()
        if not target_item:
            return []
        
        # Get items in same categories with eager loading
        from sqlalchemy.orm import joinedload
        similar_items = self.db.query(Item).options(
            joinedload(Item.categories),
            joinedload(Item.seller)
        ).join(Item.categories).filter(
            Category.id.in_([cat.id for cat in target_item.categories]),
            Item.id != item_id,
            Item.status == AuctionStatus.ACTIVE
        ).order_by(Item.number_of_bids.desc()).limit(n_similar).all()
        
        return [
            {
                "id": item.id,
                "name": item.name,
                "description": item.description,
                "currently": item.currently,
                "first_bid": item.first_bid,
                "buy_price": item.buy_price,
                "number_of_bids": item.number_of_bids,
                "ends": item.ends,
                "images": item.images or [],
                "categories": [
                    {
                        "id": cat.id,
                        "name": cat.name
                    }
                    for cat in item.categories
                ],
                "seller": {
                    "id": item.seller.id,
                    "username": item.seller.username
                },
                "similarity_score": 1.0  # Default similarity score
            }
            for item in similar_items
        ]