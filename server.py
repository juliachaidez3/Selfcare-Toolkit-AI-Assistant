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
        import json
        parsed_output = json.loads(output)
        
        # Handle different response structures
        if isinstance(parsed_output, dict):
            if "self_care_toolkit" in parsed_output:
                # If response has self_care_toolkit wrapper, extract the array
                return jsonify({"items": parsed_output["self_care_toolkit"]})
            elif "toolkit" in parsed_output:
                # If response has toolkit wrapper, extract the array
                return jsonify({"items": parsed_output["toolkit"]})
            else:
                # If it's a dict but no known wrapper, return as is
                return jsonify(parsed_output)
        elif isinstance(parsed_output, list):
            # If response is already an array, wrap it in items
            return jsonify({"items": parsed_output})
        else:
            # Fallback to original structure
            return jsonify(parsed_output)
    
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
