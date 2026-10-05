from app import create_app
from app.extensions import db
from app.models import User


app = create_app()


with app.app_context():
    email = "admin@school.com"

    existing_user = User.query.filter_by(email=email).first()

    if existing_user:
        print("Admin account already exists")
    else:
        admin = User(
            full_name="System Administrator",
            email=email,
            role="admin",
            is_active=True
        )

        admin.set_password("Admin@123")

        db.session.add(admin)
        db.session.commit()

        print("Admin account created successfully")
        print("Email: admin@school.com")
        print("Password: Admin@123")
