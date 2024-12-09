import os
from PIL import Image
import replicate
from pathlib import Path
import tempfile
import base64
from io import BytesIO
import requests

os.environ["REPLICATE_API_TOKEN"] = "r8_OdArlBHK0KqvSPbVyMOKoX8csYJZcLT2KQhFd"

def process_uploaded_image(image_bytes):
    """Process an uploaded image from bytes"""
    with tempfile.TemporaryDirectory() as temp_dir:
        # Save the uploaded image
        input_path = os.path.join(temp_dir, "input.png")
        with open(input_path, "wb") as f:
            f.write(image_bytes)
        
        # Copy base and mask images to temp directory
        assets_dir = os.path.join(os.path.dirname(__file__), 'assets')
        base_path = os.path.join(temp_dir, "base.png")
        mask_path = os.path.join(temp_dir, "mask.png")
        
        # Create assets directory if it doesn't exist
        os.makedirs(assets_dir, exist_ok=True)
        
        # Copy base.png and mask.png from assets directory to temp directory
        for file in ['base.png', 'mask.png']:
            src = os.path.join(assets_dir, file)
            dst = os.path.join(temp_dir, file)
            
            # If the source file doesn't exist, create a default one
            if not os.path.exists(src):
                # Create a default white 800x800 image for base.png
                if file == 'base.png':
                    img = Image.new('RGB', (800, 800), 'white')
                    img.save(src)
                # Create a default black 800x800 image for mask.png
                else:
                    img = Image.new('RGB', (800, 800), 'black')
                    img.save(src)
            
            # Copy the file to temp directory
            with open(src, 'rb') as f_src:
                with open(dst, 'wb') as f_dst:
                    f_dst.write(f_src.read())
        
        # Generate outpainted image
        output_path = generate_outpaint(input_path, mask_path)
        
        # Read the output image and convert to base64
        with open(output_path, "rb") as f:
            output_bytes = f.read()
            base64_image = base64.b64encode(output_bytes).decode('utf-8')
            
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
    # Use the base_image_path that's in the same directory as the resized image
    base_path = os.path.join(os.path.dirname(resized_image_path), "base.png")
    
    with Image.open(base_path) as base_img, Image.open(resized_image_path) as top_img:
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

def generate_outpaint(input_image_path, mask_path, prompt="Extend this image naturally"):
    """Main function to process and outpaint an image"""
    # Resize the input image
    resized_path = resize_image(input_image_path)
    
    # Add to base image - pass the mask_path's directory base.png
    base_path = os.path.join(os.path.dirname(mask_path), "base.png")
    combined_path = add_image_to_base(resized_path, base_path)
    
    # Convert images to base64 for replicate
    with open(combined_path, "rb") as img_file, open(mask_path, "rb") as mask_file:
        img_base64 = base64.b64encode(img_file.read()).decode()
        mask_base64 = base64.b64encode(mask_file.read()).decode()
    
    # Setup replicate input and run the model
    output = replicate.run(
        "black-forest-labs/flux-fill-pro",
        input={
            "image": f"data:image/png;base64,{img_base64}",
            "mask": f"data:image/png;base64,{mask_base64}",
            "prompt": prompt
        }
    )
    
    # Download the result - output is now a FileOutput objectS
    output_path = os.path.join(os.path.dirname(input_image_path), "output.png")
    response = requests.get(str(output))  # Convert FileOutput to string to get URL
    
    if response.status_code == 200:
        with open(output_path, "wb") as f:
            f.write(response.content)
    else:
        raise Exception("Failed to download the generated image")
    
    return output_path