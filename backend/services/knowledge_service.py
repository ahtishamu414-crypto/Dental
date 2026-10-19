import json
from pathlib import Path
from typing import Optional, Dict, Any, List
from bson import ObjectId

from backend.services.database import get_database
from backend.models.clinic_models import ServiceModel, ServiceUpdateRequest, HoursModel, FAQModel


class KnowledgeService:
    """
    MongoDB-backed Knowledge Service.
    
    Reads and updates clinic information dynamically in MongoDB.
    Falls back to seeding from local JSON files on first run.
    """

    def __init__(self, clinic_name: str = "bright_smile_dental"):
        self.clinic_name = clinic_name
        self.json_base_path = Path(__file__).parent.parent / "knowledge_base" / clinic_name

    def _get_configs_collection(self):
        db = get_database()
        return db.clinic_configs

    # ==================== SEEDING LOGIC ====================

    async def seed_from_json_if_empty(self) -> None:
        """
        Seed MongoDB from local JSON files if MongoDB doesn't have clinic data yet.
        """
        try:
            collection = self._get_configs_collection()
            existing_config = await collection.find_one({"clinic_key": self.clinic_name})

            if existing_config:
                return  # Data already seeded

            print(f"🌱 Seeding clinic knowledge for '{self.clinic_name}' into MongoDB...")

            # Load JSON files
            profile_data = self._read_json("clinic_profile.json")
            services_data = self._read_json("services.json")
            policies_data = self._read_json("policies.json")
            faqs_data = self._read_json("faqs.json")

            # Transform services list to include MongoDB string IDs
            services_list = []
            for s in services_data.get("services", []):
                services_list.append({
                    "id": str(ObjectId()),
                    "name": s.get("name"),
                    "description": s.get("description"),
                    "price": s.get("price"),
                    "is_active": True
                })

            # Prepare full document
            seed_doc = {
                "clinic_key": self.clinic_name,
                "profile": profile_data,
                "services": services_list,
                "policies": policies_data,
                "faqs": faqs_data.get("faqs", [])
            }

            await collection.insert_one(seed_doc)
            print(f"✅ Successfully seeded knowledge base for '{self.clinic_name}'!")

        except Exception as e:
            print(f"⚠️ Error seeding knowledge base: {e}")

    def _read_json(self, filename: str) -> Dict[str, Any]:
        file_path = self.json_base_path / filename
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}

    # ==================== READ DATA ====================

    async def get_clinic_config(self) -> Dict[str, Any]:
        """Fetch full config document from MongoDB."""
        await self.seed_from_json_if_empty()
        collection = self._get_configs_collection()
        config = await collection.find_one({"clinic_key": self.clinic_name})
        return config or {}

    async def get_services(self) -> List[Dict[str, Any]]:
        """Get all active services."""
        config = await self.get_clinic_config()
        services = config.get("services", [])
        return [s for s in services if s.get("is_active", True)]

    async def get_all_services_admin(self) -> List[Dict[str, Any]]:
        """Get all services including inactive ones for admin panel."""
        config = await self.get_clinic_config()
        return config.get("services", [])

    async def get_opening_hours(self) -> Dict[str, str]:
        """Get opening hours."""
        config = await self.get_clinic_config()
        return config.get("profile", {}).get("opening_hours", {})

    # ==================== WRITE / UPDATE DATA ====================

    async def add_service(self, service: ServiceModel) -> Dict[str, Any]:
        """Add a new service to the clinic."""
        collection = self._get_configs_collection()
        new_service = {
            "id": str(ObjectId()),
            "name": service.name,
            "description": service.description,
            "price": service.price,
            "is_active": service.is_active
        }

        await collection.update_one(
            {"clinic_key": self.clinic_name},
            {"$push": {"services": new_service}}
        )

        return new_service

    async def update_service(self, service_id: str, updates: ServiceUpdateRequest) -> Optional[Dict[str, Any]]:
        """Update an existing service by ID."""
        collection = self._get_configs_collection()
        config = await self.get_clinic_config()
        services = config.get("services", [])

        updated_service = None
        for s in services:
            if s.get("id") == service_id:
                if updates.name is not None:
                    s["name"] = updates.name
                if updates.description is not None:
                    s["description"] = updates.description
                if updates.price is not None:
                    s["price"] = updates.price
                if updates.is_active is not None:
                    s["is_active"] = updates.is_active
                updated_service = s
                break

        if updated_service:
            await collection.update_one(
                {"clinic_key": self.clinic_name},
                {"$set": {"services": services}}
            )

        return updated_service

    async def delete_service(self, service_id: str) -> bool:
        """Delete a service from the clinic by ID."""
        collection = self._get_configs_collection()
        result = await collection.update_one(
            {"clinic_key": self.clinic_name},
            {"$pull": {"services": {"id": service_id}}}
        )
        return result.modified_count > 0

    async def update_opening_hours(self, hours: HoursModel) -> Dict[str, str]:
        """Update clinic opening hours."""
        collection = self._get_configs_collection()
        hours_dict = hours.model_dump()

        await collection.update_one(
            {"clinic_key": self.clinic_name},
            {"$set": {"profile.opening_hours": hours_dict}}
        )

        return hours_dict

    # ==================== PROMPT FORMATTER ====================

    async def format_knowledge_for_prompt(self) -> str:
        """
        Format live MongoDB data into a clean text prompt for Groq AI.
        """
        config = await self.get_clinic_config()

        profile = config.get("profile", {})
        services = [s for s in config.get("services", []) if s.get("is_active", True)]
        policies = config.get("policies", {})
        faqs = config.get("faqs", [])

        knowledge_parts = []

        # Profile
        knowledge_parts.append("=== CLINIC PROFILE ===")
        knowledge_parts.append(f"Clinic Name: {profile.get('clinic_name', 'Bright Smile Dental')}")
        knowledge_parts.append(f"Tagline: {profile.get('tagline', '')}")

        address = profile.get("address", {})
        if address:
            knowledge_parts.append(
                f"Address: {address.get('street', '')}, {address.get('city', '')}, {address.get('state', '')} {address.get('zip', '')}"
            )

        contact = profile.get("contact", {})
        if contact:
            knowledge_parts.append(f"Phone: {contact.get('phone', '(212) 555-0199')}")
            knowledge_parts.append(f"Email: {contact.get('email', 'hello@brightsmiledental.demo')}")

        # Hours
        hours = profile.get("opening_hours", {})
        if hours:
            knowledge_parts.append("\n=== OPENING HOURS ===")
            for day, time in hours.items():
                knowledge_parts.append(f"{day.capitalize()}: {time}")

        # Services & Prices
        if services:
            knowledge_parts.append("\n=== SERVICES AND PRICES ===")
            for s in services:
                knowledge_parts.append(f"- {s.get('name')}: {s.get('description')} ({s.get('price')})")

        # Policies
        if policies:
            knowledge_parts.append("\n=== POLICIES ===")
            cancellation = policies.get("cancellation_policy", {})
            if cancellation:
                knowledge_parts.append(f"Cancellation Notice: {cancellation.get('notice_required', '24 hours')}")
                knowledge_parts.append(f"Cancellation Fee: {cancellation.get('fee', '$50')}")

            insurance = policies.get("insurance", {})
            if insurance:
                accepted = insurance.get("accepted", [])
                knowledge_parts.append(f"Accepted Insurance: {', '.join(accepted)}")

        # Doctors & Specialists
        knowledge_parts.append("\n=== CLINIC DOCTORS & SPECIALISTS ===")
        knowledge_parts.append("- Dr. Sarah Jenkins: General & Preventative Dentistry (Checkups, cleanings, exams)")
        knowledge_parts.append("- Dr. Michael Chen: Orthodontics & Cosmetic Dentistry (Invisalign, teeth whitening, cosmetic consults)")
        knowledge_parts.append("- Dr. Emily Rodriguez: Oral Surgery & Endodontics (Root canal therapy, tooth extractions)")
        knowledge_parts.append("- Patients can request a specific doctor or choose 'Any Available Doctor' for the earliest opening.")

        # Procedure Durations & Scheduling
        knowledge_parts.append("\n=== APPOINTMENT DURATIONS & SCHEDULING RULES ===")
        knowledge_parts.append("- Checkups: 30 minutes | Cleanings: 45 minutes | Fillings / Whitening: 60 minutes | Root Canals: 90 minutes")
        knowledge_parts.append("- Time slots are dedicated: once a slot is reserved, it is locked so other patients cannot book the same time.")
        knowledge_parts.append("- Appointments can be booked starting today up to 90 days in advance (no past dates).")

        # FAQs
        if faqs:
            knowledge_parts.append("\n=== FREQUENTLY ASKED QUESTIONS ===")
            for faq in faqs:
                knowledge_parts.append(f"Q: {faq.get('question')}")
                knowledge_parts.append(f"A: {faq.get('answer')}")

        return "\n".join(knowledge_parts)


# Global instance generator
def get_knowledge_service(clinic_name: str = "bright_smile_dental") -> KnowledgeService:
    return KnowledgeService(clinic_name)