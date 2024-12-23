import os
from PIL import Image
import replicate
from pathlib import Path
import tempfile
import base64
from io import BytesIO
import requests
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get the API token from environment variables
replicate_api_token = os.getenv('REPLICATE_API_TOKEN')
if not replicate_api_token:
    raise ValueError("REPLICATE_API_TOKEN not found in environment variables")

os.environ["REPLICATE_API_TOKEN"] = replicate_api_token

def process_uploaded_image(image_bytes):
    print("processing uploaded image")
    """Process an uploaded image from bytes"""
    with tempfile.TemporaryDirectory() as temp_dir:
        # Save the uploaded image
        input_path = os.path.join(temp_dir, "input.png")
        with open(input_path, "wb") as f:
            f.write(image_bytes)
        print("image saved")
        
        # Get paths to public assets
        public_dir = os.path.join(os.path.dirname(__file__), '../public')
        base_path = os.path.join(public_dir, "base.png")
        mask_path = os.path.join(public_dir, "mask.png")
        
        # First resize the input image
        resized_path = resize_image(input_path)
        print("image resized")
        # Add resized image to base image
        combined_path = add_image_to_base(resized_path, base_path)
        print("image added to base")
        # Generate outpainted image using the mask from public directory
        output_path = generate_outpaint(combined_path, mask_path)
        print("image generated")
        # Read the output image and convert to base64
        with open(output_path, "rb") as f:
            output_bytes = f.read()
            base64_image = base64.b64encode(output_bytes).decode('utf-8')
        print("image processed", base64_image)
        print("returning response base64 image")
        return base64_image

def resize_image(input_image_path):
    """Resize an image to 400x400 pixels and save with '_resized' suffix"""
    with Image.open(input_image_path) as img:
        resized_img = img.resize((400, 400), Image.Resampling.LANCZOS)
        name, ext = os.path.splitext(input_image_path)
        output_image_path = f"{name}_resized{ext}"
        resized_img.save(output_image_path)
        return output_image_path

def add_image_to_base(resized_image_path, base_image_path):
    """Place a resized image in the center of the base image"""
    with Image.open(base_image_path) as base_img, Image.open(resized_image_path) as top_img:
        base_img = base_img.convert('RGBA')
        top_img = top_img.convert('RGBA')
        
        x = (base_img.width - top_img.width) // 2
        y = (base_img.height - top_img.height) // 2
        
        combined = base_img.copy()
        combined.paste(top_img, (x, y), top_img)
        
        output_path = os.path.join(os.path.dirname(resized_image_path), "combined.png")
        combined = combined.convert('RGB')
        combined.save(output_path)
        return output_path
    
def save_debug_images(image_dict, debug_dir="debug_images"):
    """Save multiple debug images to a directory"""
    # Create debug directory if it doesn't exist
    os.makedirs(debug_dir, exist_ok=True)
    
    # Save each image in the dictionary
    for name, image_path in image_dict.items():
        if isinstance(image_path, str) and os.path.exists(image_path):
            with open(image_path, 'rb') as f:
                img_data = f.read()
            with open(os.path.join(debug_dir, f"debug_{name}.png"), "wb") as f:
                f.write(img_data)
        elif isinstance(image_path, str) and image_path.startswith('data:image/'):
            # Handle base64 images
            img_data = base64.b64decode(image_path.split(',')[1])
            with open(os.path.join(debug_dir, f"debug_{name}.png"), "wb") as f:
                f.write(img_data)

def generate_outpaint(input_image_path, mask_path, prompt="fill the image"):
    """Main function to process and outpaint an image"""
    print("generating outpaint")
    # Convert images to base64 for replicate
    with open(input_image_path, "rb") as img_file, open(mask_path, "rb") as mask_file:
        img_base64 = base64.b64encode(img_file.read()).decode()
        mask_base64 = base64.b64encode(mask_file.read()).decode()
        print("opened images")
    # Setup replicate input and run the model
    try:
        output = replicate.run(
            "black-forest-labs/flux-fill-pro",
            input={
                "image": f"data:image/png;base64,{img_base64}",
                "mask": f"data:image/png;base64,{mask_base64}",
                "prompt": prompt
            }
        )
        print("outpaint generated", output)
    except Exception as e:
        raise Exception("Failed to generate outpaint", e)
    # Download the result
    output_path = os.path.join(os.path.dirname(input_image_path), "output.png")
    response = requests.get(str(output))
    
    if response.status_code == 200:
        with open(output_path, "wb") as f:
            f.write(response.content)
    else:
        raise Exception("Failed to download the generated image")
    
    return output_path