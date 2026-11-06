import html
import re
from typing import Optional

# Common prompt injection signatures targeting LLMs in hiring/assessment pipelines
PROMPT_INJECTION_PATTERNS = [
    r"(?i)ignore\s+(?:all\s+)?(?:previous|prior|above)\s+(?:instructions|prompts|rules)",
    r"(?i)disregard\s+(?:all\s+)?(?:previous|prior|above)\s+(?:instructions|prompts|rules)",
    r"(?i)you\s+are\s+now\s+(?:a|in|acting\s+as)\s+(?:developer|dan|jailbreak|root|admin)",
    r"(?i)system\s*:\s*(?:override|bypass|admin)",
    r"(?i)output\s+(?:all\s+)?system\s+prompts?",
    r"(?i)<\|im_start\|>",
    r"(?i)<\|system\|>",
    r"(?i)\[system\]",
    r"(?i)```\s*system",
]


def sanitize_text_input(text: Optional[str], max_length: int = 5000) -> str:
    """
    Sanitizes user input to prevent Stored XSS and excessive payload attacks.
    Escapes HTML entities, strips null bytes, and enforces character bounds.
    """
    if not text:
        return ""
    # Strip null bytes and normalize whitespace
    cleaned = text.replace("\x00", "").strip()
    # Truncate to maximum permissible length
    cleaned = cleaned[:max_length]
    # Escape HTML to prevent script execution if rendered raw
    cleaned = html.escape(cleaned, quote=True)
    return cleaned


def defang_prompt_injection(user_input: Optional[str], max_length: int = 8000) -> str:
    """
    Sanitizes user inputs before interpolation into RAG system prompts.
    Defangs meta-instructions, delimiter injection, and role spoofing attempts.
    """
    if not user_input:
        return ""

    cleaned = user_input.replace("\x00", "").strip()[:max_length]

    # Neutralize prompt delimiters that could confuse LLM parsing
    delimiters = ["<|im_start|>", "<|im_end|>", "<|system|>", "```system", "### System:"]
    for delim in delimiters:
        cleaned = re.sub(re.escape(delim), "[filtered-delimiter]", cleaned, flags=re.IGNORECASE)

    # Detect explicit prompt injection phrases and defang them
    for pattern in PROMPT_INJECTION_PATTERNS:
        cleaned = re.sub(pattern, "[sanitized-instruction]", cleaned)

    return cleaned


def validate_file_safety(filename: str, content: bytes, max_size_bytes: int) -> None:
    """
    Validates file payload against size limits and dangerous binary signatures.
    """
    if len(content) > max_size_bytes:
        raise ValueError(f"File exceeds maximum permissible size ({max_size_bytes} bytes)")

    # Reject dangerous executable signatures (e.g. PE header MZ or ELF)
    if content.startswith(b"MZ") or content.startswith(b"\x7fELF"):
        raise ValueError("Executable binaries (.exe, ELF) are strictly forbidden")
