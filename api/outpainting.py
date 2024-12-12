import os
import base64

def process_uploaded_image(image_bytes):
    """Process an uploaded image from bytes"""
    # Get the public directory path and base.png
    public_dir = os.path.join(os.path.dirname(__file__), '../public')
    base_image_path = os.path.join(public_dir, "base.png")
    
    # Read the base image and convert to base64
    with open(base_image_path, "rb") as f:
        output_bytes = f.read()
        base64_image = base64.b64encode(output_bytes).decode('utf-8')
        
    return base64_image