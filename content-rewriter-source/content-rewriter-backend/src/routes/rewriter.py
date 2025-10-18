from flask import Blueprint, jsonify, request
import openai
import os
import re

rewriter_bp = Blueprint('rewriter', __name__)

# Initialize OpenAI client
client = openai.OpenAI(
    api_key=os.getenv('OPENAI_API_KEY'),
    base_url=os.getenv('OPENAI_API_BASE')
)

def get_rewrite_prompt(mode, tone, percentage=None):
    """Generate appropriate prompt based on mode and tone"""
    
    tone_instructions = {
        'business': 'Use professional, formal language suitable for business communications. Maintain clarity and authority.',
        'casual': 'Use relaxed, conversational language. Make it sound natural and friendly.',
        'humorous': 'Add light humor and wit while maintaining the core message. Use playful language.',
        'academic': 'Use scholarly, precise language with sophisticated vocabulary and formal structure.'
    }
    
    mode_instructions = {
        'humanize': 'Make light, natural adjustments to improve flow and readability while keeping the original meaning completely intact. Focus on making the text sound more natural and human-like.',
        'extreme': 'Perform deep paraphrasing with significant sentence restructuring, synonym replacement, and stylistic changes while preserving the core meaning.',
        'manual': f'Rewrite approximately {percentage}% of the text. Focus on the most impactful changes while maintaining coherence.'
    }
    
    base_prompt = f"""You are a professional text rewriter. Your task is to rewrite the given text according to these specifications:

MODE: {mode_instructions.get(mode, mode_instructions['humanize'])}
TONE: {tone_instructions.get(tone, tone_instructions['business'])}

IMPORTANT RULES:
1. Preserve the original meaning and key information
2. Maintain the same general structure and length
3. Return ONLY the rewritten text, no explanations or comments
4. Keep any formatting (paragraphs, line breaks) intact
5. Do not add introductory phrases like "Here's the rewritten text:"

Text to rewrite:
"""
    
    return base_prompt

@rewriter_bp.route('/rewrite', methods=['POST'])
def rewrite_text():
    try:
        data = request.json
        
        # Validate required fields
        if not data or 'text' not in data:
            return jsonify({'error': 'Text is required'}), 400
        
        text = data['text'].strip()
        if not text:
            return jsonify({'error': 'Text cannot be empty'}), 400
        
        mode = data.get('mode', 'humanize')
        tone = data.get('tone', 'business')
        percentage = data.get('percentage', 50)
        
        # Validate mode
        valid_modes = ['humanize', 'extreme', 'manual']
        if mode not in valid_modes:
            return jsonify({'error': f'Invalid mode. Must be one of: {valid_modes}'}), 400
        
        # Validate tone
        valid_tones = ['business', 'casual', 'humorous', 'academic']
        if tone not in valid_tones:
            return jsonify({'error': f'Invalid tone. Must be one of: {valid_tones}'}), 400
        
        # Validate percentage for manual mode
        if mode == 'manual':
            try:
                percentage = int(percentage)
                if percentage < 1 or percentage > 100:
                    return jsonify({'error': 'Percentage must be between 1 and 100'}), 400
            except (ValueError, TypeError):
                return jsonify({'error': 'Invalid percentage value'}), 400
        
        # Generate prompt
        prompt = get_rewrite_prompt(mode, tone, percentage)
        
        # Call OpenAI API
        response = client.chat.completions.create(
            model="gpt-4.1-mini",
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": text}
            ],
            temperature=0.7,
            max_tokens=4000
        )
        
        rewritten_text = response.choices[0].message.content.strip()
        
        return jsonify({
            'original_text': text,
            'rewritten_text': rewritten_text,
            'mode': mode,
            'tone': tone,
            'percentage': percentage if mode == 'manual' else None,
            'word_count_original': len(text.split()),
            'word_count_rewritten': len(rewritten_text.split())
        })
        
    except openai.APIError as e:
        return jsonify({'error': f'OpenAI API error: {str(e)}'}), 500
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@rewriter_bp.route('/modes', methods=['GET'])
def get_modes():
    """Get available rewrite modes and tones"""
    return jsonify({
        'modes': [
            {
                'id': 'humanize',
                'name': 'Humanize Mode',
                'description': 'Light, natural adjustments while keeping meaning intact'
            },
            {
                'id': 'extreme',
                'name': 'Extreme Mode',
                'description': 'Deep paraphrasing with sentence restructuring and stylistic shifts'
            },
            {
                'id': 'manual',
                'name': 'Manual % Mode',
                'description': 'User-defined percentage of text to be rewritten'
            }
        ],
        'tones': [
            {
                'id': 'business',
                'name': 'Business',
                'description': 'Professional, formal language'
            },
            {
                'id': 'casual',
                'name': 'Casual',
                'description': 'Relaxed, conversational language'
            },
            {
                'id': 'humorous',
                'name': 'Humorous',
                'description': 'Light humor and wit'
            },
            {
                'id': 'academic',
                'name': 'Academic',
                'description': 'Scholarly, precise language'
            }
        ]
    })

@rewriter_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'content-rewriter-api'})
