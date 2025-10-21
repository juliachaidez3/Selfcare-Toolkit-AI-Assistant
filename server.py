from flask import Flask, request, jsonify, render_template
from openai import OpenAI
from dotenv import load_dotenv
import os
from prompts import system_prompt, user_prompt_template

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
app = Flask(__name__)

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/api/toolkit", methods=["POST"])
def toolkit():
    try:
        data = request.get_json()
        prompt = user_prompt_template.format(
            struggle=data.get("struggle"),
            mood=data.get("mood"),
            focus=data.get("focus"),
            coping_preferences=", ".join(data.get("copingPreferences", [])),
            energy_level=data.get("energyLevel")
        )

        response = client.chat.completions.create(
            model="gpt-5-nano",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )

        output = response.choices[0].message.content or "{}"
        
        # Debug: Print raw AI response
        print(f"Raw AI response: {output}")
        
        # Check for common error messages
        if "This response contains JSON" in output or "structured format" in output or "must be a JSON array" in output:
            return jsonify({"error": "AI returned format message instead of JSON. Please try again."}), 500
        
        import json
        try:
            parsed_output = json.loads(output)
            print(f"Parsed output: {parsed_output}")
        except json.JSONDecodeError as e:
            print(f"JSON parsing error: {e}")
            print(f"Raw output: {output}")
            return jsonify({"error": "Invalid JSON response from AI. Please try again."}), 500
        
        # Streamlined JSON handling - look for any array in the response
        recommendations = []
        
        if isinstance(parsed_output, list):
            # Direct array response
            recommendations = parsed_output
        elif isinstance(parsed_output, dict):
            # Look for any array property
            for key, value in parsed_output.items():
                if isinstance(value, list) and len(value) > 0:
                    recommendations = value
                    break
            
            # Check for null/empty responses
            if not recommendations and any(v is None for v in parsed_output.values()):
                return jsonify({"error": "AI returned null/empty response. Please try again."}), 500
        
        if recommendations:
            return jsonify({"items": recommendations})
        else:
            return jsonify({"error": "No valid recommendations found in AI response. Please try again."}), 500
    
    except Exception as e:
        print(f"Error: {e}")  # For debugging
        error_msg = str(e)
        if "quota" in error_msg.lower() or "429" in error_msg:
            return jsonify({"error": "API quota exceeded. Please check your OpenAI account billing."}), 500
        elif "api_key" in error_msg.lower():
            return jsonify({"error": "Invalid API key. Please check your OpenAI configuration."}), 500
        else:
            return jsonify({"error": "Failed to generate toolkit. Please try again."}), 500

if __name__ == "__main__":
    app.run(debug=True)
