from app.crud import create_user, get_user_by_email
from app.init_db import init_db

def test_create_user(email: str = "test@example.com", password: str = "testpass123"):
    """Test creating a user in the database."""
    try:
        # Create user
        user = create_user(email, password)
        print(f"✓ User created successfully!")
        print(f"  - ID: {user.id}")
        print(f"  - Email: {user.email}")
        
        
        # Verify user was created by retrieving it
        retrieved_user = get_user_by_email(email)
        if retrieved_user:
            print(f"✓ User retrieved successfully!")
            print(f"  - Retrieved Email: {retrieved_user.email}")
            print(f"  - Retrieved ID: {retrieved_user.id}")
        else:
            print("✗ Failed to retrieve user")
            
    except ValueError as e:
        print(f"✗ Error: {e}")
    except Exception as e:
        print(f"✗ Unexpected error: {e}")

if __name__ == "__main__":
    import sys
    
    # Allow command line arguments for email and password
    if len(sys.argv) == 3:
        email = sys.argv[1]
        password = sys.argv[2]
        test_create_user(email, password)
    elif len(sys.argv) == 2:
        email = sys.argv[1]
        test_create_user(email)
    else:
        # Use default values
        test_create_user()

