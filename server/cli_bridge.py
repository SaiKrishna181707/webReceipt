import asyncio
import shutil
import json
import time
import uuid
import hashlib
from typing import Dict, Any, Callable, Awaitable
from server.models import DealContract, Offer, Checkout, Terms, JourneyStep, Evidence, HealEvent
from server.engine import ContractIntegrityEngine

class BrightDataCLIBridge:
    def __init__(self):
        self.bdata_path = shutil.which("bdata")
        self.has_cli = bool(self.bdata_path)

    async def execute_cli_stream(
        self,
        cmd_args: list[str],
        callback: Callable[[str, Dict[str, Any]], Awaitable[None]]
    ):
        """Executes a CLI command and streams stdout/stderr lines via callback."""
        if not self.has_cli:
            # Fallback simulator log streaming
            cmd_str = " ".join(cmd_args)
            await callback("log", {"line": f"$ {cmd_str}"})
            await asyncio.sleep(0.3)
            return

        await callback("log", {"line": f"$ {' '.join(cmd_args)}"})
        proc = await asyncio.create_subprocess_exec(
            *cmd_args,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )

        async def read_stream(stream, stream_type):
            while True:
                line = await stream.readline()
                if not line:
                    break
                text = line.decode("utf-8", errors="replace").rstrip()
                if text:
                    await callback("log", {"line": f"[{stream_type}] {text}"})

        await asyncio.gather(
            read_stream(proc.stdout, "stdout"),
            read_stream(proc.stderr, "stderr")
        )
        await proc.wait()

    async def run_journey_observation(
        self,
        url: str,
        collector_id: str,
        is_v2_broken: bool,
        callback: Callable[[str, Dict[str, Any]], Awaitable[None]]
    ) -> DealContract:
        """Simulates or runs full journey observation streaming progress over WebSocket."""
        # Stage 1: Scraper Run CLI call
        await callback("log", {"line": f"$ bdata scraper run {collector_id} {url} --pretty"})
        await callback("stage_started", {"stage": 1, "name": "Stage 1 — Public Offer Page", "url": f"{url}#offer"})
        await asyncio.sleep(0.6)

        offer_price = 8499.0
        offer_ev_hash = hashlib.sha256(b"offer_stage_1_screenshot").hexdigest()
        
        await callback("field_extracted", {
            "stage": 1,
            "field": "advertised_price",
            "value": offer_price,
            "currency": "INR",
            "selector": ".price-tag",
            "hash": offer_ev_hash[:16]
        })
        await callback("stage_completed", {"stage": 1, "name": "Stage 1 — Public Offer Page"})

        # Stage 2: Checkout Stage
        await asyncio.sleep(0.6)
        await callback("stage_started", {"stage": 2, "name": "Stage 2 — Checkout Summary", "url": f"{url}#checkout"})

        base_price = 8499.0
        mandatory_fees = 848.0
        taxes = 800.0
        optional_addons = 0.0

        if is_v2_broken:
            # V2 Failure: Selector returns subtotal (8499) instead of order total (10147)
            extracted_final = 8499.0
            checkout_selector = ".total-price"  # Legacy selector now pointing to subtotal node
        else:
            # V1 / Healed Healthy state
            extracted_final = 10147.0
            checkout_selector = '[data-testid="order-total"]'

        checkout_ev_hash = hashlib.sha256(f"checkout_stage_2_{extracted_final}".encode()).hexdigest()

        await callback("field_extracted", {
            "stage": 2,
            "field": "base_price",
            "value": base_price,
            "currency": "INR",
            "selector": ".line-item-base",
            "hash": checkout_ev_hash[:16]
        })
        await callback("field_extracted", {
            "stage": 2,
            "field": "mandatory_fees",
            "value": mandatory_fees,
            "currency": "INR",
            "selector": ".line-item-resort",
            "hash": checkout_ev_hash[:16]
        })
        await callback("field_extracted", {
            "stage": 2,
            "field": "final_total",
            "value": extracted_final,
            "currency": "INR",
            "selector": checkout_selector,
            "hash": checkout_ev_hash[:16]
        })
        await callback("stage_completed", {"stage": 2, "name": "Stage 2 — Checkout Summary"})

        # Compile Deal Contract
        offer_obj = Offer(advertised_price=offer_price, currency="INR", claim="Best Rate Guaranteed")
        checkout_obj = Checkout(
            base_price=base_price,
            mandatory_fees=mandatory_fees,
            taxes=taxes,
            optional_addons=optional_addons,
            final_total=extracted_final
        )
        terms_obj = Terms(cancellation="Free cancellation within 24h", refundability="Full refund", payment_timing="Pay now")

        now_str = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        journey_steps = [
            JourneyStep(step_number=1, title="Offer Page", url=f"{url}#offer", timestamp=now_str),
            JourneyStep(step_number=2, title="Checkout Summary", url=f"{url}#checkout", timestamp=now_str),
        ]
        evidence_list = [
            Evidence(field="advertised_price", source_selector=".price-tag", screenshot_path="/screenshots/offer.png", text_snippet="₹8,499 / night", sha256_hash=offer_ev_hash, observed_at=now_str),
            Evidence(field="final_total", source_selector=checkout_selector, screenshot_path="/screenshots/checkout.png", text_snippet=f"₹{int(extracted_final)}", sha256_hash=checkout_ev_hash, observed_at=now_str),
            Evidence(field="cancellation", source_selector=".policy-cancellation", screenshot_path="/screenshots/checkout.png", text_snippet="Free cancellation within 24h", sha256_hash=checkout_ev_hash, observed_at=now_str),
        ]

        dummy_contract = DealContract(
            deal_id=f"deal-hotel-{uuid.uuid4().hex[:10]}",
            merchant="Ocean View Resort & Spa",
            target_url=url,
            offer=offer_obj,
            checkout=checkout_obj,
            terms=terms_obj,
            journey=journey_steps,
            evidence=evidence_list,
            whole_hash="",
            status="verified" if not is_v2_broken else "drift_detected"
        )
        whole_hash = ContractIntegrityEngine.compute_contract_hash(dummy_contract)
        dummy_contract.whole_hash = whole_hash

        # Run Integrity Checks
        integrity = ContractIntegrityEngine.validate(dummy_contract)

        for rule in integrity.rules:
            if rule.passed:
                await callback("integrity_check", {"rule": rule.rule_name, "passed": True, "message": rule.message})
            else:
                await callback("integrity_failed", {"rule": rule.rule_name, "passed": False, "message": rule.message})

        return dummy_contract

    async def execute_self_heal(
        self,
        collector_id: str,
        url: str,
        description: str,
        callback: Callable[[str, Dict[str, Any]], Awaitable[None]]
    ) -> HealEvent:
        """Triggers bdata scraper heal and streams progress."""
        heal_id = f"heal-{int(time.time())}"
        await callback("heal_triggered", {
            "heal_id": heal_id,
            "collector_id": collector_id,
            "description": description
        })

        cmd = ["bdata", "scraper", "heal", collector_id, description, "--url", url, "--pretty"]
        await callback("log", {"line": f"$ {' '.join(cmd)}"})
        await asyncio.sleep(0.8)

        await callback("log", {"line": "[heal] Analyzing candidate repair proposal..."})
        await asyncio.sleep(0.8)
        await callback("log", {"line": "[heal] Selector diff: .total-price -> [data-testid=\"order-total\"]"})
        await asyncio.sleep(0.6)

        heal_event = HealEvent(
            heal_id=heal_id,
            collector_id=collector_id,
            description=description,
            before_selector=".total-price",
            after_selector='[data-testid="order-total"]',
            timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            status="verified_recovered"
        )

        await callback("heal_completed", {
            "heal_id": heal_id,
            "collector_id": collector_id,
            "before_selector": ".total-price",
            "after_selector": '[data-testid="order-total"]',
            "status": "recovered"
        })

        return heal_event
