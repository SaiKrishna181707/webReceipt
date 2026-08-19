import aiosqlite
import json
import os
from typing import List, Optional, Dict, Any
from server.models import DealContract, HealEvent

DB_PATH = os.path.join(os.path.dirname(__file__), "webreceipt.db")

async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
        CREATE TABLE IF NOT EXISTS journeys (
            id TEXT PRIMARY KEY,
            url TEXT NOT NULL,
            status TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
        """)
        await db.execute("""
        CREATE TABLE IF NOT EXISTS observations (
            id TEXT PRIMARY KEY,
            journey_id TEXT NOT NULL,
            advertised_price REAL,
            final_price REAL,
            currency TEXT,
            observed_at TEXT NOT NULL
        )
        """)
        await db.execute("""
        CREATE TABLE IF NOT EXISTS contracts (
            deal_id TEXT PRIMARY KEY,
            merchant TEXT NOT NULL,
            target_url TEXT NOT NULL,
            contract_json TEXT NOT NULL,
            whole_hash TEXT NOT NULL,
            status TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
        """)
        await db.execute("""
        CREATE TABLE IF NOT EXISTS evidence (
            id TEXT PRIMARY KEY,
            deal_id TEXT NOT NULL,
            field TEXT NOT NULL,
            selector TEXT NOT NULL,
            screenshot_path TEXT,
            sha256_hash TEXT NOT NULL,
            observed_at TEXT NOT NULL
        )
        """)
        await db.execute("""
        CREATE TABLE IF NOT EXISTS contract_versions (
            id TEXT PRIMARY KEY,
            deal_id TEXT NOT NULL,
            version INTEGER NOT NULL,
            contract_json TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
        """)
        await db.execute("""
        CREATE TABLE IF NOT EXISTS heal_events (
            heal_id TEXT PRIMARY KEY,
            collector_id TEXT NOT NULL,
            description TEXT NOT NULL,
            before_selector TEXT NOT NULL,
            after_selector TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            status TEXT NOT NULL
        )
        """)
        await db.commit()

async def save_contract(contract: DealContract):
    async with aiosqlite.connect(DB_PATH) as db:
        contract_json = json.dumps(contract.model_dump())
        await db.execute("""
        INSERT OR REPLACE INTO contracts (deal_id, merchant, target_url, contract_json, whole_hash, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
        """, (contract.deal_id, contract.merchant, contract.target_url, contract_json, contract.whole_hash, contract.status))

        # Save evidence rows
        for idx, ev in enumerate(contract.evidence):
            ev_id = f"{contract.deal_id}_ev_{idx}"
            await db.execute("""
            INSERT OR REPLACE INTO evidence (id, deal_id, field, selector, screenshot_path, sha256_hash, observed_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (ev_id, contract.deal_id, ev.field, ev.source_selector, ev.screenshot_path, ev.sha256_hash, ev.observed_at))

        # Save version
        version_id = f"{contract.deal_id}_v1"
        await db.execute("""
        INSERT OR REPLACE INTO contract_versions (id, deal_id, version, contract_json, created_at)
        VALUES (?, ?, 1, ?, datetime('now'))
        """, (version_id, contract.deal_id, contract_json))

        await db.commit()

async def save_heal_event(heal: HealEvent):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
        INSERT OR REPLACE INTO heal_events (heal_id, collector_id, description, before_selector, after_selector, timestamp, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (heal.heal_id, heal.collector_id, heal.description, heal.before_selector, heal.after_selector, heal.timestamp, heal.status))
        await db.commit()

async def get_all_contracts() -> List[Dict[str, Any]]:
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute("SELECT contract_json FROM contracts ORDER BY created_at DESC") as cursor:
            rows = await cursor.fetchall()
            return [json.loads(row[0]) for row in rows]

async def get_all_heal_events() -> List[Dict[str, Any]]:
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute("SELECT heal_id, collector_id, description, before_selector, after_selector, timestamp, status FROM heal_events ORDER BY timestamp DESC") as cursor:
            rows = await cursor.fetchall()
            return [
                {
                    "heal_id": row[0],
                    "collector_id": row[1],
                    "description": row[2],
                    "before_selector": row[3],
                    "after_selector": row[4],
                    "timestamp": row[5],
                    "status": row[6],
                }
                for row in rows
            ]
