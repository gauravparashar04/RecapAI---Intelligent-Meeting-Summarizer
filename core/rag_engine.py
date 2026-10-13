"""
===================================================================================
MODULE: core/rag_engine.py
PURPOSE:
  Implements the Retrieval-Augmented Generation (RAG) pipeline using LangChain
  Expression Language (LCEL) and Mistral AI.
  
HOW IT WORKS:
  1. Vector Store Search: Queries ChromaDB to find the top 4 transcript chunks
     semantically relevant to the user's question.
  2. Grounded Prompt Formulation: Inserts the retrieved chunks into a strict system
     prompt that prohibits hallucinations.
  3. LLM Generation: Invokes Mistral AI (`mistral-small-latest`) to generate a
     concise, grounded response. If the requested information is absent, it responds:
     "I could not find this information in the meeting transcript."
     
ROLE IN MERN ARCHITECTURE:
  Powers the interactive meeting chat endpoint in the FastAPI microservice.
  When the React user submits a question in the chat widget, Express calls this
  engine, which retrieves relevant sections from the meeting and returns the answer.
===================================================================================
"""

# OS module for retrieving environment variables (MISTRAL_API_KEY)
import os
# LangChain integration for Mistral AI chat models
from langchain_mistralai import ChatMistralAI
# Template class for structuring conversational system and user prompts
from langchain_core.prompts import ChatPromptTemplate
# Parser that extracts plain string text from the LLM's AIMessage response
from langchain_core.output_parsers import StrOutputParser
# LCEL Runnables for passing data and applying custom lambda transformations
from langchain_core.runnables import RunnablePassthrough, RunnableLambda
# Helper functions for vector store generation, loading, and retriever creation
from core.vector_store import (
    build_vector_store,
    load_vector_store,
    get_retriever,
    DEFAULT_COLLECTION_NAME
)


def get_llm():
    """
    Initializes the Mistral AI chat model client using environment variables.
    Temperature is set to 0.3 to ensure deterministic, factually accurate answers.
    """
    model_name = os.getenv("MISTRAL_MODEL", "open-mistral-7b")
    # Create and return ChatMistralAI instance configured with API key and temperature
    return ChatMistralAI(
        model=model_name,
        mistral_api_key=os.getenv("MISTRAL_API_KEY"),
        temperature=0.3,
    )


def format_docs(docs):
    """
    Combines retrieved LangChain Document chunks into a single readable string.
    
    Args:
        docs (list[Document]): List of retrieved transcript chunks.
    Returns:
        str: Concatenated text context separated by double newlines.
    """
    # Join document page contents with clear line breaks
    return "\n\n".join([doc.page_content for doc in docs])


def build_rag_chain(transcript: str, collection_name: str = DEFAULT_COLLECTION_NAME):
    """
    Constructs a complete RAG LCEL chain from a new transcript and indexes it in ChromaDB.
    
    Args:
        transcript (str): The complete raw meeting transcript.
        collection_name (str): The vector collection name for meeting isolation.
    Returns:
        Runnable: An executable LangChain LCEL RAG chain.
    """
    # Step 1: Chunk, embed, and store the transcript in ChromaDB
    vector_store = build_vector_store(transcript, collection_name=collection_name)

    # Step 2: Create a retriever to pull top-4 matching context documents
    retriever = get_retriever(vector_store, k=4)

    # Step 3: Initialize the Mistral AI language model
    llm = get_llm()

    # Step 4: Define the strict anti-hallucination system prompt
    prompt = ChatPromptTemplate.from_messages([
        (
            "system",
            """You are an expert meeting assistant. Answer the user's question 
based ONLY on the meeting transcript context provided below.

If the answer is not found in the context, say: 
"I could not find this information in the meeting transcript."

Always be concise and precise. If quoting someone, mention it clearly.

Context from meeting transcript:
{context}""",
        ),
        ("human", "{question}"),
    ])

    # Step 5: Compose the LCEL pipeline:
    #   1. Retrieve documents and format them into 'context'
    #   2. Pass user question directly as 'question'
    #   3. Populate the chat prompt
    #   4. Send to Mistral AI LLM
    #   5. Parse output to a string
    rag_chain = (
        {
            "context": retriever | RunnableLambda(format_docs),
            "question": RunnablePassthrough(),
        }
        | prompt
        | llm
        | StrOutputParser()
    )

    return rag_chain


def load_rag_chain(collection_name: str = DEFAULT_COLLECTION_NAME):
    """
    Loads an existing RAG chain from an already persisted ChromaDB collection.
    
    Args:
        collection_name (str): Name of the Chroma collection to load.
    Returns:
        Runnable: An executable LangChain LCEL RAG chain.
    """
    # Connect to the persisted Chroma vector store on disk
    vector_store = load_vector_store(collection_name=collection_name)
    
    # Create retriever with top-4 search
    retriever = get_retriever(vector_store, k=4)

    # Initialize the LLM
    llm = get_llm()
    
    # Grounded prompt template
    prompt = ChatPromptTemplate.from_messages([
        (
            "system",
            """You are an expert meeting assistant. Answer the user's question 
based ONLY on the meeting transcript context provided below.

If the answer is not found in the context, say: 
"I could not find this information in the meeting transcript."

Always be concise and precise. If quoting someone, mention it clearly.

Context from meeting transcript:
{context}""",
        ),
        ("human", "{question}"),
    ])

    # Construct the LCEL chain
    rag_chain = (
        {
            "context": retriever | RunnableLambda(format_docs),
            "question": RunnablePassthrough(),
        }
        | prompt
        | llm
        | StrOutputParser()
    )

    return rag_chain


def ask_question(rag_chain, question: str) -> str:
    """
    Invokes the compiled RAG chain with a user query and returns the answer.
    
    Args:
        rag_chain: The compiled LCEL chain instance.
        question (str): The user's meeting-related question.
    Returns:
        str: The LLM's grounded response.
    """
    print(f"RAG Query: '{question}'")
    # Execute the chain end-to-end
    answer = rag_chain.invoke(question)
    print(f"RAG Answer: '{answer[:100]}...'")
    return answer