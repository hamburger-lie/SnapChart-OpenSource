#!/usr/bin/env python3
"""
SnapChart API Key CLI Management Tool

Usage:
  python manage_keys.py create  <customer_name> [--credits 100]
  python manage_keys.py list
  python manage_keys.py info    <customer_name>
  python manage_keys.py recharge <customer_name> <amount>
  python manage_keys.py disable <customer_name>
  python manage_keys.py enable  <customer_name>
  python manage_keys.py delete  <customer_name>
  python manage_keys.py reset   <customer_name>   # Regenerate key

Examples:
  python manage_keys.py create "Coze Bot" --credits 500
  python manage_keys.py recharge "Coze Bot" 200
  python manage_keys.py list
"""

import argparse
import asyncio
import secrets
import sys

import sqlalchemy as sa

from app.models.database import async_session, init_db
from app.models.api_key_model import ApiKey, hash_api_key


def generate_key() -> str:
    """Generate a secure random API key: sk-snap-<40 chars>"""
    return f"sk-snap-{secrets.token_urlsafe(30)}"


async def cmd_create(name: str, credits: int):
    """Create a new API key for a customer"""
    await init_db()
    raw_key = generate_key()
    hashed = hash_api_key(raw_key)

    async with async_session() as session:
        # Check if customer already exists
        result = await session.execute(
            sa.select(ApiKey).where(ApiKey.customer_name == name)
        )
        if result.scalar_one_or_none():
            print(f"Error: Customer '{name}' already exists. Use 'reset' to regenerate key.")
            sys.exit(1)

        record = ApiKey(
            key_hash=hashed,
            customer_name=name,
            credits=credits,
            is_active=True,
        )
        session.add(record)
        await session.commit()

    print("=" * 50)
    print("  API Key Created Successfully!")
    print("=" * 50)
    print(f"  Customer:  {name}")
    print(f"  API Key:   {raw_key}")
    print(f"  Credits:   {credits}")
    print("=" * 50)
    print("  IMPORTANT: Save this key now!")
    print("  It will NOT be shown again.")
    print("=" * 50)


async def cmd_list():
    """List all API keys"""
    await init_db()
    async with async_session() as session:
        result = await session.execute(
            sa.select(ApiKey).order_by(ApiKey.id)
        )
        records = result.scalars().all()

    if not records:
        print("No API keys found.")
        return

    print(f"{'ID':<5} {'Customer':<20} {'Credits':<10} {'Active':<8} {'Key Hash (prefix)':<20}")
    print("-" * 63)
    for r in records:
        status = "Yes" if r.is_active else "No"
        print(f"{r.id:<5} {r.customer_name:<20} {r.credits:<10} {status:<8} {r.key_hash[:16]}...")


async def cmd_info(name: str):
    """Show detailed info for a customer"""
    await init_db()
    async with async_session() as session:
        result = await session.execute(
            sa.select(ApiKey).where(ApiKey.customer_name == name)
        )
        record = result.scalar_one_or_none()

    if not record:
        print(f"Error: Customer '{name}' not found.")
        sys.exit(1)

    print(f"  ID:        {record.id}")
    print(f"  Customer:  {record.customer_name}")
    print(f"  Credits:   {record.credits}")
    print(f"  Active:    {'Yes' if record.is_active else 'No'}")
    print(f"  Key Hash:  {record.key_hash[:24]}...")


async def cmd_recharge(name: str, amount: int):
    """Add credits to a customer"""
    await init_db()
    async with async_session() as session:
        result = await session.execute(
            sa.select(ApiKey).where(ApiKey.customer_name == name)
        )
        record = result.scalar_one_or_none()

        if not record:
            print(f"Error: Customer '{name}' not found.")
            sys.exit(1)

        old_credits = record.credits
        record.credits += amount
        await session.commit()

    print(f"Recharged '{name}': {old_credits} -> {record.credits} (+{amount})")


async def cmd_toggle(name: str, active: bool):
    """Enable or disable a customer's key"""
    await init_db()
    async with async_session() as session:
        result = await session.execute(
            sa.select(ApiKey).where(ApiKey.customer_name == name)
        )
        record = result.scalar_one_or_none()

        if not record:
            print(f"Error: Customer '{name}' not found.")
            sys.exit(1)

        record.is_active = active
        await session.commit()

    action = "Enabled" if active else "Disabled"
    print(f"{action} API key for '{name}'.")


async def cmd_delete(name: str):
    """Delete a customer's key permanently"""
    await init_db()
    async with async_session() as session:
        result = await session.execute(
            sa.select(ApiKey).where(ApiKey.customer_name == name)
        )
        record = result.scalar_one_or_none()

        if not record:
            print(f"Error: Customer '{name}' not found.")
            sys.exit(1)

        await session.delete(record)
        await session.commit()

    print(f"Deleted API key for '{name}'.")


async def cmd_reset(name: str):
    """Regenerate a new key for existing customer"""
    await init_db()
    raw_key = generate_key()
    hashed = hash_api_key(raw_key)

    async with async_session() as session:
        result = await session.execute(
            sa.select(ApiKey).where(ApiKey.customer_name == name)
        )
        record = result.scalar_one_or_none()

        if not record:
            print(f"Error: Customer '{name}' not found.")
            sys.exit(1)

        record.key_hash = hashed
        await session.commit()

    print("=" * 50)
    print(f"  Key regenerated for '{name}'!")
    print(f"  New API Key: {raw_key}")
    print("=" * 50)
    print("  Old key is now invalid.")
    print("  IMPORTANT: Save this key now!")
    print("=" * 50)


def main():
    parser = argparse.ArgumentParser(
        description="SnapChart API Key Management",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    sub = parser.add_subparsers(dest="command", help="Available commands")

    # create
    p_create = sub.add_parser("create", help="Create a new API key")
    p_create.add_argument("name", help="Customer name")
    p_create.add_argument("--credits", type=int, default=100, help="Initial credits (default: 100)")

    # list
    sub.add_parser("list", help="List all API keys")

    # info
    p_info = sub.add_parser("info", help="Show customer info")
    p_info.add_argument("name", help="Customer name")

    # recharge
    p_recharge = sub.add_parser("recharge", help="Add credits")
    p_recharge.add_argument("name", help="Customer name")
    p_recharge.add_argument("amount", type=int, help="Credits to add")

    # disable
    p_disable = sub.add_parser("disable", help="Disable a key")
    p_disable.add_argument("name", help="Customer name")

    # enable
    p_enable = sub.add_parser("enable", help="Enable a key")
    p_enable.add_argument("name", help="Customer name")

    # delete
    p_delete = sub.add_parser("delete", help="Delete a key permanently")
    p_delete.add_argument("name", help="Customer name")

    # reset
    p_reset = sub.add_parser("reset", help="Regenerate key for customer")
    p_reset.add_argument("name", help="Customer name")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(0)

    commands = {
        "create": lambda: cmd_create(args.name, args.credits),
        "list": cmd_list,
        "info": lambda: cmd_info(args.name),
        "recharge": lambda: cmd_recharge(args.name, args.amount),
        "disable": lambda: cmd_toggle(args.name, False),
        "enable": lambda: cmd_toggle(args.name, True),
        "delete": lambda: cmd_delete(args.name),
        "reset": lambda: cmd_reset(args.name),
    }

    asyncio.run(commands[args.command]())


if __name__ == "__main__":
    main()
