import os
from typing import Optional, List, Dict, Any
from openai import AsyncOpenAI
from dotenv import load_dotenv

from backend.services.knowledge_service import get_knowledge_service

load_dotenv()

api_key = os.getenv("GROQ_API_KEY")

if not api_key:
    raise ValueError("GROQ_API_KEY is missing from .env")

client = AsyncOpenAI(
    api_key=api_key,
    base_url="https://api.groq.com/openai/v1"
)


async def generate_response(
    message: Optional[str] = None,
    messages: Optional[List[Dict[str, str]]] = None
) -> str:
    """
    Generate an AI response using live MongoDB clinic knowledge and multi-turn context.
    """
    # Fetch live prompt from MongoDB (with graceful fallback if DB is initializing or offline)
    clinic_knowledge = ""
    try:
        knowledge_service = get_knowledge_service("bright_smile_dental")
        clinic_knowledge = await knowledge_service.format_knowledge_for_prompt()
    except Exception as e:
        print(f"[WARN] Failed to load live clinic knowledge from DB: {e}")

    system_prompt = f"""
You are the AI receptionist for Bright Smile Dental, a dental clinic in New York.

=== CLINIC KNOWLEDGE BASE ===
Use ONLY the following information to answer questions about the clinic:

{clinic_knowledge}

=== YOUR RESPONSIBILITIES ===

1. Answer questions about dental services using the knowledge base above.
2. Provide clinic information (hours, location, contact) from the knowledge base.
3. Explain appointment request procedures from the knowledge base.
4. Communicate politely and professionally.
5. Ask clarifying questions when needed.
6. Transfer complex inquiries to human staff.

=== STRICT RULES — DO NOT VIOLATE ===

1. ONLY use information from the Clinic Knowledge Base above.
2. NEVER invent clinic services, prices, opening hours, or availability.
3. NEVER diagnose dental conditions or symptoms.
4. NEVER prescribe medication or recommend specific treatments.
5. NEVER claim that an appointment is confirmed (only staff can confirm).
6. NEVER request medical history or sensitive health information.
7. For urgent dental concerns, recommend contacting the clinic or a qualified professional promptly.
8. If you do not know an answer or the information is not in the knowledge base, say so clearly and offer human assistance.
9. Do not make up prices, services, or policies that are not listed above.
10. Always remind users that appointment requests must be verified by clinic staff.

=== FORMATTING RULES FOR CHAT INTERFACE ===
You are responding in a live chat widget. Follow these rules strictly:

1. NEVER use Markdown tables. Use simple lists instead.
2. NEVER use Markdown headers (#, ##, ###).
3. NEVER use bold (**text**) or italics (*text*).
4. NEVER use code blocks or backticks.
5. Use simple bullet points with dashes (-) for lists.
6. Keep responses concise - under 120 words for most questions.
7. When listing services, use one service per line in this format:
   - Service Name: Short description ($Price)
8. Use a warm, friendly tone like a real receptionist at a front desk.
9. Do not end every message with "Let me know if you need anything!" Vary your closings naturally.
10. Use at most ONE emoji per response if appropriate.
11. Write in plain conversational English.
12. If a question has a short answer, give the short answer.

=== CONTACT INFORMATION ===

If the user needs human assistance, provide:
- Phone: (212) 555-0199
- Email: hello@brightsmiledental.demo
"""

    conversation = [{"role": "system", "content": system_prompt}]

    user_query = ""
    if messages and len(messages) > 0:
        recent = messages[-10:]
        for m in recent:
            role = m.get("role")
            content = m.get("content")
            if role in ["user", "assistant"] and content:
                conversation.append({"role": role, "content": str(content)})
                if role == "user":
                    user_query = str(content)
    elif message:
        conversation.append({"role": "user", "content": str(message)})
        user_query = str(message)

    try:
        response = await client.chat.completions.create(
            model="openai/gpt-oss-20b",
            messages=conversation,
            max_tokens=650,
            temperature=0.3
        )
        content = (response.choices[0].message.content or "").strip()
        if not content:
            return _local_knowledge_fallback(user_query)
        return content
    except Exception as err:
        print(f"[WARN] Groq AI completion error: {err}. Using local clinic knowledge fallback.")
        return _local_knowledge_fallback(user_query)


def _local_knowledge_fallback(user_text: str) -> str:
    text = (user_text or "").lower()
    if any(k in text for k in ["price", "cost", "how much", "rate", "fee"]):
        return (
            "Here are our current service prices at Bright Smile Dental:\n\n"
            "- General Checkup: Comprehensive oral examination with X-rays ($150)\n"
            "- Professional Cleaning: Tartar and plaque removal ($200)\n"
            "- Teeth Whitening: In-office brightening treatment ($450)\n"
            "- Dental Fillings: Composite resin fillings ($250 per tooth)\n"
            "- Root Canal Therapy: Endodontic treatment ($1,200)\n"
            "- Tooth Extraction: Simple extraction of damaged teeth ($300)\n"
            "- Orthodontic Consult: Invisalign / Braces assessment ($180)\n\n"
            "Would you like to schedule an appointment for any of these treatments?"
        )
    if any(k in text for k in ["hour", "open", "time", "close", "schedule", "weekend"]):
        return (
            "Our clinic hours at Bright Smile Dental are:\n\n"
            "- Monday to Wednesday: 9:00 AM – 6:00 PM\n"
            "- Thursday: 9:00 AM – 8:00 PM (Late evening)\n"
            "- Friday: 9:00 AM – 5:00 PM\n"
            "- Saturday: 10:00 AM – 2:00 PM\n"
            "- Sunday: Closed\n\n"
            "Call (212) 555-0199 or click 'Book Visit' above to request your slot!"
        )
    if any(k in text for k in ["doctor", "dentist", "specialist", "staff", "who"]):
        return (
            "Our clinical team at Bright Smile Dental includes:\n\n"
            "- Dr. Sarah Jenkins: General & Preventative Dentistry\n"
            "- Dr. Michael Chen: Orthodontics & Cosmetic Dentistry\n"
            "- Dr. Emily Rodriguez: Oral Surgery & Endodontics\n\n"
            "You can choose a specific doctor or select 'Any Available Doctor' for the earliest appointment."
        )
    if any(k in text for k in ["insurance", "cigna", "delta", "metlife", "aetna", "coverage", "pay"]):
        return (
            "Yes! We accept major dental insurance providers including Delta Dental, Cigna, MetLife, and Aetna. "
            "We also provide transparent pricing and itemized receipts for HSA/FSA claims."
        )
    if any(k in text for k in ["book", "appointment", "visit", "schedule", "reserve"]):
        return (
            "You can easily request an appointment online in under 60 seconds! "
            "Simply click the 'Book Visit' button at the top right of this chat, choose your preferred dentist, date, and service."
        )
    if any(k in text for k in ["address", "location", "where", "directions", "map"]):
        return (
            "Bright Smile Dental is located at 123 Demo Avenue, Midtown Manhattan, NY 10001. "
            "Convenient to major transit with validated nearby parking. Phone: (212) 555-0199."
        )
    return (
        "Welcome to Bright Smile Dental! I am here to help you with service prices, opening hours, dentists, "
        "and booking appointment requests.\n\n"
        "Feel free to ask a question or click 'Book Visit' at the top of the chat to schedule care!"
    )