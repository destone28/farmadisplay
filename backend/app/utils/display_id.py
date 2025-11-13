"""Utility functions for generating display IDs."""

import string
import random
from sqlalchemy.orm import Session
from app.models.pharmacy import Pharmacy


def generate_display_id(db: Session) -> str:
    """
    Generate a unique 6-character alphanumeric display ID.

    The ID uses lowercase letters and digits (a-z, 0-9) for a total
    of 36^6 = 2,176,782,336 possible combinations.

    Args:
        db: Database session to check for uniqueness

    Returns:
        A unique 6-character display ID
    """
    chars = string.ascii_lowercase + string.digits
    max_attempts = 100

    for _ in range(max_attempts):
        display_id = ''.join(random.choice(chars) for _ in range(6))

        # Check if ID already exists
        existing = db.query(Pharmacy).filter(
            Pharmacy.display_id == display_id
        ).first()

        if not existing:
            return display_id

    # If we couldn't generate a unique ID after max_attempts, raise an error
    raise ValueError("Failed to generate unique display ID after maximum attempts")
