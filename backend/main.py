import asyncio  #For async/await (like in javascript)
import os  # To read environment variables
import logging  # Better than print() for debugging
from uuid import uuid4  # Unique ID generator
from dotenv import load_dotenv  # Load .env file


from vision_agents.core import agents  # The main AI agent 
from vision_agents.plugins import getstream, gemini 
from vision_agents.core.edge.types import User

from vision_agents.core.events import (
    CallSessionParticipantJoinedEvent,
    CallSessionParticipantLeftEvent,
    CallSessionStartedEvent,
    CallSessionEndedEvent,
    PluginErrorEvent
)

from vision_agents.core.llm.events import (
    RealtimeUserSppechTranscriptionEvent,
    LLMResponseChunkEvent
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

meeting_data={
    "transcript": [];
    "is_active": False,
}

async def start_agent(call_id:str):
    """
    Start the meeting assistant agent

    Args:
      csll_id: The meeting ID (must watch frontend)
    """
    logger.info("Starting Meeting Assistant...")
    logger.info(f"Meeting ID: {call_id}")

    agent =agents.Agent(
        edge=getstream.Edge()

        agent_user=User(
            id="meeting-assistant-bot",
            name="Meeting Assistant",
        )

        instructions="You're a helpful meeting assistant that transcribes and summarizes meetings.",

        llm=gemini.Realtime(fps=0)
    ) 

    meeting_data["agent"] = agent
    meeting_data["call_id"] = call_id

    @agent.events.subscribe
    async def handle_session_started(event: CallSessionStartedEvent):
        logger.info("Call started")
        meeting_data["is_active"] = True
        logger.info("Meeting Started")

        

    