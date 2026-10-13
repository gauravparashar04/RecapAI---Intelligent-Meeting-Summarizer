"""
===================================================================================
MODULE: core/extractor.py
PURPOSE:
  Extracts structured meeting intelligence (Action items, Key decisions, Questions)
  from raw transcripts using Mistral AI and LangChain LCEL.
  
RATE-LIMIT HANDLING:
  Includes safe_invoke() with exponential backoff to handle Mistral Free Tier 429
  rate limits gracefully.
===================================================================================
"""

from langchain_mistralai import ChatMistralAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough, RunnableLambda
import os 
import time

def get_llm():
    """Initializes the Mistral AI chat model client with low temperature for precision."""
    model_name = os.getenv("MISTRAL_MODEL", "open-mistral-7b")
    return ChatMistralAI(
        model=model_name,
        mistral_api_key=os.getenv("MISTRAL_API_KEY"),
        temperature=0.2
    )

def safe_invoke(chain, input_data, max_retries: int = 4, base_delay: float = 2.0):
    """
    Executes a LangChain runnable invocation with automatic exponential backoff
    retry if a Mistral HTTP 429 rate limit is encountered.
    """
    for attempt in range(max_retries):
        try:
            return chain.invoke(input_data)
        except Exception as e:
            err_str = str(e).lower()
            if "429" in err_str or "rate limit" in err_str or "rate_limited" in err_str:
                wait_time = base_delay * (2 ** attempt)
                print(f"⚠️ [MISTRAL RATE LIMIT 429] Pacing request. Retrying in {wait_time:.1f}s (attempt {attempt+1}/{max_retries})...")
                time.sleep(wait_time)
            else:
                raise e
    return chain.invoke(input_data)

def build_chain(system_prompt: str):
    """Builds an LCEL string-to-string extraction pipeline."""
    llm = get_llm()
    return (
        RunnablePassthrough()
        | RunnableLambda(lambda x: {"text": x})
        | ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("human", "{text}"),
        ])
        | llm
        | StrOutputParser()
    )

def extract_action_items(transcript: str) -> str:
    """Extracts numbered action items with task description, owner, and deadline."""
    chain = build_chain(
        "You are an expert meeting analyst. From the meeting transcript, "
        "extract all action items. For each provide:\n"
        "- Task description\n"
        "- Owner (who is responsible)\n"
        "- Deadline (if mentioned, else write 'Not specified')\n\n"
        "Format as a numbered list. If none found say 'No action items found.'"
    )
    return safe_invoke(chain, transcript)

def extract_key_decisions(transcript: str) -> str:
    """Extracts numbered strategic decisions agreed upon during the recording."""
    chain = build_chain(
        "You are an expert meeting analyst. From the meeting transcript, "
        "extract all key decisions made. Format as a numbered list. "
        "If none found say 'No key decisions found.'"
    )
    return safe_invoke(chain, transcript)

def extract_questions(transcript: str) -> str:
    """Extracts unresolved questions or topics needing future follow-up."""
    chain = build_chain(
        "From the meeting transcript, extract all unresolved questions "
        "or topics needing follow-up. Format as a numbered list. "
        "If none found say 'No open questions found.'"
    )
    return safe_invoke(chain, transcript)