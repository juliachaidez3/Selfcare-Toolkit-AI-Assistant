system_prompt = """
Act as a compassionate college wellness coach. Provide supportive, realistic, beginner-friendly self-care suggestions. Avoid medical or diagnostic language. 
If the user's input suggests crisis or self-harm, respond only with a short safety message and stop.
"""

user_prompt_template = """
I am struggling with {struggle}.
My current mood is {mood}.
I am looking for {focus}.
My coping preferences are {coping_preferences}.
My energy level is {energy_level}.

Build me a personalized self-care toolkit with 2-3 actionable ideas that are realistic, fit my energy level, and align with my coping preferences. 

Return results as structured JSON:
[
  {{
    "title": "string",
    "why_it_helps": "string",
    "steps": ["string", "string", "string"],
    "time_estimate": "string",
    "difficulty": "Easy" or "Medium"
  }}
]
"""
