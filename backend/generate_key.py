"""
SnapChart API Key 发卡脚本
生成 sk- 开头的随机 API Key，哈希后存入数据库。

用法：
  cd backend
  python generate_key.py                    # 默认：owner="本地测试账号", credits=1000
  python generate_key.py --owner "n8n"      # 自定义 owner
  python generate_key.py --credits 5000     # 自定义额度
"""

import argparse
import asyncio
import secrets

from app.models.database import async_session, init_db
from app.models.api_key_model import ApiKey, hash_api_key


async def generate(owner: str, credits: int):
    await init_db()

    raw_key = "sk-" + secrets.token_urlsafe(24)
    hashed = hash_api_key(raw_key)

    async with async_session() as session:
        record = ApiKey(
            key_hash=hashed,
            customer_name=owner,
            credits=credits,
            is_active=True,
        )
        session.add(record)
        await session.commit()

    print("=" * 50)
    print("  SnapChart API Key 发卡成功！")
    print("=" * 50)
    print(f"  API Key  : {raw_key}")
    print(f"  Owner    : {owner}")
    print(f"  Credits  : {credits}")
    print(f"  Hash     : {hashed[:16]}...")
    print("=" * 50)
    print()
    print("  请求时添加 Header:")
    print(f'  X-API-Key: {raw_key}')
    print()
    print("  注意：此 Key 仅显示一次，请妥善保存！")
    print("  数据库中仅存储 SHA-256 哈希值，无法恢复明文。")


def main():
    parser = argparse.ArgumentParser(description="SnapChart API Key Generator")
    parser.add_argument("--owner", default="本地测试账号", help="Key 拥有者名称")
    parser.add_argument("--credits", type=int, default=1000, help="初始额度")
    args = parser.parse_args()

    asyncio.run(generate(args.owner, args.credits))


if __name__ == "__main__":
    main()
