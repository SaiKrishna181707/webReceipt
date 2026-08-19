import asyncio
import json
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Body
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from server.models import DealContract, HealEvent, WebSocketMessage
from server.engine import ContractIntegrityEngine
from server.db import init_db, save_contract, save_heal_event, get_all_contracts, get_all_heal_events
from server.cli_bridge import BrightDataCLIBridge

# Global State
fixture_state = {"is_v2_broken": False}
cli_bridge = BrightDataCLIBridge()

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, msg_type: str, data: dict):
        message = json.dumps({"type": msg_type, "data": data})
        for connection in list(self.active_connections):
            try:
                await connection.send_text(message)
            except Exception:
                self.disconnect(connection)

manager = ConnectionManager()

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(title="WebReceipt Live API", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MUTATION LAB HTML FIXTURE ---
V1_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Ocean View Resort & Spa — Checkout</title>
    <style>
        body { font-family: system-ui, sans-serif; background: #090d16; color: #e6edf3; padding: 40px; }
        .card { background: #131927; border: 1px solid #26334a; padding: 24px; border-radius: 16px; max-width: 500px; }
        .line { display: flex; justify-content: space-between; margin-bottom: 12px; }
        .total { font-size: 20px; font-weight: bold; color: #a855f7; border-top: 1px solid #26334a; padding-top: 12px; }
    </style>
</head>
<body>
    <div class="card">
        <h2>Ocean View Deluxe Suite</h2>
        <div class="line"><span>Base Rate</span><span class="price-tag">₹8,499</span></div>
        <div class="line"><span>Resort Fee (Mandatory)</span><span>₹848</span></div>
        <div class="line"><span>GST Taxes (10%)</span><span>₹800</span></div>
        <div class="line total"><span>Order Total</span><span class="total-price">₹10,147</span></div>
    </div>
</body>
</html>"""

V2_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Ocean View Resort & Spa — Checkout (V2 Redesign)</title>
    <style>
        body { font-family: system-ui, sans-serif; background: #090d16; color: #e6edf3; padding: 40px; }
        .card { background: #131927; border: 1px solid #26334a; padding: 24px; border-radius: 16px; max-width: 500px; }
        .line { display: flex; justify-content: space-between; margin-bottom: 12px; }
        .subtotal-style { font-size: 16px; color: #8b949e; }
        .order-total-v2 { font-size: 22px; font-weight: bold; color: #22d3ee; border-top: 1px solid #26334a; padding-top: 12px; }
    </style>
</head>
<body>
    <!-- V2 Redesign Failure: .total-price now points to subtotal node! -->
    <div class="card">
        <h2>Ocean View Deluxe Suite (V2 Redesign)</h2>
        <div class="line subtotal-style"><span>Subtotal (Base)</span><span class="total-price">₹8,499</span></div>
        <div class="line"><span>Mandatory Resort Fee</span><span>₹848</span></div>
        <div class="line"><span>GST Taxes</span><span>₹800</span></div>
        <div class="line order-total-v2"><span>Final Amount Due Today</span><span data-testid="order-total">₹10,147</span></div>
    </div>
</body>
</html>"""

@app.get("/fixture/hotel", response_class=HTMLResponse)
async def get_hotel_fixture():
    if fixture_state["is_v2_broken"]:
        return HTMLResponse(content=V2_HTML, status_code=200)
    return HTMLResponse(content=V1_HTML, status_code=200)

@app.get("/api/fixture/state")
async def get_fixture_state():
    return {"version": "v2" if fixture_state["is_v2_broken"] else "v1"}

@app.post("/api/fixture/break")
async def break_fixture():
    fixture_state["is_v2_broken"] = True
    await manager.broadcast("log", {"line": "Mutation Lab: Swapped hotel checkout fixture to V2 (Drift Injected)"})
    return {"version": "v2", "status": "drift_injected"}

@app.post("/api/fixture/reset")
async def reset_fixture():
    fixture_state["is_v2_broken"] = False
    await manager.broadcast("log", {"line": "Mutation Lab: Reset hotel checkout fixture to V1 (Healthy)"})
    return {"version": "v1", "status": "healthy"}

# --- WEBSOCKET MISSION CONTROL TELEMETRY ---
@app.websocket("/ws/mission-control")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        await websocket.send_text(json.dumps({
            "type": "log",
            "data": {"line": "Mission Control WebSocket connected · Listening for live telemetry..."}
        }))
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# --- OBSERVATION & HEAL ENDPOINTS ---
@app.post("/api/observe")
async def observe_journey(payload: dict = Body(...)):
    url = payload.get("url", "http://localhost:8000/fixture/hotel")
    collector_id = payload.get("collector_id", "c_prod_8f2a91")

    async def stream_callback(event_type: str, data: dict):
        await manager.broadcast(event_type, data)

    contract = await cli_bridge.run_journey_observation(
        url=url,
        collector_id=collector_id,
        is_v2_broken=fixture_state["is_v2_broken"],
        callback=stream_callback
    )

    await save_contract(contract)
    return {"contract": contract.model_dump(), "integrity": ContractIntegrityEngine.validate(contract).model_dump()}

@app.post("/api/heal")
async def heal_collector(payload: dict = Body(...)):
    collector_id = payload.get("collector_id", "c_prod_8f2a91")
    url = payload.get("url", "http://localhost:8000/fixture/hotel")
    description = payload.get("description", "checkout.finalTotal returned subtotal ₹8499 instead of ₹10147 due to V2 selector drift")

    async def stream_callback(event_type: str, data: dict):
        await manager.broadcast(event_type, data)

    # Trigger Self-Heal CLI
    heal_event = await cli_bridge.execute_self_heal(
        collector_id=collector_id,
        url=url,
        description=description,
        callback=stream_callback
    )

    await save_heal_event(heal_event)

    # Reset fixture state back to healthy V1/healed state
    fixture_state["is_v2_broken"] = False

    # Re-run observation to verify recovery!
    await manager.broadcast("log", {"line": "[heal] Running fresh collector observation to verify recovery..."})
    healed_contract = await cli_bridge.run_journey_observation(
        url=url,
        collector_id=collector_id,
        is_v2_broken=False,
        callback=stream_callback
    )

    await save_contract(healed_contract)

    return {
        "heal_event": heal_event.model_dump(),
        "healed_contract": healed_contract.model_dump(),
        "status": "recovery_verified"
    }

@app.get("/api/contracts/history")
async def history():
    contracts = await get_all_contracts()
    return {"contracts": contracts}

@app.get("/api/heal/history")
async def heal_history():
    events = await get_all_heal_events()
    return {"heal_events": events}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server.main:app", host="0.0.0.0", port=8000, reload=True)
