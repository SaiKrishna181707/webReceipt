from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class Offer(BaseModel):
    advertised_price: float = Field(..., description="Initial price shown on offer page")
    currency: str = Field(default="INR")
    claim: str = Field(default="Best rate guaranteed")

class Checkout(BaseModel):
    base_price: float = Field(...)
    mandatory_fees: float = Field(default=0.0)
    taxes: float = Field(default=0.0)
    optional_addons: float = Field(default=0.0)
    final_total: float = Field(...)

class Terms(BaseModel):
    cancellation: str = Field(default="Free cancellation within 24h")
    refundability: str = Field(default="Full refund")
    payment_timing: str = Field(default="Pay now")

class JourneyStep(BaseModel):
    step_number: int
    title: str
    url: str
    timestamp: str

class Evidence(BaseModel):
    field: str
    source_selector: str
    screenshot_path: str
    text_snippet: str
    sha256_hash: str
    observed_at: str

class DealContract(BaseModel):
    deal_id: str
    merchant: str
    target_url: str
    offer: Offer
    checkout: Checkout
    terms: Terms
    journey: List[JourneyStep]
    evidence: List[Evidence]
    whole_hash: str
    status: str = Field(default="verified")  # verified, tampered, drift_detected

class IntegrityRuleResult(BaseModel):
    rule_name: str
    passed: bool
    message: str

class IntegrityCheckSummary(BaseModel):
    passed: bool
    rules: List[IntegrityRuleResult]
    checks_passed: int
    total_checks: int

class HealEvent(BaseModel):
    heal_id: str
    collector_id: str
    description: str
    before_selector: str
    after_selector: str
    timestamp: str
    status: str

class WebSocketMessage(BaseModel):
    type: str  # stage_started, stage_completed, field_extracted, integrity_check, integrity_failed, heal_triggered, heal_completed, log
    data: Dict[str, Any]
