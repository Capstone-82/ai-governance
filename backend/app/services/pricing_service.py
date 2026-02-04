import json
import os
from typing import Dict, Any, Optional

class PricingService:
    def __init__(self):
        self.anthropic_pricing = self._load_json("backend/pricing/aws_anthropic.json")
        self.meta_pricing = self._load_json("backend/pricing/aws_meta.json")
        self.openai_pricing = self._load_json("backend/pricing/openai.json")
        self.gcp_pricing = self._load_json("backend/pricing/gcp_vertex.json")
        
    def _load_json(self, path: str) -> Dict[str, Any]:
        """Helper to safely load JSON files."""
        try:
            # Check if path exists relative to the current working directory
            # If not, try absolute path or relative to project root
            # Assuming backend/pricing/... is the relative path from project root
            if not os.path.exists(path):
                # Fallback for dev environment structure
                path = os.path.join(os.getcwd(), path)
            
            with open(path, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading pricing file {path}: {e}")
            return {}

    def calculate_cost(self, provider: str, model_name: str, input_tokens: int, output_tokens: int) -> Dict[str, float]:
        """
        Calculate cost based on provider, model, and token counts.
        Returns dictionary with input_cost, output_cost, total_cost.
        """
        input_rate = 0.0
        output_rate = 0.0
        
        provider = provider.lower()
        
        if "anthropic" in provider or "claude" in model_name.lower():
            input_rate, output_rate = self._get_anthropic_rates(model_name)
        elif "meta" in provider or "llama" in model_name.lower():
            input_rate, output_rate = self._get_meta_rates(model_name)
        elif "openai" in provider or "gpt" in model_name.lower() or "o1" in model_name or "o3" in model_name:
            input_rate, output_rate = self._get_openai_rates(model_name)
        elif "gcp" in provider or "vertex" in provider or "gemini" in model_name.lower():
            input_rate, output_rate = self._get_gcp_rates(model_name)
            
        input_cost = input_rate * input_tokens
        output_cost = output_rate * output_tokens
        
        return {
            "input_cost": input_cost,
            "output_cost": output_cost,
            "total_cost": input_cost + output_cost
        }

    def _get_anthropic_rates(self, model_name: str) -> (float, float):
        """
        Anthropic pricing is per 1M tokens in the JSON.
        We need to return rate per 1 token for multiplication.
        """
        models = self.anthropic_pricing.get("models", [])
        for m in models:
            if self._match_anthropic_model(m["model"], model_name):
                # Rates are per 1M
                return m["input"] / 1_000_000, m["output"] / 1_000_000
                
        # Default fallback (Claude Instant approx)
        return 0.8 / 1_000_000, 2.4 / 1_000_000

    def _match_anthropic_model(self, json_name: str, req_id: str) -> bool:
        """
        Helper to match 'Claude 3.5 Sonnet' to 'anthropic.claude-3-5-sonnet-20240620-v1:0'
        """
        j = json_name.lower().replace(" ", "").replace(".", "")
        r = req_id.lower().replace("-", "").replace(":", "").replace(".", "")
        
        if "sonnet" in j and "sonnet" in r:
            if "3.5" in json_name and ("3-5" in req_id or "3.5" in req_id or "35" in r):
                return True
            if "3" in json_name and "3.5" not in json_name and ("3" in req_id and "3-5" not in req_id):
                 return True
        
        if "haiku" in j and "haiku" in r:
             if "3.5" in json_name and ("3-5" in req_id or "3.5" in req_id or "35" in r):
                return True

        if "llama" in r: return False # Safety check
            
        return False

    def _get_meta_rates(self, model_name: str) -> (float, float):
        """
        Meta pricing is per 1000 tokens.
        """
        families = self.meta_pricing.get("models", {})
        target_family = None
        if "llama3" in model_name.lower() or "llama-3" in model_name.lower():
             if "beta" in model_name.lower() or "3.1" in model_name or "3-1" in model_name:
                 target_family = "llama_3_1"
             elif "3.2" in model_name or "3-2" in model_name:
                 target_family = "llama_3_2"
             else:
                 target_family = "llama_3" 
        elif "llama2" in model_name.lower():
            target_family = "llama_2"
            
        if target_family and target_family in families:
            models = families[target_family]
            for m in models:
                if self._match_size(m["model"], model_name):
                    rates = m["on_demand"]
                    return rates["input"] / 1000, rates["output"] / 1000
                    
        return 0.0003 / 1000, 0.0006 / 1000

    def _match_size(self, json_model_name: str, req_model_id: str) -> bool:
        sizes = ["1b", "3b", "8b", "70b", "405b", "11b", "90b"]
        json_lower = json_model_name.lower()
        req_lower = req_model_id.lower()
        for size in sizes:
            if size in json_lower and size in req_lower:
                return True
        return False
        
    def _get_openai_rates(self, model_name: str) -> (float, float):
        """
        OpenAI pricing is per 1M tokens in the new JSON.
        Returns: Rate per 1 token.
        """
        # Load tiers -> standard by default
        tiers = self.openai_pricing.get("tiers", {})
        standard_models = tiers.get("standard", [])
        
        for m in standard_models:
            # Exact or prefix match 
            if m["model"] in model_name:
                return m["input"] / 1_000_000, m["output"] / 1_000_000
        
        # Default (GPT-4o standard)
        return 2.50 / 1_000_000, 10.00 / 1_000_000
    
    def _get_gcp_rates(self, model_name: str) -> (float, float):
        """
        GCP Vertex AI pricing is per 1M tokens.
        Returns: Rate per 1 token.
        """
        models = self.gcp_pricing.get("models", [])
        
        # Clean model name (remove google/ prefix)
        clean_name = model_name.replace("google/", "")
        
        for m in models:
            # Exact or prefix match
            if m["model"] in clean_name or clean_name in m["model"]:
                return m["input"] / 1_000_000, m["output"] / 1_000_000
        
        # Default (Gemini 2.5 Flash)
        return 0.075 / 1_000_000, 0.30 / 1_000_000

pricing_service = PricingService()
