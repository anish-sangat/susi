from app.db.database import SessionLocal
from app.services.order_expiration import expire_pending_orders


def main() -> None:
    db = SessionLocal()

    try:
        expired_count = expire_pending_orders(db)

        print(
            f"Expired {expired_count} pending order(s)."
        )

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    main()