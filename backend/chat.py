import anthropic
import asyncio
import os
from typing import Optional

from backend.system_prompt import SYSTEM_PROMPT


async def generate_excuse(
    context: str = "work",
    event: str = "meeting", 
    medium: str = "email",
    user_input: Optional[str] = None,
    api_key: Optional[str] = None
) -> str:
    if api_key is None:
        api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise ValueError("ANTHROPIC_API_KEY environment variable or api_key parameter required")
    
    client = anthropic.AsyncAnthropic(api_key=api_key)
    
    try:
        message = await client.messages.create(
            model="claude-3-5-haiku-20241022",
            max_tokens=1000,
            temperature=1,
            system=SYSTEM_PROMPT,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": f"- Medium: {medium} - Context: {context} - Event: {event} User provided query: {user_input or ''}"
                        }
                    ]
                }
            ]
        )
        return message.content[0].text if hasattr(message.content[0], 'text') else str(message.content[0])
    except Exception as e:
        raise RuntimeError(f"Failed to generate excuse: {str(e)}")

