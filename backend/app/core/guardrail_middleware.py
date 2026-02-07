import json
import boto3
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from app.core.config import settings

class BedrockGuardrailMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, guardrail_id: str, guardrail_version: str = "DRAFT", region_name: str = "us-east-1"):
        super().__init__(app)
        self.guardrail_id = guardrail_id
        self.guardrail_version = guardrail_version
        
        # Initialize Bedrock client
        self.client = boto3.client(
            "bedrock-runtime",
            region_name=region_name,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
        )

    async def dispatch(self, request: Request, call_next):
        # Only check analysis endpoints (POST)
        if request.method == "POST" and request.url.path in ["/api/v1/governance/analyze", "/api/v1/governance/analyze/batch"]:
            # Check if a specific guardrail ID is requested via header
            requested_guardrail_id = request.headers.get("x-aws-guardrail-id")
            
            # STRICT MODE: Only run if header is present
            if not requested_guardrail_id:
                # print("Guardrail Middleware: No header found. Skipping.")
                return await call_next(request)

            active_guardrail_id = requested_guardrail_id
            print(f"Guardrail Middleware: Checking ID {active_guardrail_id}...")

            try:
                # 1. Read body - consume stream
                body_bytes = await request.body()
                
                if not body_bytes:
                     return await call_next(request)

                body_json = json.loads(body_bytes)
                query = body_json.get("query", "")

                if query:
                    print(f"Guardrail Middleware: Analyzing query prefix: {query[:50]}...")
                    
                    # 2. Call AWS Bedrock Guardrail (Synchronous check)
                    response = self.client.apply_guardrail(
                        guardrailIdentifier=active_guardrail_id,
                        guardrailVersion=self.guardrail_version,
                        source="INPUT",
                        content=[{"text": {"text": query}}]
                    )
                    
                    print(f"Guardrail Middleware: AWS Response Action: {response['action']}")

                    # 3. Check for Interventions/Blocks
                    if response["action"] == "GUARDRAIL_INTERVENED":
                        outputs = response.get("outputs", [])
                        reason = "Content requires moderation."
                        if outputs:
                            reason = outputs[0]["text"]
                        
                        print(f"Guardrail Middleware: BLOCKED! Reason: {reason}")
                        
                        return JSONResponse(
                            status_code=400,
                            content={
                                "detail": f"Guardrail Violation: {reason}",
                                "guardrail_action": "BLOCKED",
                                "reason": reason
                            }
                        )

                # 4. Re-inject body
                async def receive():
                    return {"type": "http.request", "body": body_bytes}
                
                request._receive = receive

            except Exception as e:
                print(f"CRITICAL GUARDRAIL ERROR: {str(e)}")
                # For debugging: Fail Closed to see the error in UI
                return JSONResponse(
                    status_code=500, 
                    content={"detail": f"Guardrail System Error: {str(e)}"}
                )

        response = await call_next(request)
        return response
