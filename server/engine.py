import hashlib
import json
from typing import Tuple
from server.models import DealContract, IntegrityCheckSummary, IntegrityRuleResult

class ContractIntegrityEngine:
    @staticmethod
    def validate(contract: DealContract) -> IntegrityCheckSummary:
        rules = []

        # Rule 1: Price Arithmetic
        expected_total = (
            contract.checkout.base_price
            + contract.checkout.mandatory_fees
            + contract.checkout.taxes
            + contract.checkout.optional_addons
        )
        diff = abs(contract.checkout.final_total - expected_total)
        rule1_pass = diff < 0.01
        rule1_msg = (
            f"Arithmetic valid: {contract.checkout.base_price} + {contract.checkout.mandatory_fees} + "
            f"{contract.checkout.taxes} + {contract.checkout.optional_addons} == {contract.checkout.final_total}"
            if rule1_pass
            else f"ARITHMETIC FAILURE: Expected {expected_total}, extracted final_total={contract.checkout.final_total}"
        )
        rules.append(IntegrityRuleResult(rule_name="Price Arithmetic", passed=rule1_pass, message=rule1_msg))

        # Rule 2: Currency Uniformity
        currency = contract.offer.currency
        rule2_pass = bool(currency and len(currency) == 3 and currency.isupper())
        rule2_msg = f"Currency consistent: {currency}" if rule2_pass else f"Currency invalid: {currency}"
        rules.append(IntegrityRuleResult(rule_name="Currency Uniformity", passed=rule2_pass, message=rule2_msg))

        # Rule 3: Critical Field Evidence Completeness
        critical_fields = {"final_total", "cancellation", "advertised_price"}
        ev_fields = {e.field for e in contract.evidence if e.sha256_hash and e.screenshot_path}
        missing = critical_fields - ev_fields
        rule3_pass = len(missing) == 0
        rule3_msg = (
            "All critical fields have verified evidence"
            if rule3_pass
            else f"EVIDENCE MISSING for critical fields: {', '.join(missing)}"
        )
        rules.append(IntegrityRuleResult(rule_name="Evidence Completeness", passed=rule3_pass, message=rule3_msg))

        # Rule 4: Monotonicity Check
        rule4_pass = contract.checkout.final_total >= contract.checkout.base_price
        rule4_msg = (
            f"Monotonicity valid: final_total ({contract.checkout.final_total}) >= base_price ({contract.checkout.base_price})"
            if rule4_pass
            else f"MONOTONICITY FAILURE: final_total ({contract.checkout.final_total}) < base_price ({contract.checkout.base_price})"
        )
        rules.append(IntegrityRuleResult(rule_name="Journey Monotonicity", passed=rule4_pass, message=rule4_msg))

        # Rule 5: Whole Contract SHA-256 Hash Verification
        recomputed_hash = ContractIntegrityEngine.compute_contract_hash(contract)
        rule5_pass = recomputed_hash == contract.whole_hash
        rule5_msg = f"Whole-contract SHA-256 hash verified: {recomputed_hash[:16]}..." if rule5_pass else "Contract hash mismatch"
        rules.append(IntegrityRuleResult(rule_name="Whole-Contract Hash Integrity", passed=rule5_pass, message=rule5_msg))

        checks_passed = sum(1 for r in rules if r.passed)
        overall_pass = checks_passed == len(rules)

        return IntegrityCheckSummary(
            passed=overall_pass,
            rules=rules,
            checks_passed=checks_passed,
            total_checks=len(rules)
        )

    @staticmethod
    def compute_contract_hash(contract: DealContract) -> str:
        payload = {
            "deal_id": contract.deal_id,
            "merchant": contract.merchant,
            "target_url": contract.target_url,
            "offer": contract.offer.model_dump(),
            "checkout": contract.checkout.model_dump(),
            "terms": contract.terms.model_dump(),
        }
        encoded = json.dumps(payload, sort_keys=True).encode("utf-8")
        return hashlib.sha256(encoded).hexdigest()
