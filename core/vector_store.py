"""
===================================================================================
MODULE: core/vector_store.py
PURPOSE:
  Manages the ChromaDB vector database lifecycle for the AI Meeting Assistant.
  This module takes raw meeting transcripts, breaks them down into semantic text
  chunks using recursive character splitting, embeds them using Hugging Face
  embeddings ('all-MiniLM-L6-v2'), and stores them in persistent vector collections.
  
ROLE IN MERN ARCHITECTURE:
  When a user analyzes a video, the transcript is embedded and indexed in ChromaDB.
  When the user asks questions in the React chat widget, the retriever queries
  this vector store to retrieve the top-k most relevant chunks to ground the LLM.
===================================================================================
"""

# OS module for file path operations and directory checks
import os 
# Chroma vector store wrapper from LangChain for persistent vector indexing
from langchain_chroma import Chroma 
# Hugging Face embeddings model to convert text chunks into dense 384-dimensional vectors
from langchain_community.embeddings import HuggingFaceEmbeddings
# Text splitter that splits text at semantic boundaries (paragraphs, sentences, words)
from langchain_text_splitters import RecursiveCharacterTextSplitter
# LangChain Document schema wrapping chunk content and metadata
from langchain_core.documents import Document

# Base directory where ChromaDB stores its persistent SQLite and index files
CHROMA_DIR = "vector_db"

# Default collection name used when no specific meeting ID is provided
DEFAULT_COLLECTION_NAME = "meeting_transcript"

# Embedding model identifier from Hugging Face (lightweight, fast, 384-dimensional)
EMBEDDING_MODEL = "all-MiniLM-L6-v2"


def get_embeddings():
    """
    Initializes and returns the Hugging Face sentence-transformers embedding model.
    Runs locally on CPU for cost-free, offline semantic vector generation.
    """
    # Instantiate the embeddings model specifying CPU execution
    return HuggingFaceEmbeddings(
        model_name=EMBEDDING_MODEL,
        model_kwargs={"device": "cpu"}
    )


def build_vector_store(transcript: str, collection_name: str = DEFAULT_COLLECTION_NAME) -> Chroma:
    """
    Chunks a meeting transcript, generates embeddings, and saves them into ChromaDB.
    
    Args:
        transcript (str): The complete raw meeting transcript text.
        collection_name (str): Unique collection identifier (e.g., 'meeting_<id>')
                               enabling multi-meeting isolation.
    Returns:
        Chroma: The populated LangChain Chroma vector store instance.
    """
    # Log progress for terminal / server monitoring
    print(f"Building vector store for collection: '{collection_name}'...")

    # Initialize the recursive text splitter with 500-char chunks and 50-char overlap
    # Overlap prevents semantic information from being severed at chunk boundaries
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50
    )
    
    # Split the long transcript string into a list of chunk strings
    chunks = splitter.split_text(transcript)

    # Wrap each chunk into a LangChain Document with metadata tracking its sequence index
    docs = [
        Document(page_content=chunk, metadata={'chunk_index': i, 'collection': collection_name})
        for i, chunk in enumerate(chunks)
    ]

    # Load the embedding model
    embeddings = get_embeddings()

    # Build and persist the vector store with the designated collection name
    vector_store = Chroma.from_documents(
        documents=docs,
        embedding=embeddings,
        collection_name=collection_name,
        persist_directory=CHROMA_DIR
    )

    print(f"Vector store built successfully with {len(docs)} chunks indexed.")
    return vector_store


def load_vector_store(collection_name: str = DEFAULT_COLLECTION_NAME) -> Chroma:
    """
    Loads an existing persistent ChromaDB vector store collection from disk.
    
    Args:
        collection_name (str): Name of the collection to load.
    Returns:
        Chroma: Connected ChromaDB vector store instance ready for queries.
    """
    # Re-initialize embeddings to compute vector similarity for search queries
    embeddings = get_embeddings()
    
    # Connect to the persisted Chroma database on disk
    vector_store = Chroma(
        collection_name=collection_name,
        embedding_function=embeddings,
        persist_directory=CHROMA_DIR
    )

    return vector_store


def get_retriever(vector_store: Chroma, k: int = 4):
    """
    Converts a Chroma vector store into a LangChain retriever.
    
    Args:
        vector_store (Chroma): The vector store to search against.
        k (int): Number of top most similar chunks to retrieve (default: 4).
    Returns:
        VectorStoreRetriever: Configured similarity retriever.
    """
    # Configure retriever with similarity search returning top-k matching documents
    return vector_store.as_retriever(
        search_type='similarity',
        search_kwargs={"k": k}
    )
