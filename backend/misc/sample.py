# Governance telemetry structure
class InvocationTelemetry:
    """
    Structured telemetry for AI governance.
    Designed for export to SIEM, data warehouse, or FinOps platforms.
    """
    def __init__(self):
        self.provider = None
        self.model_id = None
        self.latency_ms = None
        self.input_tokens = None
        self.output_tokens = None
        self.timestamp = None
        self.success = False
        self.failure_classification = None
        self.error_message = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "provider": self.provider,
            "model_id": self.model_id,
            "latency_ms": self.latency_ms,
            "input_tokens": self.input_tokens,
            "output_tokens": self.output_tokens,
            "total_tokens": (self.input_tokens + self.output_tokens) if (self.input_tokens and self.output_tokens) else None,
            "timestamp": self.timestamp,
            "success": self.success,
            "failure_classification": self.failure_classification,
            "error_message": self.error_message
        }
    
    def log(self):
        """Print telemetry in audit-ready format"""
        print("\n" + "="*60)
        print("GOVERNANCE TELEMETRY")
        print("="*60)
        for key, value in self.to_dict().items():
            print(f"{key:.<30} {value}")
        print("="*60)

# Initialize telemetry collector
telemetry = InvocationTelemetry()