"""
===================================================================================
MODULE: core/summarize.py
PURPOSE:
  Hierarchical Map-Reduce Summarization and Title Generation using Mistral AI.

HOW IT WORKS:
  1. Chunking: Long transcripts are split into 3,000-character segments.
  2. Map Step: Each chunk is summarized individually by Mistral AI.
  3. Reduce Step: All chunk summaries are merged into an executive bullet-point summary.
  4. Rate-Limit Handling: Includes safe_invoke() with exponential backoff to handle
     Mistral Free Tier 429 rate limits gracefully.
===================================================================================
"""

from langchain_mistralai import ChatMistralAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.runnables import RunnablePassthrough, RunnableLambda

import os
import time

def get_llm():
    """Initializes the Mistral AI chat model client."""
    model_name = os.getenv("MISTRAL_MODEL", "open-mistral-7b")
    return ChatMistralAI(
        model=model_name,
        mistral_api_key=os.getenv("MISTRAL_API_KEY"),
        temperature=0.3
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

def split_transcript(transcript: str) -> list:
    """Splits long transcripts into 3,000-character chunks with 200-character overlap."""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=3000,
        chunk_overlap=200
    )
    return splitter.split_text(transcript)

def summarize(transcript: str) -> str:
    """Generates an executive meeting summary using a map-reduce pipeline with rate pacing."""
    llm = get_llm()

    map_prompt = ChatPromptTemplate.from_messages([
        ("system", "Summarize this portion of a meeting transcript concisely."),
        ("human", "{text}"),
    ])
    map_chain = map_prompt | llm | StrOutputParser()

    chunks = split_transcript(transcript)

    chunk_summaries = []
    for i, chunk in enumerate(chunks):
        if i > 0:
            time.sleep(1.2)  # Pacing delay between chunk calls to respect 1 RPS rate limit
        summary_piece = safe_invoke(map_chain, {"text": chunk})
        chunk_summaries.append(summary_piece)

    combined = "\n\n".join(chunk_summaries)

    combined_prompt = ChatPromptTemplate.from_messages([
        (
            "system",
            "You are an expert meeting summarizer. Combine these partial summaries "
            "into one final professional meeting summary in bullet points.",
        ),
        ("human", "{text}"),
    ])

    combined_chain = (
        RunnablePassthrough() | RunnableLambda(lambda x: {"text": x}) | combined_prompt | llm | StrOutputParser()
    )

    time.sleep(1.2)
    return safe_invoke(combined_chain, combined)

def generate_title(transcript: str) -> str:
    """Generates a concise meeting title (max 8 words) from the first 2,000 characters."""
    llm = get_llm()

    title_chain = (
        RunnablePassthrough()
        | RunnableLambda(lambda x: {"text": x})
        | ChatPromptTemplate.from_messages([
            (
                "system",
                "Based on the meeting transcript, generate a short professional meeting title "
                "(max 8 words). Only return the title, nothing else.",
            ),
            ("human", "{text}"),
        ])
        | llm
        | StrOutputParser()
    )

    return safe_invoke(title_chain, transcript[:2000])
