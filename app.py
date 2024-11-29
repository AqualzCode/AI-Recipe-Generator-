from flask import Flask, render_template, request, jsonify
from openai import OpenAI
import os
from dotenv import load_dotenv
import logging

load_dotenv()
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)

def format_recipe(recipe_text):
    # sections
    sections = recipe_text.split('\n\n')
    formatted_sections = []
    
    for section in sections:
        if 'Ingredients:' in section:
            # format ingredients as a list
            lines = section.split('\n')
            formatted_sections.append(f"<h2>{lines[0]}</h2>")
            formatted_sections.append("<ul>")
            for line in lines[1:]:
                if line.strip():
                    formatted_sections.append(f"<li>{line.strip()}</li>")
            formatted_sections.append("</ul>")
        elif 'Instructions:' in section:
            # format instructions as a numbered list
            lines = section.split('\n')
            formatted_sections.append(f"<h2>{lines[0]}</h2>")
            formatted_sections.append("<ol>")
            for line in lines[1:]:
                if line.strip(): 
                    # removee leading numbers if they exist
                    cleaned_line = line.strip()
                    if cleaned_line[0].isdigit() and cleaned_line[1] in ['.', ')']:
                        cleaned_line = cleaned_line[2:].strip()
                    formatted_sections.append(f"<li>{cleaned_line}</li>")
            formatted_sections.append("</ol>")
        else:
            # format other sections with paragraphs
            formatted_sections.append(f"<p>{section}</p>")
    
    return '\n'.join(formatted_sections)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/generate_recipe', methods=['POST'])
def generate_recipe():
    try:
        data = request.json
        cuisine = data.get('cuisine', '')
        dietary_restrictions = data.get('restrictions', [])
        
        if not cuisine:
            return jsonify({
                'success': False,
                'error': 'Cuisine is required'
            }), 400
        
        # create prompt for recipe generation
        restrictions_text = ', '.join(dietary_restrictions)
        base_prompt = (
            "Create a recipe for a delicious {cuisine} dish{restrictions}. "
            "Structure the response with:\n"
            "1. A brief description of the dish\n"
            "2. 'Ingredients:' followed by a list of ingredients with measurements\n"
            "3. 'Instructions:' followed by numbered, step-by-step cooking instructions\n"
            "4. Optional cooking tips or variations"
        )
        
        restrictions_phrase = f" that is {restrictions_text}" if restrictions_text else ""
        prompt = base_prompt.format(cuisine=cuisine, restrictions=restrictions_phrase)

        try:
            # First, try to generate the recipe
            recipe_response = client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are a professional chef creating detailed, easy-to-follow recipes. Your recipes should be creative yet practical, using commonly available ingredients. Include precise measurements and clear instructions."},
                    {"role": "user", "content": prompt}
                ]
            )
            recipe = recipe_response.choices[0].message.content
            formatted_recipe = format_recipe(recipe)

            # Only if recipe generation succeeds, try to generate the image
            try:
                image_prompt = f"A professional, appetizing food photography style image of a {cuisine} dish{restrictions_phrase}, on a beautiful plate with garnish, soft natural lighting, shallow depth of field, high-end restaurant presentation"
                image_response = client.images.generate(
                    prompt=image_prompt,
                    n=1,
                    size="1024x1024",
                    quality="hd",
                    model="dall-e-3"
                )
                image_url = image_response.data[0].url
            except Exception as img_error:
                logging.error(f"Image generation failed: {str(img_error)}")
                # If image generation fails, return recipe without image
                return jsonify({
                    'success': True,
                    'recipe': formatted_recipe,
                    'image_url': None,
                    'warning': 'Recipe generated successfully, but image generation failed'
                })

            return jsonify({
                'success': True,
                'recipe': formatted_recipe,
                'image_url': image_url
            })
            
        except Exception as recipe_error:
            logging.error(f"Recipe generation failed: {str(recipe_error)}")
            return jsonify({
                'success': False,
                'error': 'Failed to generate recipe. Please try again.'
            }), 500
            
    except Exception as e:
        logging.error(f"Request processing failed: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'An unexpected error occurred. Please try again.'
        }), 500

if __name__ == '__main__':
    app.run(debug=True)