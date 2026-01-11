import cv2
import numpy as np
import os

class ProcessingService:
    def preprocess_image(self, input_path: str) -> str:
        """
        Reads an image, converts to grayscale, applies Otsu's thresholding
        to get a strictly black and white image.
        Returns path to processed image.
        """
        if not os.path.exists(input_path):
            raise FileNotFoundError(f"Image not found: {input_path}")
            
        # Read image
        img = cv2.imread(input_path)
        if img is None:
            raise ValueError(f"Could not read image: {input_path}")
            
        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Apply Otsu's thresholding
        # cv2.THRESH_BINARY_INV because usually we want lines (objects) to be white for contours, background black
        # But for saving/viewing we might want standard B&W. 
        # Let's produce the "standard" looking (White BG, Black Lines) for saving
        # And let the vectorizer handle the logic of what to trace.
        
        # Standard: 255 (White) is BG, 0 (Black) is Line
        # Otsu will determine threshold. 
        # THRESH_BINARY: if val > thresh -> maxval (255), else 0.
        # Plotter images are usually white BG.
        
        # Invert first if needed? No, assuming input is already roughly white BG black lines.
        # Just threshold to clean.
        
        # Using THRESH_BINARY + THRESH_OTSU
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        # Determine output path
        dir_name = os.path.dirname(input_path)
        base_name = os.path.basename(input_path)
        name, ext = os.path.splitext(base_name)
        output_filename = f"{name}_processed{ext}"
        output_path = os.path.join(dir_name, output_filename)
        
        # Save processed image
        cv2.imwrite(output_path, thresh)
        
        return output_path

processing_service = ProcessingService()
