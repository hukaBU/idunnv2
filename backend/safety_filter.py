"""Safety Filter for Idunn Wellness Chat
Hard Stop Protocol for Medical Queries
"""

from typing import Tuple

# Comprehensive blocklist of medical trigger words (French + English)
MEDICAL_TRIGGER_WORDS = [
    # French
    'diabète', 'cancer', 'hypertension', 'médicament', 'médicaments',
    'douleur', 'insuline', 'maladie', 'maladies', 'symptôme', 'symptômes',
    'traitement', 'prescription', 'ordonnance', 'diagnostic', 'diagnostique',
    'médecin', 'docteur', 'hôpital', 'urgence', 'chirurgie', 'opération',
    'thérapie', 'pathologie', 'chronique', 'aiguë', 'infection',
    'inflammation', 'tumeur', 'métastase', 'chimiothérapie', 'radiothérapie',
    
    # English
    'diabetes', 'cancer', 'medical', 'suicide', 'depression',
    'medicine', 'drug', 'pain', 'disease', 'illness', 'treatment',
    'medication', 'prescription', 'diagnose', 'diagnosis', 'therapy',
    'symptoms', 'condition', 'sick', 'doctor', 'physician', 'hospital',
    'emergency', 'surgery', 'chronic', 'acute', 'infection',
    'inflammation', 'tumor', 'metastasis', 'chemotherapy', 'radiotherapy',
    
    # Specific medications (examples)
    'metformin', 'insulin', 'aspirin', 'ibuprofen', 'paracetamol',
    'antibiotique', 'antibiotic', 'antidépresseur', 'antidepressant',
    
    # Mental health (high risk)
    'suicide', 'suicidal', 'self-harm', 'harm myself', 'kill myself',
    'mourir', 'mort', 'tuer', 'suicidaire',
]

# Hard Stop Response (multilingual)
SAFETY_RESPONSES = {
    'fr': "Je suis un assistant de bien-être, pas un professionnel de santé. Je ne peux pas donner de conseils sur des conditions médicales. Veuillez consulter votre médecin.",
    'en': "I am a wellness assistant, not a medical professional. I cannot give advice on medical conditions. Please consult your doctor."
}

def check_safety(message: str, language: str = 'en') -> Tuple[bool, str]:
    """
    Check if a message contains medical trigger words.
    
    Args:
        message: The user's message to check
        language: Language code ('en' or 'fr') for response
        
    Returns:
        Tuple of (is_safe, safety_message)
        - is_safe: True if message is safe, False if it contains trigger words
        - safety_message: Empty string if safe, otherwise the hard stop response
    """
    message_lower = message.lower()
    
    # Check each trigger word
    for trigger_word in MEDICAL_TRIGGER_WORDS:
        if trigger_word in message_lower:
            response = SAFETY_RESPONSES.get(language, SAFETY_RESPONSES['en'])
            return False, response
    
    return True, ""

def is_medical_query(message: str) -> bool:
    """
    Quick check if message is medical-related.
    
    Args:
        message: The user's message
        
    Returns:
        True if message contains medical trigger words, False otherwise
    """
    message_lower = message.lower()
    return any(trigger_word in message_lower for trigger_word in MEDICAL_TRIGGER_WORDS)
